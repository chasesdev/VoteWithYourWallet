#!/usr/bin/env node

/**
 * Fix Broken Image URLs
 * 
 * This script removes broken Wikipedia/Wikimedia image URLs from businesses
 */

import { config } from 'dotenv';
import { getDB } from '../db/connection';
import { businesses } from '../db/schema';
import { eq } from 'drizzle-orm';

// Load environment variables
config();

async function fixBrokenImages() {
  console.log('🔧 Fixing broken image URLs...\n');
  
  try {
    const db = getDB();

    // Get all businesses with Wikipedia/Wikimedia image URLs
    const allBusinesses = await db.select().from(businesses);
    
    let updatedCount = 0;
    
    for (const business of allBusinesses) {
      let needsUpdate = false;
      let newImageUrl = business.imageUrl;
      
      // Check if image URL is a broken Wikipedia/Wikimedia URL
      if (business.imageUrl && (business.imageUrl.includes('wikipedia') || business.imageUrl.includes('wikimedia'))) {
        console.log(`Removing broken image URL for ${business.name}`);
        console.log(`  Old URL: ${business.imageUrl}`);
        newImageUrl = null;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await db
          .update(businesses)
          .set({ imageUrl: newImageUrl })
          .where(eq(businesses.id, business.id));
        
        updatedCount++;
        console.log(`  ✅ Updated ${business.name}\n`);
      }
    }

    console.log('📊 Summary:');
    console.log(`Total businesses checked: ${allBusinesses.length}`);
    console.log(`Businesses updated: ${updatedCount}`);
    console.log(`Broken image URLs removed: ${updatedCount}`);

    console.log('\n✅ Image URL fix completed!');
    console.log('🌐 The app should now load without 404 image errors.');
    
  } catch (error) {
    console.error('❌ Image URL fix failed:', error);
    throw error;
  }
}

// Execute the fix
if (require.main === module) {
  fixBrokenImages()
    .then(() => {
      console.log('\n🎉 Image URL fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Image URL fix failed:', error);
      process.exit(1);
    });
}