#!/usr/bin/env node

/**
 * Link Company Logos
 * 
 * This script properly links all company logos in the database
 * and verifies that logo files exist and are accessible
 */

import { config } from 'dotenv';
import { getDB } from '../db/connection';
import { businesses } from '../db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Load environment variables
config();

const logoDir = path.join(process.cwd(), 'company_logos');

// Map business names to their expected logo filenames
const businessLogoMapping: Record<string, string> = {
  'Patagonia': 'patagonia.png',
  'Chick-fil-A': 'chick_fil_a.png',
  "Ben & Jerry's": 'ben___jerry_s.png',
  'Tesla': 'tesla.png',
  'Walmart': 'walmart.png',
  'South Coast Plaza': 'south_coast_plaza.png',
  'Disneyland Resort': 'disneyland_resort.png',
  'John Wayne Airport': 'john_wayne_airport.png',
  'UC Irvine': 'uc_irvine.png',
  'The Irvine Company': 'the_irvine_company.svg',
  'Spectrum Center': 'spectrum_center.png',
  'Angel Stadium': 'angel_stadium.png',
  'Honda Center': 'honda_center.png',
  'The OC Fair & Event Center': 'the_oc_fair___event_center.png',
  'Orange County Great Park': 'orange_county_great_park.png',
  'Newport Beach Pier': 'newport_beach_pier.png',
  'Laguna Beach Art Museum': 'laguna_beach_art_museum.png',
  'Crystal Cove State Park': 'crystal_cove_state_park.png',
  'The Bowers Museum': 'the_bowers_museum.png',
  'Discovery Cube Orange County': 'discovery_cube_orange_county.png',
  'Fashion Island Newport Beach': 'fashion_island_newport_beach.png',
  'Irvine Spectrum Center': 'irvine_spectrum_center.png',
  'Mission San Juan Capistrano': 'mission_san_juan_capistrano.png',
  'Balboa Island': 'balboa_island.png',
  'The Ritz-Carlton Laguna Niguel': 'the_ritz_carlton_laguna_niguel.png',
  'Dana Point Harbor': 'dana_point_harbor.png'
};

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function findLogoFile(businessName: string): string | null {
  // First try the exact mapping
  if (businessLogoMapping[businessName]) {
    const expectedPath = path.join(logoDir, businessLogoMapping[businessName]);
    if (fs.existsSync(expectedPath)) {
      return businessLogoMapping[businessName];
    }
  }
  
  // Try sanitized filename variations
  const baseName = sanitizeFilename(businessName);
  const possibleExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
  
  for (const ext of possibleExtensions) {
    const filename = baseName + ext;
    const filepath = path.join(logoDir, filename);
    if (fs.existsSync(filepath)) {
      return filename;
    }
  }
  
  // Try partial matches in existing files
  if (fs.existsSync(logoDir)) {
    const files = fs.readdirSync(logoDir);
    const lowerBusinessName = businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (const file of files) {
      const lowerFilename = file.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (lowerFilename.includes(lowerBusinessName.substring(0, 5)) || 
          lowerBusinessName.includes(lowerFilename.replace(/\.[^.]*$/, '').substring(0, 5))) {
        return file;
      }
    }
  }
  
  return null;
}

async function linkCompanyLogos() {
  console.log('🔗 Linking company logos in database...\n');
  
  try {
    const db = getDB();
    
    // Check if logo directory exists
    if (!fs.existsSync(logoDir)) {
      console.log('⚠️ Logo directory does not exist. Creating it...');
      fs.mkdirSync(logoDir, { recursive: true });
    }
    
    // List existing logo files
    const existingFiles = fs.existsSync(logoDir) ? fs.readdirSync(logoDir) : [];
    console.log('📁 Existing logo files:');
    if (existingFiles.length > 0) {
      existingFiles.forEach(file => {
        const filepath = path.join(logoDir, file);
        const stats = fs.statSync(filepath);
        console.log(`  ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
      });
    } else {
      console.log('  No logo files found');
    }
    console.log('');
    
    // Get all businesses
    const allBusinesses = await db.select().from(businesses);
    
    let linkedCount = 0;
    let missingCount = 0;
    const results: Array<{name: string, status: string, logoPath?: string, issue?: string}> = [];
    
    for (const business of allBusinesses) {
      console.log(`🔍 Checking ${business.name}...`);
      
      // Find logo file
      const logoFile = findLogoFile(business.name);
      
      if (logoFile) {
        const logoPath = `company_logos/${logoFile}`;
        const fullPath = path.join(logoDir, logoFile);
        const stats = fs.statSync(fullPath);
        
        // Update database
        await db
          .update(businesses)
          .set({ logoUrl: logoPath })
          .where(eq(businesses.id, business.id));
        
        console.log(`  ✅ Linked: ${logoPath} (${(stats.size / 1024).toFixed(1)} KB)`);
        linkedCount++;
        results.push({ name: business.name, status: 'linked', logoPath });
      } else {
        console.log(`  ❌ No logo file found`);
        missingCount++;
        results.push({ name: business.name, status: 'missing' });
        
        // Clear any existing logo URL
        if (business.logoUrl) {
          await db
            .update(businesses)
            .set({ logoUrl: null })
            .where(eq(businesses.id, business.id));
          console.log(`  🧹 Cleared invalid logo URL: ${business.logoUrl}`);
        }
      }
      console.log('');
    }
    
    // Summary
    console.log('📊 Logo Linking Summary:');
    console.log(`Total businesses: ${allBusinesses.length}`);
    console.log(`Successfully linked: ${linkedCount}`);
    console.log(`Missing logos: ${missingCount}`);
    console.log(`Success rate: ${((linkedCount / allBusinesses.length) * 100).toFixed(1)}%`);
    
    // Detailed results
    console.log('\n📋 Detailed Results:');
    results.forEach(result => {
      if (result.status === 'linked') {
        console.log(`✅ ${result.name}: ${result.logoPath}`);
      } else {
        console.log(`❌ ${result.name}: No logo file found`);
      }
    });
    
    if (missingCount > 0) {
      console.log('\n💡 Missing Logos - Suggested Actions:');
      console.log('1. Use the browser console script to download missing logos');
      console.log('2. Manually download logos and save to company_logos/');
      console.log('3. Run this script again to link newly downloaded logos');
      
      console.log('\n📥 Missing logos list:');
      results.filter(r => r.status === 'missing').forEach(result => {
        const filename = sanitizeFilename(result.name) + '.png';
        console.log(`  ${result.name} → company_logos/${filename}`);
      });
    }

    console.log('\n✅ Logo linking process completed!');
    
  } catch (error) {
    console.error('❌ Logo linking process failed:', error);
    throw error;
  }
}

// Execute the linking
if (require.main === module) {
  linkCompanyLogos()
    .then(() => {
      console.log('\n🎉 Company logo linking completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Company logo linking failed:', error);
      process.exit(1);
    });
}

export { linkCompanyLogos };