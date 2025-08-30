#!/usr/bin/env node

/**
 * Database Inspector
 * 
 * This script inspects the actual database schema and data
 */

import { config } from 'dotenv';
import { getDB } from '../db/connection';
import { users, userAlignments, businesses, businessAlignments } from '../db/schema';
import { sql } from 'drizzle-orm';

// Load environment variables
config();

async function inspectDatabase() {
  console.log('🔍 Inspecting Database Schema and Data...\n');
  
  try {
    const db = getDB();

    // Check if users table exists and its structure
    console.log('👥 USERS TABLE:');
    try {
      // Try to query users table
      const usersList = await db.select().from(users).limit(3);
      console.log(`✅ Users table exists with ${usersList.length} sample users:`);
      console.log(usersList);
      
      // Get total count
      const userCount = await db.select({ count: sql`count(*)` }).from(users);
      console.log(`Total user count: ${userCount[0].count}`);
      
    } catch (error) {
      console.log('❌ Error checking users table:', error.message);
    }
    
    console.log('\n📊 USER_ALIGNMENTS TABLE:');
    try {
      const alignmentsList = await db.select().from(userAlignments).limit(3);
      console.log(`✅ User alignments table exists with ${alignmentsList.length} sample alignments:`);
      console.log(alignmentsList);
      
      const alignmentCount = await db.select({ count: sql`count(*)` }).from(userAlignments);
      console.log(`Total user alignment count: ${alignmentCount[0].count}`);
    } catch (error) {
      console.log('❌ Error checking user alignments table:', error.message);
    }
    
    console.log('\n🏢 BUSINESSES TABLE:');
    try {
      const businessCount = await db.select({ count: sql`count(*)` }).from(businesses);
      console.log(`Business count: ${businessCount[0].count}`);
      
      // Sample businesses
      const sampleBusinesses = await db.select({
        id: businesses.id,
        name: businesses.name
      }).from(businesses).limit(5);
      console.log('Sample businesses:', sampleBusinesses);
    } catch (error) {
      console.log('❌ Error checking businesses table:', error.message);
    }

    console.log('\n📈 BUSINESS_ALIGNMENTS TABLE:');
    try {
      const alignmentCount = await db.select({ count: sql`count(*)` }).from(businessAlignments);
      console.log(`Business alignment count: ${alignmentCount[0].count}`);
    } catch (error) {
      console.log('❌ Error checking business alignments table:', error.message);
    }
    
    console.log('\n✅ Database inspection completed!');
    
  } catch (error) {
    console.error('❌ Database inspection failed:', error);
    throw error;
  }
}

// Execute the inspection
if (require.main === module) {
  inspectDatabase()
    .then(() => {
      console.log('🎉 Database inspection completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database inspection failed:', error);
      process.exit(1);
    });
}

export { inspectDatabase };