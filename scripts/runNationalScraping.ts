#!/usr/bin/env ts-node

/**
 * National Business Scraping Runner
 * 
 * This script runs the national business scraping service to collect
 * business data from all 50 states using a tiered approach.
 */

import { scrapeAllStates, getScrapingStats } from '../services/scrapeNational';
import { ScrapingConfig } from '../services/scrapeNational/types';

// Configuration options
const config: ScrapingConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  batchSize: 10,
  rateLimitDelay: 2000,
  maxConcurrent: 5
};

async function runNationalScraping() {
  console.log('🚀 Starting National Business Scraping...');
  console.log('📊 Target: All 50 states with tiered approach');
  
  try {
    // Start scraping all states
    const results = await scrapeAllStates(config);
    
    console.log('\n✅ National scraping completed!');
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
    console.error('❌ Error during national scraping:', error);
    process.exit(1);
  }
}

// Command line options
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
National Business Scraping Runner

Usage: npm run scrape:national [options]

Options:
  --help, -h     Show this help message
  --tier <n>     Run only specific tier (1-4)
  --state <name> Run only specific state
  --dry-run      Show what would be scraped without running

Examples:
  npm run scrape:national           # Run all tiers
  npm run scrape:national --tier 1  # Run only Tier 1 states
  npm run scrape:national --dry-run # Preview what will be scraped
  `);
  process.exit(0);
}

if (args.includes('--dry-run')) {
  console.log('🔍 Dry run - showing scraping plan:');
  console.log('Tier 1: CA, TX, FL, NY, PA (500 each)');
  console.log('Tier 2: IL, OH, GA, NC, MI (200 each)');
  console.log('Tier 3: 15 states (100 each)');
  console.log('Tier 4: 25 states (50 each)');
  console.log('Total target: ~13,250 businesses across all 50 states');
  process.exit(0);
}

// Run the scraping
runNationalScraping().catch(console.error);
