#!/usr/bin/env node

/**
 * Run Political Alignment Service
 * 
 * This script runs the alignment service to update political data for all businesses
 */

import { config } from 'dotenv';
import { politicalAlignmentService } from '../services/politicalAlignment';

// Load environment variables
config();

async function runAlignmentService() {
  console.log('🚀 Starting Political Alignment Service...\n');
  
  try {
    // Get initial statistics
    console.log('📊 Current alignment statistics:');
    const initialStats = await politicalAlignmentService.getAlignmentStatistics();
    console.log(`- Total businesses: ${initialStats.totalBusinesses}`);
    console.log(`- Businesses with alignment: ${initialStats.businessesWithAlignment}`);
    console.log(`- Coverage: ${initialStats.coveragePercentage.toFixed(1)}%\n`);

    // Update all business alignments
    console.log('⚡ Updating political alignments for all businesses...');
    const updateResults = await politicalAlignmentService.updateAllBusinessAlignments();
    
    console.log('\n📈 Update Results:');
    console.log(`✅ Successfully updated: ${updateResults.success} businesses`);
    console.log(`❌ Failed to update: ${updateResults.failed} businesses`);
    console.log(`📊 Success rate: ${((updateResults.success / (updateResults.success + updateResults.failed)) * 100).toFixed(1)}%`);

    // Get final statistics
    console.log('\n📊 Final alignment statistics:');
    const finalStats = await politicalAlignmentService.getAlignmentStatistics();
    console.log(`- Total businesses: ${finalStats.totalBusinesses}`);
    console.log(`- Businesses with alignment: ${finalStats.businessesWithAlignment}`);
    console.log(`- Coverage: ${finalStats.coveragePercentage.toFixed(1)}%`);
    
    const improvement = finalStats.coveragePercentage - initialStats.coveragePercentage;
    console.log(`- Coverage improvement: +${improvement.toFixed(1)}%`);

    if (finalStats.averageAlignments) {
      console.log('\n🎯 Average Political Alignments:');
      console.log(`- Liberal: ${parseFloat(finalStats.averageAlignments.avgLiberal).toFixed(1)}`);
      console.log(`- Conservative: ${parseFloat(finalStats.averageAlignments.avgConservative).toFixed(1)}`);
      console.log(`- Libertarian: ${parseFloat(finalStats.averageAlignments.avgLibertarian).toFixed(1)}`);
      console.log(`- Green: ${parseFloat(finalStats.averageAlignments.avgGreen).toFixed(1)}`);
      console.log(`- Centrist: ${parseFloat(finalStats.averageAlignments.avgCentrist).toFixed(1)}`);
    }

    console.log('\n✅ Political Alignment Service completed successfully!');
    
  } catch (error) {
    console.error('❌ Alignment service failed:', error);
    throw error;
  }
}

// Execute the service
if (require.main === module) {
  runAlignmentService()
    .then(() => {
      console.log('\n🎉 Alignment service run completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Alignment service run failed:', error);
      process.exit(1);
    });
}

export { runAlignmentService };