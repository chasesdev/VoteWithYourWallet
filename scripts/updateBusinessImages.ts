#!/usr/bin/env node

/**
 * Update Business Images Script
 * 
 * This script adds fallback images to businesses that don't have logos or images,
 * using the new CORS-friendly image APIs.
 */

import { config } from 'dotenv';
import { getDB } from '../db/connection';
import { businesses } from '../db/schema';
import { imageService } from '../services/imageService';
import { eq, isNull, or, sql, isNotNull, ne, and } from 'drizzle-orm';

// Load environment variables
config();

interface BusinessRecord {
  id: number;
  name: string;
  website: string | null;
  category: string;
  imageUrl: string | null;
  logoUrl: string | null;
}

async function updateBusinessImages() {
  console.log('🖼️ Starting Business Images Update Service...\n');
  
  try {
    const db = getDB();
    
    // Get businesses without images
    console.log('📊 Finding businesses without images...');
    const businessesWithoutImages = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        website: businesses.website,
        category: businesses.category,
        imageUrl: businesses.imageUrl,
        logoUrl: businesses.logoUrl
      })
      .from(businesses)
      .where(
        or(
          isNull(businesses.imageUrl),
          isNull(businesses.logoUrl),
          eq(businesses.imageUrl, ''),
          eq(businesses.logoUrl, '')
        )
      )
      .limit(200); // Process in larger batches for better coverage

    console.log(`Found ${businessesWithoutImages.length} businesses without complete image data\n`);

    let success = 0;
    let failed = 0;
    let processed = 0;

    for (const business of businessesWithoutImages) {
      processed++;
      console.log(`[${processed}/${businessesWithoutImages.length}] Processing: ${business.name}`);
      
      try {
        // Extract domain from website URL
        let domain: string | undefined;
        if (business.website) {
          try {
            const url = new URL(business.website.startsWith('http') ? business.website : `https://${business.website}`);
            domain = url.hostname.replace('www.', '');
          } catch (urlError) {
            console.log(`  ⚠️  Invalid website URL: ${business.website}`);
          }
        }

        // Get images with fallbacks
        console.log(`  🔍 Searching for images (domain: ${domain || 'none'})`);
        const images = await imageService.getBusinessImageWithFallbacks(
          business.name,
          domain,
          business.category
        );

        let hasLogo = false;
        let hasFallback = false;

        // Update logo if found and not already present
        if (images.logo && !business.logoUrl) {
          console.log(`  🏷️  Found logo: ${images.logo.source}`);
          
          // Update database with logo URL
          await db
            .update(businesses)
            .set({ 
              logoUrl: images.logo.url,
              updatedAt: new Date()
            })
            .where(eq(businesses.id, business.id));
            
          hasLogo = true;
        }

        // Update fallback image if found and not already present
        if (images.fallbackImage && !business.imageUrl) {
          console.log(`  📸 Found fallback image: ${images.fallbackImage.source}`);
          
          // Update database with fallback image URL
          await db
            .update(businesses)
            .set({ 
              imageUrl: images.fallbackImage.url,
              updatedAt: new Date()
            })
            .where(eq(businesses.id, business.id));
            
          hasFallback = true;
        }

        if (hasLogo || hasFallback) {
          success++;
          const updates = [];
          if (hasLogo) updates.push('logo');
          if (hasFallback) updates.push('image');
          console.log(`  ✅ Updated ${updates.join(' and ')}`);
        } else {
          console.log(`  ℹ️  No updates needed (already has images)`);
        }

      } catch (error) {
        failed++;
        console.error(`  ❌ Failed to update ${business.name}:`, error instanceof Error ? error.message : 'Unknown error');
      }

      // Add delay to be respectful to external APIs
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('');
    }

    // Final statistics
    console.log('📈 Update Results:');
    console.log(`✅ Successfully updated: ${success} businesses`);
    console.log(`❌ Failed to update: ${failed} businesses`);
    console.log(`📊 Success rate: ${((success / (success + failed)) * 100).toFixed(1)}%`);

    // Get updated statistics
    console.log('\n📊 Image Coverage Statistics:');
    const totalBusinesses = await db.select().from(businesses);
    const businessesWithLogos = await db
      .select()
      .from(businesses)
      .where(
        and(
          isNotNull(businesses.logoUrl),
          ne(businesses.logoUrl, '')
        )
      );
    const businessesWithImages = await db
      .select()
      .from(businesses)
      .where(
        and(
          isNotNull(businesses.imageUrl),
          ne(businesses.imageUrl, '')
        )
      );

    console.log(`- Total businesses: ${totalBusinesses.length}`);
    console.log(`- Businesses with logos: ${businessesWithLogos.length} (${((businessesWithLogos.length / totalBusinesses.length) * 100).toFixed(1)}%)`);
    console.log(`- Businesses with images: ${businessesWithImages.length} (${((businessesWithImages.length / totalBusinesses.length) * 100).toFixed(1)}%)`);

    console.log('\n✅ Business Images Update completed successfully!');
    
  } catch (error) {
    console.error('❌ Business Images Update failed:', error);
    throw error;
  }
}

// Database query helpers are now imported from drizzle-orm

// Execute the service
if (require.main === module) {
  updateBusinessImages()
    .then(() => {
      console.log('\n🎉 Business Images Update run completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Business Images Update run failed:', error);
      process.exit(1);
    });
}

export { updateBusinessImages };