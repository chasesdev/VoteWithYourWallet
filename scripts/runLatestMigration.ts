#!/usr/bin/env node

/**
 * Run Latest Migration Script
 * 
 * This script runs only the latest migration (0003_big_mindworm.sql)
 * to add the unique index on business_alignments.business_id
 */

import dotenv from 'dotenv';
import { getDB } from '../db/connection';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

async function runLatestMigration() {
  console.log('Starting latest migration...');
  
  try {
    const db = getDB();
    
    // Read the latest migration file
    const migrationPath = path.join(__dirname, '../db/migrations/0003_big_mindworm.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration:', migrationPath);
    
    // Execute the migration
    await db.run(sql.raw(migrationSQL));
    
    console.log('✅ Latest migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Execute the migration
if (require.main === module) {
  runLatestMigration()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { runLatestMigration };