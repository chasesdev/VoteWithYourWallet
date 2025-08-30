#!/usr/bin/env node

/**
 * Run User Business Alignments Migration Script
 * 
 * This script runs the migration to add the user_business_alignments table
 */

import { config } from 'dotenv';
import { getDB } from '../db/connection';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
config();

async function runUserBusinessAlignmentsMigration() {
  console.log('Starting user business alignments migration...');
  
  try {
    const db = getDB();
    
    // Read the latest migration file
    const migrationPath = path.join(__dirname, '../db/migrations/0004_petite_gwen_stacy.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration:', migrationPath);
    console.log('Migration SQL:', migrationSQL);
    
    // Split the migration SQL into separate statements
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement separately
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}:`, statement);
      await db.run(sql.raw(statement));
    }
    
    console.log('✅ User business alignments migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Execute the migration
if (require.main === module) {
  runUserBusinessAlignmentsMigration()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { runUserBusinessAlignmentsMigration };