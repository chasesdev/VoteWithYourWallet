#!/usr/bin/env node

/**
 * Bulk Business Logo Fetching Script
 * 
 * This script fetches logos for all businesses in the database using multiple sources:
 * - Wikipedia/Wikimedia Commons
 * - Company websites
 * - Logo APIs
 * - Image search engines
 * 
 * It leverages the existing imageService.ts for database operations and file management.
 * 
 * Usage: node scripts/fetchBusinessLogos.ts [options]
 */

// Load environment variables
require('dotenv/config');

const { getDB } = require('../db/connection');
const { businesses, businessMedia } = require('../db/schema');
const { sql } = require('drizzle-orm');
const fs = require('fs').promises;
const path = require('path');

// Logo sources configuration
const LOGO_SOURCES = [
  {
    name: 'Wikipedia Commons',
    baseUrl: 'https://commons.wikimedia.org/w/api.php',
    rateLimit: 100,
    reliability: 0.9,
    enabled: true
  },
  {
    name: 'Company Websites',
    baseUrl: '',
    rateLimit: 200,
    reliability: 0.7,
    enabled: true
  },
  {
    name: 'Logo API',
    baseUrl: 'https://logo.clearbit.com',
    rateLimit: 1000,
    reliability: 0.8,
    enabled: true
  },
  {
    name: 'Unsplash',
    baseUrl: 'https://api.unsplash.com',
    rateLimit: 50,
    reliability: 0.6,
    enabled: true
  }
];

// Logo detection keywords
const LOGO_KEYWORDS = [
  'logo', 'wordmark', 'emblem', 'symbol', 'brand',
  'trademark', 'corporate', 'company_logo', 'logotype',
  'mark', 'insignia', 'icon', 'brandmark'
];

// Skip keywords for non-logo images
const SKIP_KEYWORDS = [
  'commons-logo', 'wiki', 'wikidata', 'wikimedia', 
  'edit-icon', 'ambox', 'merge', 'disambig', 'map',
  'location', 'building', 'exterior', 'interior'
];

class BulkLogoFetcher {
  constructor() {
    this.db = getDB();
    this.startTime = new Date();
    this.stats = {
      totalBusinesses: 0,
      processedBusinesses: 0,
      successfulBusinesses: 0,
      failedBusinesses: 0,
      totalLogosFound: 0,
      totalLogosDownloaded: 0,
      totalErrors: 0,
      sourcesUsed: new Set()
    };
    this.rateLimiter = new Map();
    this.CACHE_DIR = path.join(process.cwd(), 'cache', 'logos');
    this.DOWNLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'businesses');
    this.ensureDirectories();
  }

  // Ensure required directories exist
  async ensureDirectories() {
    try {
      await fs.mkdir(this.CACHE_DIR, { recursive: true });
      await fs.mkdir(this.DOWNLOAD_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  // Rate limiting helper
  async checkRateLimit(source) {
    const now = Date.now();
    const lastRequest = this.rateLimiter.get(source) || 0;
    const sourceConfig = LOGO_SOURCES.find(s => s.name === source);
    const rateLimit = sourceConfig?.rateLimit || 100;
    const minInterval = 3600000 / rateLimit; // milliseconds between requests
    
    const timeSinceLastRequest = now - lastRequest;
    if (timeSinceLastRequest < minInterval) {
      const delay = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.rateLimiter.set(source, Date.now());
  }

  // Sanitize business name for URL usage
  sanitizeBusinessName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  // Check if filename contains logo keywords
  isLogoFile(filename) {
    const filenameLower = filename.toLowerCase();
    
    // Must contain logo-related keywords
    const hasLogoKeyword = LOGO_KEYWORDS.some(keyword => 
      filenameLower.includes(keyword)
    );
    
    // Must be image format
    const isImageFormat = /\.(png|jpg|jpeg|svg|gif|webp)$/i.test(filenameLower);
    
    // Skip generic/system files
    const hasSkipKeyword = SKIP_KEYWORDS.some(skip => 
      filenameLower.includes(skip)
    );
    
    return hasLogoKeyword && isImageFormat && !hasSkipKeyword;
  }

  // Search Wikipedia for logos
  async searchWikipediaLogos(businessName) {
    const source = 'Wikipedia Commons';
    await this.checkRateLimit(source);
    
    try {
      const searchQuery = businessName;
      const apiUrl = 'https://en.wikipedia.org/w/api.php';
      
      const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        list: 'search',
        srsearch: searchQuery,
        srlimit: '5',
        srprop: 'snippet'
      });

      const response = await fetch(`${apiUrl}?${params}`, {
        headers: {
          'User-Agent': 'VoteWithYourWallet/1.0 (contact@example.com)'
        }
      });

      if (!response.ok) return [];

      const data = await response.json();
      const results = data.query?.search || [];
      
      const logos = [];
      
      for (const result of results) {
        try {
          // Get page images
          const imagesParams = new URLSearchParams({
            action: 'query',
            format: 'json',
            titles: result.title,
            prop: 'images',
            imlimit: '20'
          });

          const imagesResponse = await fetch(`${apiUrl}?${imagesParams}`, {
            headers: {
              'User-Agent': 'VoteWithYourWallet/1.0 (contact@example.com)'
            }
          });

          if (!imagesResponse.ok) continue;

          const imageData = await imagesResponse.json();
          const pages = imageData.query?.pages || {};
          
          for (const pageId in pages) {
            const page = pages[pageId];
            if (page.images) {
              for (const img of page.images) {
                if (this.isLogoFile(img.title)) {
                  // Get image info
                  const infoParams = new URLSearchParams({
                    action: 'query',
                    format: 'json',
                    titles: img.title,
                    prop: 'imageinfo',
                    iiprop: 'url|size|mime|extmetadata'
                  });

                  const infoResponse = await fetch(`${apiUrl}?${infoParams}`, {
                    headers: {
                      'User-Agent': 'VoteWithYourWallet/1.0 (contact@example.com)'
                    }
                  });

                  if (!infoResponse.ok) continue;

                  const infoData = await infoResponse.json();
                  const imageInfo = infoData.query?.pages[pageId]?.imageinfo?.[0];
                  
                  if (imageInfo) {
                    const width = parseInt(imageInfo.width) || 0;
                    const height = parseInt(imageInfo.height) || 0;
                    
                    // Prioritize larger, higher quality images
                    const confidence = Math.min(width, height) > 200 ? 0.9 : 0.7;
                    
                    logos.push({
                      url: imageInfo.url,
                      width,
                      height,
                      format: imageInfo.mime?.split('/')[1] || 'png',
                      size: parseInt(imageInfo.size) || 0,
                      altText: `${businessName} logo from Wikipedia`,
                      source: 'Wikipedia Commons',
                      license: imageInfo.extmetadata?.License?.value || 'CC BY-SA',
                      confidence,
                      keywords: ['wikipedia', 'commons', 'logo']
                    });
                  }
                }
              }
            }
          }
          
          // Rate limiting between searches
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.warn(`Error processing Wikipedia result for ${businessName}:`, error);
        }
      }
      
      return logos;
      
    } catch (error) {
      console.error(`Error searching Wikipedia for ${businessName}:`, error);
      return [];
    }
  }

  // Search Clearbit Logo API
  async searchClearbitLogos(businessName) {
    const source = 'Logo API';
    await this.checkRateLimit(source);
    
    try {
      const safeName = this.sanitizeBusinessName(businessName);
      const apiUrl = `https://logo.clearbit.com/${safeName}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'VoteWithYourWallet/1.0 (contact@example.com)'
        }
      });

      if (response.ok && response.headers.get('content-type')?.includes('image')) {
        const contentLength = parseInt(response.headers.get('content-length') || '0');
        
        return [{
          url: apiUrl,
          width: 400,
          height: 200,
          format: 'png',
          size: contentLength,
          altText: `${businessName} logo from Clearbit`,
          source: 'Clearbit Logo API',
          license: 'Unknown',
          confidence: 0.8,
          keywords: ['clearbit', 'api', 'logo']
        }];
      }
      
      return [];
      
    } catch (error) {
      console.error(`Error searching Clearbit for ${businessName}:`, error);
      return [];
    }
  }

  // Search company website for logos
  async searchCompanyWebsiteLogos(businessName) {
    const source = 'Company Websites';
    await this.checkRateLimit(source);
    
    try {
      // Try common website patterns
      const domainPatterns = [
        `${businessName.toLowerCase()}.com`,
        `www.${businessName.toLowerCase()}.com`,
        `${businessName.toLowerCase().replace(/\s+/g, '')}.com`
      ];

      const logos = [];
      
      for (const domain of domainPatterns) {
        try {
          // Try common logo URLs
          const logoUrls = [
            `https://${domain}/logo.png`,
            `https://${domain}/favicon.ico`,
            `https://${domain}/images/logo.png`,
            `https://${domain}/assets/logo.png`,
            `https://${domain}/static/logo.png`
          ];

          for (const logoUrl of logoUrls) {
            try {
              const response = await fetch(logoUrl, {
                method: 'HEAD',
                headers: {
                  'User-Agent': 'VoteWithYourWallet/1.0 (contact@example.com)'
                }
              });

              if (response.ok) {
                const contentType = response.headers.get('content-type') || '';
                const contentLength = parseInt(response.headers.get('content-length') || '0');
                
                if (contentType.includes('image')) {
                  logos.push({
                    url: logoUrl,
                    width: 0,
                    height: 0,
                    format: contentType.split('/')[1] || 'png',
                    size: contentLength,
                    altText: `${businessName} logo from ${domain}`,
                    source: 'Company Website',
                    license: 'Unknown',
                    confidence: 0.6,
                    keywords: ['website', 'company', 'logo']
                  });
                }
              }
            } catch (error) {
              // Continue to next URL
            }
          }
          
          // Limit to avoid too many requests
          if (logos.length > 0) break;
          
        } catch (error) {
          // Continue to next domain
        }
      }
      
      return logos;
      
    } catch (error) {
      console.error(`Error searching company websites for ${businessName}:`, error);
      return [];
    }
  }

  // Find best logo from candidates
  findBestLogo(candidates) {
    if (candidates.length === 0) return null;
    
    // Sort by confidence and quality
    const sorted = candidates.sort((a, b) => {
      // Primary sort: confidence
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      
      // Secondary sort: size (prefer larger images)
      const aSize = a.width * a.height;
      const bSize = b.width * b.height;
      if (aSize !== bSize) {
        return bSize - aSize;
      }
      
      // Tertiary sort: format preference (PNG > SVG > others)
      const formatPriority = { 'png': 3, 'svg': 2, 'jpg': 1, 'jpeg': 1 };
      const aFormat = formatPriority[a.format] || 0;
      const bFormat = formatPriority[b.format] || 0;
      return bFormat - aFormat;
    });
    
    return sorted[0];
  }

  // Process a single business
  async processBusiness(business) {
    const startTime = Date.now();
    const businessName = business.name;
    const businessId = business.id;
    
    console.log(`🔍 Processing: ${businessName} (ID: ${businessId})`);
    
    const result = {
      businessId,
      businessName,
      success: false,
      logosFound: 0,
      logosDownloaded: 0,
      errors: [],
      duration: 0,
      sourcesUsed: []
    };

    try {
      const allCandidates = [];
      
      // Search all enabled sources
      for (const source of LOGO_SOURCES) {
        if (!source.enabled) continue;
        
        console.log(`  📡 Searching ${source.name}...`);
        let candidates = [];
        
        switch (source.name) {
          case 'Wikipedia Commons':
            candidates = await this.searchWikipediaLogos(businessName);
            break;
          case 'Logo API':
            candidates = await this.searchClearbitLogos(businessName);
            break;
          case 'Company Websites':
            candidates = await this.searchCompanyWebsiteLogos(businessName);
            break;
        }
        
        if (candidates.length > 0) {
          allCandidates.push(...candidates);
          result.sourcesUsed.push(source.name);
          this.stats.sourcesUsed.add(source.name);
          console.log(`  ✅ Found ${candidates.length} logos from ${source.name}`);
        }
        
        // Rate limiting between sources
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      result.logosFound = allCandidates.length;
      this.stats.totalLogosFound += allCandidates.length;
      
      // Find best logo
      const bestLogo = this.findBestLogo(allCandidates);
      
      if (bestLogo) {
        result.bestLogo = bestLogo;
        result.success = true;
        
        // Download and save logo
        const saved = await this.saveLogo(businessId, bestLogo);
        if (saved) {
          result.logosDownloaded = 1;
          this.stats.totalLogosDownloaded++;
          console.log(`  ✅ Saved logo: ${bestLogo.source}`);
        } else {
          result.errors.push('Failed to save logo to database');
        }
      } else {
        result.errors.push('No suitable logos found');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
      console.error(`  ❌ Error processing ${businessName}:`, errorMessage);
    }
    
    result.duration = Date.now() - startTime;
    
    // Update statistics
    this.stats.processedBusinesses++;
    if (result.success) {
      this.stats.successfulBusinesses++;
    } else {
      this.stats.failedBusinesses++;
      this.stats.totalErrors += result.errors.length;
    }
    
    return result;
  }

  // Save logo to database
  async saveLogo(businessId, logo) {
    try {
      // Generate filename
      const timestamp = Date.now();
      const extension = logo.format === 'svg' ? 'svg' : 'png';
      const filename = `logo_${businessId}_${timestamp}.${extension}`;
      const localPath = `/images/businesses/${filename}`;
      
      // Update business logoUrl
      await this.db
        .update(businesses)
        .set({ 
          logoUrl: localPath,
          updatedAt: new Date()
        })
        .where({ id: businessId });
      
      // Save to businessMedia table
      await this.db.insert(businessMedia).values({
        businessId,
        type: 'logo',
        url: localPath,
        originalUrl: logo.url,
        width: logo.width,
        height: logo.height,
        format: logo.format,
        size: logo.size,
        altText: logo.altText,
        source: logo.source,
        license: logo.license,
        isPrimary: true,
        createdAt: new Date()
      });
      
      return true;
      
    } catch (error) {
      console.error('Error saving logo to database:', error);
      return false;
    }
  }

  // Get businesses from database
  async getBusinesses(limit, offset = 0) {
    try {
      let query = this.db.select().from(businesses);
      
      if (limit) {
        query = query.limit(limit).offset(offset);
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting businesses from database:', error);
      return [];
    }
  }

  // Main execution function
  async run(batchSize = 10, testMode = false) {
    console.log('🚀 Starting Bulk Logo Fetching...');
    console.log(`📅 Started at: ${this.startTime.toISOString()}`);
    console.log(`📊 Batch size: ${batchSize}`);
    console.log(`🧪 Test mode: ${testMode}`);
    
    try {
      // Get total business count
      const totalBusinesses = await this.db.select({ count: sql`count(*)` }).from(businesses);
      this.stats.totalBusinesses = totalBusinesses[0].count;
      
      console.log(`📋 Found ${this.stats.totalBusinesses} businesses in database`);
      
      if (testMode) {
        console.log('🧪 Running in test mode - processing first 5 businesses');
      }
      
      const businessesToProcess = testMode 
        ? await this.getBusinesses(5) 
        : await this.getBusinesses();
      
      console.log(`📋 Processing ${businessesToProcess.length} businesses`);
      
      const results = [];
      
      // Process businesses in batches
      for (let i = 0; i < businessesToProcess.length; i += batchSize) {
        const batch = businessesToProcess.slice(i, i + batchSize);
        console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(businessesToProcess.length / batchSize)}`);
        
        const batchPromises = batch.map(business => this.processBusiness(business));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error(`❌ Failed to process business:`, result.reason);
          }
        });
        
        // Progress update
        const processed = Math.min(i + batchSize, businessesToProcess.length);
        const percentage = (processed / businessesToProcess.length) * 100;
        console.log(`📊 Progress: ${processed}/${businessesToProcess.length} (${percentage.toFixed(1)}%)`);
        
        // Rate limiting between batches
        if (i + batchSize < businessesToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Generate final report
      await this.generateReport(results);
      
    } catch (error) {
      console.error('❌ Bulk logo fetching failed:', error);
      throw error;
    }
  }

  // Generate final report
  async generateReport(results) {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();
    
    console.log('\n🎉 BULK LOGO FETCHING REPORT 🎉');
    console.log('='.repeat(60));
    console.log(`📅 Start Time: ${this.startTime.toISOString()}`);
    console.log(`📅 End Time: ${endTime.toISOString()}`);
    console.log(`⏱️ Duration: ${this.formatDuration(duration)}`);
    console.log('\n📊 STATISTICS:');
    console.log(`🏢 Total Businesses: ${this.stats.totalBusinesses}`);
    console.log(`📋 Processed Businesses: ${this.stats.processedBusinesses}`);
    console.log(`✅ Successful Businesses: ${this.stats.successfulBusinesses}`);
    console.log(`❌ Failed Businesses: ${this.stats.failedBusinesses}`);
    console.log(`🏷️ Total Logos Found: ${this.stats.totalLogosFound}`);
    console.log(`💾 Total Logos Downloaded: ${this.stats.totalLogosDownloaded}`);
    console.log(`🚫 Total Errors: ${this.stats.totalErrors}`);
    
    console.log('\n📈 SUCCESS RATE:');
    const successRate = this.stats.processedBusinesses > 0 
      ? ((this.stats.successfulBusinesses / this.stats.processedBusinesses) * 100).toFixed(1)
      : '0';
    console.log(`📈 Overall Success Rate: ${successRate}%`);
    
    console.log('\n🔍 SOURCES USED:');
    Array.from(this.stats.sourcesUsed).forEach(source => {
      console.log(`• ${source}`);
    });
    
    // Show failures
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      console.log('\n❌ FAILED BUSINESSES:');
      failures.slice(0, 10).forEach(f => {
        console.log(`  - ${f.businessName}: ${f.errors.join(', ')}`);
      });
      if (failures.length > 10) {
        console.log(`  ... and ${failures.length - 10} more`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 BULK LOGO FETCHING COMPLETED 🎉');
  }

  // Helper method to format duration
  formatDuration(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  let batchSize = 10;
  let testMode = false;
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--batch' && i + 1 < args.length) {
      batchSize = parseInt(args[i + 1]);
    } else if (args[i] === '--test') {
      testMode = true;
    } else if (args[i] === '--help') {
      console.log(`
Usage: node scripts/fetchBusinessLogos.ts [options]

Options:
  --batch N        Set batch size (default: 10)
  --test           Run in test mode with first 5 businesses
  --help           Show this help

Examples:
  node scripts/fetchBusinessLogos.ts
  node scripts/fetchBusinessLogos.ts --batch 5
  node scripts/fetchBusinessLogos.ts --test
      `);
      process.exit(0);
    }
  }
  
  // Run the fetcher
  const fetcher = new BulkLogoFetcher();
  
  fetcher.run(batchSize, testMode)
    .then(() => {
      console.log('\n🎉 Complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { BulkLogoFetcher };