#!/usr/bin/env node

/**
 * Simple Political Alignment Service Test
 */

// Load environment first
import { config } from 'dotenv';
config();

import { politicalAlignmentService } from '../services/politicalAlignmentService';

async function simpleTest() {
  console.log('🚀 Testing Political Alignment Service...\n');
  
  try {
    // Test alignment statistics
    console.log('📊 Getting alignment statistics...');
    const stats = await politicalAlignmentService.getAlignmentStatistics();
    console.log('Total businesses:', stats.totalBusinesses);
    console.log('Businesses with alignment:', stats.businessesWithAlignment);
    console.log('Coverage percentage:', stats.coveragePercentage + '%');
    console.log('');

    // Test scraping political data (mock)
    console.log('🔍 Testing political data scraping...');
    const politicalData = await politicalAlignmentService.scrapePoliticalData('Test Company');
    if (politicalData) {
      console.log('✅ Mock political data generated:');
      console.log('- Liberal:', politicalData.alignment.liberal.toFixed(1));
      console.log('- Conservative:', politicalData.alignment.conservative.toFixed(1));
      console.log('- Libertarian:', politicalData.alignment.libertarian.toFixed(1));
      console.log('- Green:', politicalData.alignment.green.toFixed(1));  
      console.log('- Centrist:', politicalData.alignment.centrist.toFixed(1));
      console.log('- Donations found:', politicalData.donations.length);
      console.log('- Confidence:', politicalData.confidence);
    }
    console.log('');

    console.log('✅ Alignment service is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

simpleTest().then(() => {
  console.log('🎉 Test completed successfully');
  process.exit(0);
}).catch(err => {
  console.error('💥 Test failed:', err);
  process.exit(1);
});