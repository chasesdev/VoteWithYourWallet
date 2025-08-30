#!/usr/bin/env node

/**
 * Check Business Image URLs
 * 
 * This script checks for broken image URLs in the business data
 */

import { config } from 'dotenv';
import { getDB } from '../db/connection';
import { businesses } from '../db/schema';

// Load environment variables
config();

async function checkImageUrls() {
  console.log('🖼️ Checking business image URLs...\n');
  
  try {
    const db = getDB();

    // Get all businesses with their image URLs
    const allBusinesses = await db.select({
      id: businesses.id,
      name: businesses.name,
      imageUrl: businesses.imageUrl,
      logoUrl: businesses.logoUrl
    }).from(businesses);

    console.log(`Found ${allBusinesses.length} businesses to check\n`);

    const brokenImages = [];
    const brokenLogos = [];

    for (const business of allBusinesses) {
      console.log(`Checking ${business.name}:`);
      
      // Check image URL
      if (business.imageUrl) {
        console.log(`  Image: ${business.imageUrl}`);
        if (business.imageUrl.includes('wikipedia') || business.imageUrl.includes('wikimedia')) {
          console.log('  ⚠️  Wikipedia/Wikimedia URL detected');
          brokenImages.push({
            business: business.name,
            url: business.imageUrl
          });
        }
      } else {
        console.log('  Image: None');
      }

      // Check logo URL  
      if (business.logoUrl) {
        console.log(`  Logo: ${business.logoUrl}`);
        if (business.logoUrl.includes('wikipedia') || business.logoUrl.includes('wikimedia')) {
          console.log('  ⚠️  Wikipedia/Wikimedia URL detected');
          brokenLogos.push({
            business: business.name,
            url: business.logoUrl
          });
        }
      } else {
        console.log('  Logo: None');
      }
      console.log('');
    }

    // Summary
    console.log('📊 Summary:');
    console.log(`Total businesses: ${allBusinesses.length}`);
    console.log(`Businesses with images: ${allBusinesses.filter(b => b.imageUrl).length}`);
    console.log(`Businesses with logos: ${allBusinesses.filter(b => b.logoUrl).length}`);
    console.log(`Potential broken images: ${brokenImages.length}`);
    console.log(`Potential broken logos: ${brokenLogos.length}`);

    if (brokenImages.length > 0) {
      console.log('\n🚨 Businesses with potentially broken image URLs:');
      brokenImages.forEach(item => {
        console.log(`- ${item.business}: ${item.url}`);
      });
    }

    if (brokenLogos.length > 0) {
      console.log('\n🚨 Businesses with potentially broken logo URLs:');
      brokenLogos.forEach(item => {
        console.log(`- ${item.business}: ${item.url}`);
      });
    }

    console.log('\n✅ Image URL check completed!');
    
  } catch (error) {
    console.error('❌ Image URL check failed:', error);
    throw error;
  }
}

// Execute the check
if (require.main === module) {
  checkImageUrls()
    .then(() => {
      console.log('\n🎉 Image URL check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Image URL check failed:', error);
      process.exit(1);
    });
}