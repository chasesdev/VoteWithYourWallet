#!/usr/bin/env node

/**
 * Download Business Logos
 * 
 * This script downloads real logo images for businesses from official sources
 * and saves them to the company_logos directory, avoiding Wikipedia/Google Images
 */

import { config } from 'dotenv';
import { getDB } from '../db/connection';
import { businesses } from '../db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

// Load environment variables
config();

// Create company_logos directory if it doesn't exist
const logoDir = path.join(process.cwd(), 'company_logos');
if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true });
}

// Official logo sources for major businesses
const OFFICIAL_LOGO_SOURCES: Record<string, string> = {
  'Patagonia': 'https://www.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dw8b4e8b34/images/hi-res/39516_BLK.jpg',
  'Chick-fil-A': 'https://d1fd34dzzl09j.cloudfront.net/Images/CFACOM/Home%20Page/Refresh/Mobile_CFALogo_180_Red.png',
  "Ben & Jerry's": 'https://www.benjerry.com/files/live/sites/systemsite/files/flavors/products/us/pint/original-chunks-and-swirls/chocolate-fudge-brownie/chocolate-fudge-brownie-detail.png',
  'Tesla': 'https://www.tesla.com/themes/custom/tesla_frontend/assets/img/logo.svg',
  'Walmart': 'https://corporate.walmart.com/content/dam/corporate/images/logos/walmart-logo.png',
  'South Coast Plaza': 'https://www.southcoastplaza.com/images/logo.svg',
  'Disneyland Resort': 'https://lumiere-a.akamaihd.net/v1/images/disney_logo_nov_2019_5ad04e48.png',
  'John Wayne Airport': 'https://www.ocair.com/images/jwa-logo.svg',
  'UC Irvine': 'https://www.communications.uci.edu/images/uci-logo-blue.svg',
  'The Irvine Company': 'https://www.theirvinecompany.com/wp-content/themes/tic/images/logo.svg',
  'Angel Stadium': 'https://www.mlbstatic.com/team-logos/league/mlb/108.svg',
  'Honda Center': 'https://www.hondacenter.com/assets/img/honda-center-logo.svg'
};

// Fallback logo finder - searches common logo paths on company websites
const COMMON_LOGO_PATHS = [
  '/logo.svg',
  '/images/logo.svg',
  '/assets/logo.svg',
  '/wp-content/themes/*/images/logo.svg',
  '/logo.png',
  '/images/logo.png',
  '/assets/logo.png'
];

function downloadFile(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const request = protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(filepath);
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
        
        file.on('error', (err) => {
          fs.unlink(filepath, () => {}); // Delete partial file
          reject(err);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadFile(redirectUrl, filepath).then(resolve).catch(reject);
        } else {
          reject(new Error(`Redirect without location: ${response.statusCode}`));
        }
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
      }
    });
    
    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

function getFileExtension(url: string): string {
  const urlPath = new URL(url).pathname;
  const ext = path.extname(urlPath).toLowerCase();
  return ext || '.png'; // Default to PNG if no extension
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

async function findLogoOnWebsite(websiteUrl: string, businessName: string): Promise<string | null> {
  // This is a simplified implementation
  // In a real-world scenario, you'd use a web scraping library like puppeteer
  console.log(`  Searching for logo on ${websiteUrl} (manual implementation needed)`);
  return null;
}

async function downloadBusinessLogos() {
  console.log('🎯 Downloading business logos from official sources...\n');
  
  try {
    const db = getDB();
    const allBusinesses = await db.select().from(businesses);
    
    let successCount = 0;
    let failureCount = 0;
    const results: Array<{name: string, status: string, logoPath?: string, error?: string}> = [];

    for (const business of allBusinesses) {
      console.log(`📥 Processing ${business.name}...`);
      
      try {
        let logoUrl: string | null = null;
        let logoPath: string | null = null;
        
        // 1. Try official logo sources first
        if (OFFICIAL_LOGO_SOURCES[business.name]) {
          logoUrl = OFFICIAL_LOGO_SOURCES[business.name];
          console.log(`  Found in official sources: ${logoUrl}`);
        }
        
        // 2. If no official source and business has website, try to find logo
        else if (business.website) {
          logoUrl = await findLogoOnWebsite(business.website, business.name);
        }
        
        // 3. Try to construct likely logo URLs for major brands
        if (!logoUrl && business.website) {
          const domain = new URL(business.website).hostname;
          const possibleUrls = [
            `https://${domain}/logo.svg`,
            `https://${domain}/images/logo.svg`,
            `https://${domain}/assets/logo.svg`,
            `https://${domain}/logo.png`,
            `https://${domain}/images/logo.png`,
          ];
          
          for (const url of possibleUrls) {
            try {
              // Try to head request to check if file exists
              await new Promise<void>((resolve, reject) => {
                const protocol = url.startsWith('https:') ? https : http;
                const req = protocol.request(url, { method: 'HEAD' }, (res) => {
                  if (res.statusCode === 200) {
                    logoUrl = url;
                    console.log(`  Found logo at: ${url}`);
                    resolve();
                  } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                  }
                });
                req.setTimeout(5000, () => {
                  req.destroy();
                  reject(new Error('Timeout'));
                });
                req.on('error', reject);
                req.end();
              });
              break; // Found one, stop looking
            } catch {
              // Continue to next URL
            }
          }
        }
        
        // Download the logo if found
        if (logoUrl) {
          const filename = `${sanitizeFilename(business.name)}${getFileExtension(logoUrl)}`;
          const filepath = path.join(logoDir, filename);
          
          await downloadFile(logoUrl, filepath);
          logoPath = `company_logos/${filename}`;
          
          // Update database with local logo path
          await db
            .update(businesses)
            .set({ logoUrl: logoPath })
            .where(eq(businesses.id, business.id));
          
          console.log(`  ✅ Downloaded: ${logoPath}`);
          successCount++;
          results.push({ name: business.name, status: 'success', logoPath });
        } else {
          console.log(`  ⚠️  No logo found for ${business.name}`);
          failureCount++;
          results.push({ name: business.name, status: 'not_found' });
        }
        
      } catch (error) {
        console.log(`  ❌ Error downloading logo for ${business.name}: ${error}`);
        failureCount++;
        results.push({ 
          name: business.name, 
          status: 'error', 
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      console.log(''); // Empty line for readability
    }

    // Summary
    console.log('📊 Logo Download Summary:');
    console.log(`Total businesses: ${allBusinesses.length}`);
    console.log(`Successfully downloaded: ${successCount}`);
    console.log(`Failed to download: ${failureCount}`);
    console.log(`Success rate: ${((successCount / allBusinesses.length) * 100).toFixed(1)}%`);

    // Detailed results
    console.log('\n📋 Detailed Results:');
    results.forEach(result => {
      if (result.status === 'success') {
        console.log(`✅ ${result.name}: ${result.logoPath}`);
      } else if (result.status === 'not_found') {
        console.log(`⚠️  ${result.name}: No logo found`);
      } else {
        console.log(`❌ ${result.name}: ${result.error}`);
      }
    });

    console.log('\n✅ Logo download process completed!');
    
  } catch (error) {
    console.error('❌ Logo download process failed:', error);
    throw error;
  }
}

// Execute the download
if (require.main === module) {
  downloadBusinessLogos()
    .then(() => {
      console.log('\n🎉 Business logo download completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Business logo download failed:', error);
      process.exit(1);
    });
}

export { downloadBusinessLogos };