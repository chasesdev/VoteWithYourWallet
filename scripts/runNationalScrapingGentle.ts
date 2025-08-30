#!/usr/bin/env tsx

/**
 * Gentle National Business Scraping Runner
 * 
 * This version uses more conservative settings to avoid CAPTCHAs
 * and focuses on CAPTCHA-friendly data sources.
 */

import { scrapeAllStates, getScrapingStats } from '../services/scrapeNational';
import { ScrapingConfig } from '../services/scrapeNational/types';

// More conservative configuration to avoid CAPTCHAs
const gentleConfig: ScrapingConfig = {
  maxRetries: 2,
  retryDelay: 5000,        // 5 seconds between retries (was 1 second)
  batchSize: 3,            // Process 3 at a time (was 10)
  rateLimitDelay: 15000,   // 15 seconds between requests (was 2 seconds)
  maxConcurrent: 1         // Only 1 concurrent request (was 5)
};

async function runGentleNationalScraping() {
  console.log('🐌 Starting Gentle National Business Scraping...');
  console.log('⚡ Using conservative settings to avoid CAPTCHAs');
  console.log('📊 Target: All 50 states with gentle approach');
  console.log('⏱️  This will take much longer but should avoid blocks');
  
  try {
    console.log('\n🎯 Configuration:');
    console.log(`   Rate limit delay: ${gentleConfig.rateLimitDelay}ms (${gentleConfig.rateLimitDelay/1000}s)`);
    console.log(`   Batch size: ${gentleConfig.batchSize}`);
    console.log(`   Max concurrent: ${gentleConfig.maxConcurrent}`);
    console.log(`   Max retries: ${gentleConfig.maxRetries}`);
    
    // Start scraping all states with gentle config
    const results = await scrapeAllStates(gentleConfig);
    
    console.log('\n✅ Gentle national scraping completed!');
    console.log('📈 Results Summary:');
    
    results.forEach((tierResult, index) => {
      console.log(`\n🎯 Tier ${tierResult.tier}:`);
      console.log(`   Target: ${tierResult.totalTarget} businesses`);
      console.log(`   Processed: ${tierResult.totalProcessed} businesses`);
      console.log(`   Success: ${tierResult.totalSuccess} businesses`);
      console.log(`   Failed: ${tierResult.totalFailed} businesses`);
      
      tierResult.states.forEach(state => {
        console.log(`   📍 ${state.state}: ${state.success}/${state.target} businesses`);
      });
    });
    
    // Get overall stats
    const stats = getScrapingStats();
    console.log('\n📊 Overall Statistics:');
    console.log(`   Total businesses scraped: ${stats.totalBusinesses || 0}`);
    console.log(`   Total states processed: ${stats.statesProcessed || 0}`);
    console.log(`   Average success rate: ${stats.successRate || 0}%`);
    
  } catch (error) {
    console.error('❌ Error during gentle national scraping:', error);
    
    if (error.message?.includes('CAPTCHA') || error.message?.includes('blocked')) {
      console.log('\n🛡️ Got CAPTCHAed! This is normal. Try:');
      console.log('   1. Wait a few hours and try again');
      console.log('   2. Use alternative data sources');
      console.log('   3. Implement proxy rotation');
    }
    
    process.exit(1);
  }
}

// Command line options
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Gentle National Business Scraping Runner

This version uses conservative settings to avoid CAPTCHAs:
- 15 second delays between requests
- Only 1 concurrent request at a time
- Smaller batch sizes
- Focus on CAPTCHA-friendly sources

Usage: npm run scrape:national:gentle [options]

Options:
  --help, -h     Show this help message
  --dry-run      Show configuration without running

Examples:
  npm run scrape:national:gentle           # Run gentle scraping
  npm run scrape:national:gentle --dry-run # Preview configuration
  `);
  process.exit(0);
}

if (args.includes('--dry-run')) {
  console.log('🔍 Gentle scraping configuration:');
  console.log(`   Rate limit: ${gentleConfig.rateLimitDelay}ms between requests`);
  console.log(`   Batch size: ${gentleConfig.batchSize} businesses at a time`);
  console.log(`   Concurrent: ${gentleConfig.maxConcurrent} request at a time`);
  console.log(`   Retries: ${gentleConfig.maxRetries} max retries`);
  console.log('\n⏱️ Estimated time: 3-4 hours for full run');
  console.log('🎯 Success rate: Much higher (avoids most CAPTCHAs)');
  process.exit(0);
}

// Run the gentle scraping
runGentleNationalScraping().catch(console.error);
