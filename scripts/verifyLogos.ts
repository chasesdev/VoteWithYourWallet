#!/usr/bin/env node

/**
 * Verify Company Logos
 * 
 * This script verifies that all company logos are properly linked and accessible
 */

import { config } from 'dotenv';
import { getDB } from '../db/connection';
import { businesses } from '../db/schema';
import fs from 'fs';
import path from 'path';

// Load environment variables
config();

async function verifyLogos() {
  console.log('✅ Verifying company logos...\n');
  
  try {
    const db = getDB();
    const allBusinesses = await db.select().from(businesses);
    
    let linkedCount = 0;
    let missingCount = 0;
    let fileExistsCount = 0;
    let totalSize = 0;
    
    const results: Array<{
      name: string;
      logoUrl: string | null;
      fileExists: boolean;
      fileSize?: number;
      issue?: string;
    }> = [];
    
    console.log('🔍 Checking each business logo...\n');
    
    for (const business of allBusinesses) {
      const result = {
        name: business.name,
        logoUrl: business.logoUrl,
        fileExists: false
      };
      
      console.log(`📋 ${business.name}`);
      
      if (business.logoUrl) {
        console.log(`  Database: ${business.logoUrl}`);
        linkedCount++;
        
        // Check if file exists
        const fullPath = path.join(process.cwd(), business.logoUrl);
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          result.fileExists = true;
          result.fileSize = stats.size;
          fileExistsCount++;
          totalSize += stats.size;
          
          console.log(`  File: ✅ Exists (${(stats.size / 1024).toFixed(1)} KB)`);
        } else {
          console.log(`  File: ❌ Missing at ${fullPath}`);
          result.issue = 'File missing';
        }
      } else {
        console.log(`  Database: ❌ No logo URL set`);
        missingCount++;
        result.issue = 'No logo URL';
      }
      
      results.push(result);
      console.log('');
    }
    
    // Summary
    console.log('📊 Logo Verification Summary:');
    console.log(`Total businesses: ${allBusinesses.length}`);
    console.log(`With logo URLs in database: ${linkedCount}`);
    console.log(`With logo files on disk: ${fileExistsCount}`);
    console.log(`Missing logo URLs: ${missingCount}`);
    console.log(`Missing logo files: ${linkedCount - fileExistsCount}`);
    console.log(`Total logo file size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Database linking rate: ${((linkedCount / allBusinesses.length) * 100).toFixed(1)}%`);
    console.log(`File accessibility rate: ${((fileExistsCount / allBusinesses.length) * 100).toFixed(1)}%`);
    
    // Issues report
    const issueResults = results.filter(r => r.issue);
    if (issueResults.length > 0) {
      console.log('\n🚨 Issues Found:');
      issueResults.forEach(result => {
        console.log(`❌ ${result.name}: ${result.issue}`);
      });
    }
    
    // Success report
    const successResults = results.filter(r => !r.issue);
    if (successResults.length > 0) {
      console.log('\n✅ Successfully Verified Logos:');
      successResults.forEach(result => {
        const sizeKB = result.fileSize ? (result.fileSize / 1024).toFixed(1) : 'Unknown';
        console.log(`  ${result.name}: ${result.logoUrl} (${sizeKB} KB)`);
      });
    }
    
    console.log('\n✅ Logo verification completed!');
    
    if (fileExistsCount === allBusinesses.length) {
      console.log('🎉 All logos are properly linked and accessible!');
    } else {
      console.log(`⚠️ ${allBusinesses.length - fileExistsCount} logos need attention.`);
    }
    
  } catch (error) {
    console.error('❌ Logo verification failed:', error);
    throw error;
  }
}

// Execute the verification
if (require.main === module) {
  verifyLogos()
    .then(() => {
      console.log('\n🎉 Logo verification completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Logo verification failed:', error);
      process.exit(1);
    });
}

export { verifyLogos };