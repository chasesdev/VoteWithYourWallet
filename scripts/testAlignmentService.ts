#!/usr/bin/env node

/**
 * Test Political Alignment Service
 * 
 * This script tests the political alignment service functionality
 */

import { config } from 'dotenv';
import { politicalAlignmentService } from '../services/politicalAlignmentService';

// Load environment variables
config();

async function testAlignmentService() {
  console.log('🚀 Testing Political Alignment Service...\n');
  
  try {
    // Test 1: Get alignment statistics
    console.log('📊 Getting alignment statistics...');
    const stats = await politicalAlignmentService.getAlignmentStatistics();
    console.log('Statistics:', JSON.stringify(stats, null, 2));
    console.log('');

    // Test 2: Scrape political data for a business
    console.log('🔍 Scraping political data for "Starbucks"...');
    const politicalData = await politicalAlignmentService.scrapePoliticalData('Starbucks', 'https://starbucks.com');
    if (politicalData) {
      console.log('Political Data Found:');
      console.log('- Alignment:', politicalData.alignment);
      console.log('- Donations:', politicalData.donations.length, 'donations found');
      console.log('- Sources:', politicalData.sources);
      console.log('- Confidence:', politicalData.confidence);
    } else {
      console.log('No political data found');
    }
    console.log('');

    // Test 3: Test user personal alignment (mock data)
    console.log('👤 Testing user personal alignment...');
    const mockUserId = 1;
    const mockAlignment = {
      liberal: 6.5,
      conservative: 2.0,
      libertarian: 4.0,
      green: 7.5,
      centrist: 3.0
    };
    
    const saved = await politicalAlignmentService.saveUserPersonalAlignment(mockUserId, mockAlignment);
    console.log('User alignment saved:', saved);
    
    if (saved) {
      const retrieved = await politicalAlignmentService.getUserPersonalAlignment(mockUserId);
      console.log('Retrieved user alignment:', retrieved);
    }
    console.log('');

    // Test 4: Test business alignment retrieval
    console.log('🏢 Testing business alignment retrieval...');
    const businessAlignment = await politicalAlignmentService.getBusinessPoliticalAlignment(1);
    console.log('Business alignment:', businessAlignment);
    console.log('');

    // Test 5: Test user alignment submissions
    console.log('📝 Testing user alignment submissions...');
    const submissions = await politicalAlignmentService.getUserAlignmentSubmissions(mockUserId);
    console.log('User submissions count:', submissions.length);
    if (submissions.length > 0) {
      console.log('Sample submission:', submissions[0]);
    }

    console.log('');
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Execute the test
if (require.main === module) {
  testAlignmentService()
    .then(() => {
      console.log('🎉 Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test script failed:', error);
      process.exit(1);
    });
}

export { testAlignmentService };