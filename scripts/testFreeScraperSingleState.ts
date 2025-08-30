#!/usr/bin/env tsx

/**
 * Test Free Data Scraper - Single State
 * 
 * Quick test of the free scraper with just one state to verify it works
 */

import { NationalFreeDataScraper } from './freeDataScraperNational';

async function testSingleState() {
  console.log('🧪 Testing National Free Data Scraper with single state...');
  console.log('State: California (limited to ~20 businesses for testing)');
  
  const scraper = new NationalFreeDataScraper();
  
  try {
    // Test with California and limited target
    const result = await scraper.scrapeState('California', ['Los Angeles', 'San Francisco'], 20);
    
    console.log('\n✅ Single state test completed!');
    console.log('📊 Results:');
    console.log(`   Target: ${result.targetCount}`);
    console.log(`   Found: ${result.actualCount}`);
    console.log(`   Saved: ${result.successCount}`);
    console.log(`   Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (result.successCount > 0) {
      console.log('\n🎉 Test SUCCESSFUL! Ready for national scraping.');
    } else {
      console.log('\n⚠️ Test completed but no businesses were saved. Check errors above.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testSingleState();
