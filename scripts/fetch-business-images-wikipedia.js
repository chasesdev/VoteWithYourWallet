#!/usr/bin/env node

/**
 * Fetch business images using Wikipedia CLI and API
 * 
 * This script:
 * 1. Reads businesses from your database
 * 2. Searches Wikipedia for each business
 * 3. Downloads high-quality images from Wikipedia/Wikimedia Commons
 * 4. Saves them locally and updates the database
 * 
 * Usage: node scripts/fetch-business-images-wikipedia.js
 */

const wikipedia = require('wikipedia');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { getDB } = require('../db/connection');
const { businesses, businessMedia } = require('../db/schema');

class WikipediaImageFetcher {
  constructor() {
    this.db = getDB();
    this.downloadDir = path.join(process.cwd(), 'public', 'images', 'businesses');
    this.ensureDirectoryExists();
  }

  async ensureDirectoryExists() {
    try {
      await fs.mkdir(this.downloadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating download directory:', error);
    }
  }

  // Download image from URL
  async downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
      const file = path.join(this.downloadDir, filename);
      const fileStream = require('fs').createWriteStream(file);
      
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(file);
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(file).catch(() => {}); // Delete partial file
          reject(err);
        });
      }).on('error', reject);
    });
  }

  // Search Wikipedia for business and get images
  async searchBusinessImages(businessName, businessCategory = '') {
    try {
      console.log(`🔍 Searching Wikipedia for: ${businessName}`);
      
      // Search for the business on Wikipedia
      const searchResults = await wikipedia.search(businessName, { limit: 5 });
      
      if (searchResults.results.length === 0) {
        console.log(`❌ No Wikipedia results for ${businessName}`);
        return { images: [], source: 'wikipedia' };
      }
      
      let bestMatch = null;
      let bestMatchScore = 0;
      
      // Find the best matching article
      for (const result of searchResults.results) {
        const score = this.calculateMatchScore(businessName, result.title);
        if (score > bestMatchScore) {
          bestMatch = result;
          bestMatchScore = score;
        }
      }
      
      if (!bestMatch) {
        console.log(`❌ No good Wikipedia match for ${businessName}`);
        return { images: [], source: 'wikipedia' };
      }
      
      console.log(`📄 Found Wikipedia article: ${bestMatch.title}`);
      
      // Get the full page to access images
      const page = await wikipedia.page(bestMatch.title);
      const images = await page.images();
      
      console.log(`🖼️  Found ${images.length} images for ${businessName}`);
      
      // Filter for high-quality images
      const goodImages = images
        .filter(img => {
          const url = img.toLowerCase();
          return (
            (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) &&
            !url.includes('commons-logo') &&
            !url.includes('wiki.png') &&
            !url.includes('edit-icon') &&
            !url.includes('wikidata') &&
            url.includes('wikipedia.org') || url.includes('wikimedia.org')
          );
        })
        .slice(0, 3); // Limit to 3 best images
      
      return {
        images: goodImages,
        source: 'wikipedia',
        articleTitle: bestMatch.title,
        articleUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(bestMatch.title)}`
      };
      
    } catch (error) {
      console.error(`❌ Error searching Wikipedia for ${businessName}:`, error.message);
      return { images: [], source: 'wikipedia', error: error.message };
    }
  }

  // Calculate how well a Wikipedia title matches our business name
  calculateMatchScore(businessName, wikipediaTitle) {
    const business = businessName.toLowerCase();
    const title = wikipediaTitle.toLowerCase();
    
    // Exact match gets highest score
    if (business === title) return 100;
    
    // Check if business name is contained in title
    if (title.includes(business)) return 80;
    
    // Check if title is contained in business name
    if (business.includes(title)) return 70;
    
    // Check word overlap
    const businessWords = business.split(/\s+/);
    const titleWords = title.split(/\s+/);
    
    let commonWords = 0;
    for (const word of businessWords) {
      if (titleWords.includes(word) && word.length > 2) {
        commonWords++;
      }
    }
    
    const overlapScore = (commonWords / Math.max(businessWords.length, titleWords.length)) * 60;
    
    return overlapScore;
  }

  // Save image to database
  async saveImageToDatabase(businessId, imageUrl, imageType = 'photo', localPath = null) {
    try {
      const imageData = {
        businessId,
        type: imageType,
        url: localPath || imageUrl,
        source: 'wikipedia',
        isActive: true,
        createdAt: new Date()
      };

      if (localPath) {
        imageData.originalUrl = imageUrl;
      }

      await this.db.insert(businessMedia).values(imageData);
      return true;
    } catch (error) {
      console.error('Error saving image to database:', error);
      return false;
    }
  }

  // Process a single business
  async processBusiness(business) {
    try {
      console.log(`\n🏢 Processing: ${business.name} (ID: ${business.id})`);
      
      // Search for images
      const result = await this.searchBusinessImages(business.name, business.category);
      
      if (result.images.length === 0) {
        console.log(`❌ No images found for ${business.name}`);
        return { success: false, businessId: business.id, error: 'No images found' };
      }
      
      const downloadedImages = [];
      
      // Download each image
      for (let i = 0; i < result.images.length; i++) {
        const imageUrl = result.images[i];
        
        try {
          console.log(`📥 Downloading image ${i + 1}/${result.images.length}...`);
          
          // Create filename
          const businessNameSafe = business.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
          const timestamp = Date.now();
          const extension = imageUrl.includes('.png') ? 'png' : 'jpg';
          const filename = `${businessNameSafe}_${business.id}_${i + 1}_${timestamp}.${extension}`;
          
          // Download the image
          const localPath = await this.downloadImage(imageUrl, filename);
          const publicPath = `/images/businesses/${filename}`;
          
          // Save to database
          const imageType = i === 0 ? 'logo' : 'photo'; // First image as logo, rest as photos
          const saved = await this.saveImageToDatabase(
            business.id, 
            imageUrl, 
            imageType, 
            publicPath
          );
          
          if (saved) {
            downloadedImages.push({
              url: imageUrl,
              localPath: publicPath,
              type: imageType
            });
            console.log(`✅ Downloaded and saved: ${filename}`);
          }
          
          // Rate limiting - be respectful to Wikipedia
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (imageError) {
          console.error(`❌ Failed to download image ${i + 1}:`, imageError.message);
        }
      }
      
      return {
        success: downloadedImages.length > 0,
        businessId: business.id,
        imagesDownloaded: downloadedImages.length,
        images: downloadedImages,
        wikipediaArticle: result.articleTitle
      };
      
    } catch (error) {
      console.error(`❌ Error processing business ${business.name}:`, error.message);
      return { success: false, businessId: business.id, error: error.message };
    }
  }

  // Main execution function
  async run(limit = null, businessName = null) {
    try {
      console.log('🚀 Starting Wikipedia image fetching...');
      
      // Get businesses from database
      let query = this.db.select().from(businesses);
      
      if (businessName) {
        query = query.where(businesses.name.like(`%${businessName}%`));
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const businessList = await query;
      
      console.log(`📋 Found ${businessList.length} businesses to process`);
      
      const results = [];
      
      // Process each business
      for (let i = 0; i < businessList.length; i++) {
        const business = businessList[i];
        console.log(`\n⏳ Progress: ${i + 1}/${businessList.length}`);
        
        const result = await this.processBusiness(business);
        results.push(result);
        
        // Rate limiting between businesses
        if (i < businessList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Summary
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const totalImages = results.reduce((sum, r) => sum + (r.imagesDownloaded || 0), 0);
      
      console.log('\n📊 SUMMARY:');
      console.log(`✅ Successful: ${successful}/${businessList.length} businesses`);
      console.log(`❌ Failed: ${failed}/${businessList.length} businesses`);
      console.log(`🖼️  Total images downloaded: ${totalImages}`);
      
      // Show failures
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        console.log('\n❌ Failed businesses:');
        failures.forEach(f => {
          const business = businessList.find(b => b.id === f.businessId);
          console.log(`  - ${business?.name || f.businessId}: ${f.error || 'Unknown error'}`);
        });
      }
      
      return results;
      
    } catch (error) {
      console.error('💥 Fatal error:', error);
      throw error;
    }
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  let limit = null;
  let businessName = null;
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && i + 1 < args.length) {
      limit = parseInt(args[i + 1]);
    } else if (args[i] === '--business' && i + 1 < args.length) {
      businessName = args[i + 1];
    } else if (args[i] === '--help') {
      console.log(`
Usage: node scripts/fetch-business-images-wikipedia.js [options]

Options:
  --limit N       Limit to N businesses (default: all)
  --business NAME Search for specific business name
  --help          Show this help

Examples:
  node scripts/fetch-business-images-wikipedia.js
  node scripts/fetch-business-images-wikipedia.js --limit 5
  node scripts/fetch-business-images-wikipedia.js --business "Starbucks"
      `);
      process.exit(0);
    }
  }
  
  // Run the fetcher
  const fetcher = new WikipediaImageFetcher();
  
  fetcher.run(limit, businessName)
    .then((results) => {
      console.log('\n🎉 Complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = WikipediaImageFetcher;