#!/usr/bin/env node

/**
 * Check Database Updates
 * 
 * This script verifies that the political alignment data was saved to the database
 */

import { config } from 'dotenv';
import { getDB } from '../db/connection';
import { businesses, businessAlignments, donations } from '../db/schema';
import { eq } from 'drizzle-orm';

// Load environment variables
config();

async function checkDbUpdates() {
  console.log('🔍 Checking database updates...\n');
  
  try {
    const db = getDB();

    // Check business alignments table
    console.log('📊 Checking business_alignments table...');
    const alignments = await db.select().from(businessAlignments);
    console.log(`Found ${alignments.length} business alignment records`);
    
    if (alignments.length > 0) {
      console.log('\n📋 Sample alignment records:');
      for (let i = 0; i < Math.min(3, alignments.length); i++) {
        const alignment = alignments[i];
        console.log(`- Business ID ${alignment.businessId}:`);
        console.log(`  Liberal: ${alignment.liberal}, Conservative: ${alignment.conservative}`);
        console.log(`  Libertarian: ${alignment.libertarian}, Green: ${alignment.green}, Centrist: ${alignment.centrist}`);
        console.log(`  Confidence: ${alignment.confidence}, Last Updated: ${alignment.lastUpdated}`);
      }
    }

    // Check donations table
    console.log('\n💰 Checking donations table...');
    const donationsData = await db.select().from(donations);
    console.log(`Found ${donationsData.length} donation records`);
    
    if (donationsData.length > 0) {
      console.log('\n📋 Sample donation records:');
      for (let i = 0; i < Math.min(3, donationsData.length); i++) {
        const donation = donationsData[i];
        console.log(`- Business ID ${donation.businessId}: $${donation.amount} to ${donation.organization} (${donation.politicalLean})`);
      }
    }

    // Get business names with their alignments
    console.log('\n🏢 Businesses with political alignments:');
    const businessesWithAlignments = await db
      .select({
        name: businesses.name,
        liberal: businessAlignments.liberal,
        conservative: businessAlignments.conservative,
        libertarian: businessAlignments.libertarian,
        green: businessAlignments.green,
        centrist: businessAlignments.centrist,
        confidence: businessAlignments.confidence
      })
      .from(businesses)
      .innerJoin(businessAlignments, eq(businesses.id, businessAlignments.businessId))
      .limit(5);

    businessesWithAlignments.forEach(business => {
      console.log(`- ${business.name}:`);
      console.log(`  L:${business.liberal.toFixed(1)} C:${business.conservative.toFixed(1)} Lib:${business.libertarian.toFixed(1)} G:${business.green.toFixed(1)} Cen:${business.centrist.toFixed(1)}`);
      console.log(`  Confidence: ${business.confidence}`);
    });

    console.log('\n✅ Database verification completed!');
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    throw error;
  }
}

// Execute the check
if (require.main === module) {
  checkDbUpdates()
    .then(() => {
      console.log('\n🎉 Database check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Database check failed:', error);
      process.exit(1);
    });
}