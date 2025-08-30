import { ScrapingConfig, BusinessData, StateConfig, TierResult, StateResult } from './types';
import { cleanStateName } from '../../constants/states/stateMap';

/**
 * Calculate tier summary statistics
 */
export function calculateTierSummary(results: StateResult[], tierConfig: any) {
  const processed = results.reduce((sum, result) => sum + result.processed, 0);
  const success = results.reduce((sum, result) => sum + result.success, 0);
  const failed = results.reduce((sum, result) => sum + result.failed, 0);
  
  return {
    tier: tierConfig.tier,
    name: tierConfig.name,
    states: tierConfig.states.length,
    target: tierConfig.target * tierConfig.states.length,
    processed,
    success,
    failed,
    successRate: processed > 0 ? (success / processed) * 100 : 0
  };
}

/**
 * Display tier summary in console
 */
export function displayTierSummary(summary: any, tierName: string) {
  console.log(`\n📈 ${tierName} Summary:`);
  console.log('='.repeat(40));
  console.log(`🌍 States Processed: ${summary.states}/${getTierConfig(tierName)?.states.length}`);
  console.log(`📊 Total Processed: ${summary.processed}/${summary.target}`);
  console.log(`✅ Total Success: ${summary.success}`);
  console.log(`❌ Total Failed: ${summary.failed}`);
  console.log(`📈 Success Rate: ${summary.successRate.toFixed(2)}%`);
  
  if (summary.failed > 0) {
    console.log(`⚠️  Errors: ${summary.failed} businesses failed`);
  }
}

/**
 * Generate final scraping report
 */
export function generateFinalReport(results: TierResult[], tierConfigs: any[], startTime: number) {
  const totalProcessed = results.reduce((sum, result) => sum + result.totalProcessed, 0);
  const totalSuccess = results.reduce((sum, result) => sum + result.totalSuccess, 0);
  const totalFailed = results.reduce((sum, result) => sum + result.totalFailed, 0);
  const totalDuration = Date.now() - startTime;
  
  const tierSummaries = tierConfigs.map(tierConfig => 
    calculateTierSummary(results.flatMap(r => r.states).filter(s => s.tier === tierConfig.tier), tierConfig)
  );
  
  const overallTarget = tierConfigs.reduce((sum, config) => sum + (config.target * config.states.length), 0);
  const completionRate = totalProcessed > 0 ? (totalProcessed / overallTarget) * 100 : 0;
  
  return {
    startTime: new Date(startTime).toISOString(),
    endTime: new Date().toISOString(),
    totalDuration,
    totalStates: results.length,
    totalBusinesses: totalProcessed,
    newBusinesses: totalSuccess,
    failedBusinesses: totalFailed,
    successRate: totalProcessed > 0 ? (totalSuccess / totalProcessed) * 100 : 0,
    tierSummaries,
    overallTarget,
    completionRate
  };
}

/**
 * Display final scraping report
 */
export function displayFinalReport(report: any) {
  console.log('\n🎉 FINAL NATIONAL BUSINESS SCRAPING REPORT 🎉');
  console.log('='.repeat(80));
  console.log(`📅 Start Time: ${report.startTime}`);
  console.log(`📅 End Time: ${report.endTime}`);
  console.log(`⏱️ Total Duration: ${Math.round(report.totalDuration / 1000)}s (${Math.round(report.totalDuration / 60000)}m)`);
  console.log('\n📊 OVERALL STATISTICS:');
  console.log(`🌍 Total States Processed: ${report.totalStates}/50`);
  console.log(`🏢 Total Businesses: ${report.totalBusinesses}`);
  console.log(`🎯 Overall Target: ${report.overallTarget}`);
  console.log(`✅ New Businesses: ${report.newBusinesses}`);
  console.log(`❌ Failed Businesses: ${report.failedBusinesses}`);
  console.log(`📈 Overall Success Rate: ${report.successRate.toFixed(2)}%`);
  console.log(`🎯 Completion Rate: ${report.completionRate.toFixed(2)}%`);
  
  console.log('\n📈 TIER BREAKDOWN:');
  report.tierSummaries.forEach((summary: any) => {
    console.log(`\n${summary.name} (Tier ${summary.tier}):`);
    console.log(`   🌍 States: ${summary.states}/${getTierConfig(summary.name)?.states.length}`);
    console.log(`   📊 Processed: ${summary.processed}/${summary.target}`);
    console.log(`   ✅ Success: ${summary.success}`);
    console.log(`   ❌ Failed: ${summary.failed}`);
    console.log(`   📈 Success Rate: ${summary.successRate.toFixed(2)}%`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 NATIONAL BUSINESS SCRAPING COMPLETED SUCCESSFULLY! 🎉');
}

/**
 * Get tier configuration by name
 */
function getTierConfig(tierName: string) {
  // This would typically import from constants, but we'll keep it simple for now
  const tierConfigs = [
    {
      tier: 1,
      name: 'Tier 1',
      states: ['California', 'Texas', 'Florida', 'New York', 'Pennsylvania'],
      target: 500,
      description: 'Top 5 States (500 businesses minimum each)'
    },
    {
      tier: 2,
      name: 'Tier 2',
      states: ['Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'],
      target: 200,
      description: 'Top 6-10 States (200 businesses minimum each)'
    },
    {
      tier: 3,
      name: 'Tier 3',
      states: [
        'New Jersey', 'Virginia', 'Washington', 'Arizona', 'Tennessee',
        'Massachusetts', 'Indiana', 'Missouri', 'Maryland', 'Wisconsin',
        'Colorado', 'Minnesota', 'South Carolina', 'Alabama', 'Louisiana'
      ],
      target: 100,
      description: 'Top 11-25 States (100 businesses minimum each)'
    },
    {
      tier: 4,
      name: 'Tier 4',
      states: [
        'Kentucky', 'Oregon', 'Oklahoma', 'Connecticut', 'Utah', 'Iowa',
        'Nevada', 'Arkansas', 'Kansas', 'New Mexico', 'Nebraska', 'Idaho',
        'West Virginia', 'Hawaii', 'New Hampshire', 'Maine', 'Rhode Island',
        'Montana', 'Delaware', 'South Dakota', 'North Dakota', 'Alaska',
        'Vermont', 'Wyoming'
      ],
      target: 50,
      description: 'Remaining 25 States (50 businesses minimum each)'
    }
  ];
  
  return tierConfigs.find(config => config.name === tierName);
}

/**
 * Sleep function for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate search combinations for a state
 */
export function generateSearchCombinations(config: StateConfig): Array<{ city: string; industry: string }> {
  const combinations: Array<{ city: string; industry: string }> = [];
  
  for (const city of config.cities) {
    for (const industry of config.industries) {
      combinations.push({ city, industry });
    }
  }
  
  return combinations;
}

/**
 * Clean and validate business data
 */
export function cleanBusinessData(businessData: any): BusinessData {
  return {
    ...businessData,
    name: businessData.name?.trim() || '',
    description: businessData.description?.trim() || '',
    category: businessData.category?.trim() || '',
    address: businessData.address?.trim() || '',
    city: businessData.city?.trim() || '',
    state: cleanStateName(businessData.state || ''),
    zipCode: businessData.zipCode?.trim() || '',
    phone: businessData.phone?.trim() || '',
    email: businessData.email?.trim() || '',
    website: businessData.website?.trim() || '',
    isActive: businessData.isActive ?? true,
    dataQuality: businessData.dataQuality || 0,
    source: businessData.source || '',
    createdAt: businessData.createdAt || new Date(),
    updatedAt: businessData.updatedAt || new Date()
  };
}

/**
 * Validate business data quality
 */
export function validateBusinessData(businessData: BusinessData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!businessData.name || businessData.name.length < 2) {
    errors.push('Business name is required and must be at least 2 characters');
  }
  
  if (!businessData.category || businessData.category.length < 2) {
    errors.push('Business category is required and must be at least 2 characters');
  }
  
  if (businessData.dataQuality && businessData.dataQuality < 0) {
    errors.push('Data quality score cannot be negative');
  }
  
  if (businessData.rating && (businessData.rating < 0 || businessData.rating > 5)) {
    errors.push('Rating must be between 0 and 5');
  }
  
  if (businessData.reviewCount && businessData.reviewCount < 0) {
    errors.push('Review count cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format business data for database insertion
 */
export function formatBusinessDataForDB(businessData: BusinessData): any {
  return {
    name: businessData.name,
    description: businessData.description,
    category: businessData.category,
    address: businessData.address,
    city: businessData.city,
    state: businessData.state,
    zipCode: businessData.zipCode,
    phone: businessData.phone,
    email: businessData.email,
    website: businessData.website,
    latitude: businessData.latitude,
    longitude: businessData.longitude,
    rating: businessData.rating,
    reviewCount: businessData.reviewCount,
    imageUrl: businessData.imageUrl,
    isActive: businessData.isActive,
    dataQuality: businessData.dataQuality,
    source: businessData.source,
    createdAt: businessData.createdAt,
    updatedAt: businessData.updatedAt
  };
}