import { db } from '../db/connection';
import { businesses } from '../db/schema';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { 
  StateConfig, 
  StateResult, 
  TierResult, 
  ScrapingStats, 
  BusinessData,
  ScrapingConfig 
} from './types';
import { ALL_STATE_CONFIGS } from './config';
import { 
  httpClient, 
  searchEngineScraper, 
  businessDetailScraper 
} from './scrapingUtils';
import BusinessDataProcessor from './businessDataProcessor';
import { cleanStateName } from '../constants/states/stateMap';

dotenv.config();

// Default scraping configuration
const DEFAULT_SCRAPING_CONFIG: ScrapingConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  batchSize: 10,
  rateLimitDelay: 2000,
  maxConcurrent: 5
};

/**
 * National business scraping orchestrator
 */
export class NationalBusinessScraper {
  private config: ScrapingConfig;
  private results: TierResult[] = [];

  constructor(config: ScrapingConfig = DEFAULT_SCRAPING_CONFIG) {
    this.config = config;
  }

  /**
   * Main scraping method - orchestrates the entire scraping process
   */
  async scrapeAllStates(): Promise<TierResult[]> {
    console.log('Starting national business scraping...');
    
    // Group states by tier
    const statesByTier = this.groupStatesByTier();
    
    // Process each tier
    const tierNumbers = Object.keys(statesByTier).map(Number).sort();
    for (const tier of tierNumbers) {
      console.log(`Processing Tier ${tier} states...`);
      
      const tierResult = await this.processTier(tier, statesByTier[tier]);
      this.results.push(tierResult);
    }
    
    console.log('Scraping completed!');
    return this.results;
  }

  /**
   * Backward compatibility method - scrape specific tier
   */
  async scrapeTier(tier: number): Promise<TierResult> {
    const statesByTier = this.groupStatesByTier();
    const tierConfigs = statesByTier[tier];
    
    if (!tierConfigs) {
      throw new Error(`Tier ${tier} not found`);
    }
    
    return await this.processTier(tier, tierConfigs);
  }

  /**
   * Backward compatibility method - scrape all businesses
   */
  async scrapeNationalBusinesses(): Promise<TierResult[]> {
    return await this.scrapeAllStates();
  }

  /**
   * Process all states in a specific tier
   */
  async processTier(tier: number, stateConfigs: StateConfig[]): Promise<TierResult> {
    const tierResult: TierResult = {
      tier,
      states: [],
      totalProcessed: 0,
      totalSuccess: 0,
      totalFailed: 0,
      totalTarget: stateConfigs.reduce((sum, config) => sum + config.businessTarget, 0)
    };

    // Process each state in parallel with concurrency limit
    const statePromises = stateConfigs.map(config => 
      this.processState(config)
        .then(result => {
          tierResult.states.push(result);
          tierResult.totalProcessed += result.processed;
          tierResult.totalSuccess += result.success;
          tierResult.totalFailed += result.failed;
          return result;
        })
        .catch(error => {
          console.error(`Error processing state ${config.state}:`, error);
          tierResult.states.push({
            state: config.state,
            tier: config.tier,
            target: config.businessTarget,
            processed: 0,
            success: 0,
            failed: 1,
            errors: [error.message]
          });
          tierResult.totalFailed++;
          return null;
        })
    );

    await Promise.all(statePromises);
    return tierResult;
  }

  /**
   * Process a single state
   */
  async processState(config: StateConfig): Promise<StateResult> {
    console.log(`Processing state: ${config.state} (Target: ${config.businessTarget})`);
    
    const result: StateResult = {
      state: config.state,
      tier: config.tier,
      target: config.businessTarget,
      processed: 0,
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      // Generate search combinations
      const searchCombinations = this.generateSearchCombinations(config);
      
      // Process search combinations in batches
      for (let i = 0; i < searchCombinations.length; i += this.config.batchSize) {
        const batch = searchCombinations.slice(i, i + this.config.batchSize);
        const batchResults = await this.processSearchBatch(batch, config);
        
        result.processed += batchResults.length;
        result.success += batchResults.filter(b => (b.dataQuality || 0) >= 50).length;
        result.failed += batchResults.filter(b => (b.dataQuality || 0) < 50).length;
        
        // Apply rate limiting between batches
        if (i + this.config.batchSize < searchCombinations.length) {
          await this.sleep(this.config.rateLimitDelay);
        }
      }
      
      console.log(`Completed ${config.state}: ${result.success}/${result.target} businesses found`);
      
    } catch (error: any) {
      console.error(`Error processing ${config.state}:`, error);
      result.errors.push(error.message);
      result.failed = config.businessTarget;
    }

    return result;
  }

  /**
   * Generate search combinations for a state
   */
  private generateSearchCombinations(config: StateConfig): Array<{ city: string; industry: string }> {
    const combinations: Array<{ city: string; industry: string }> = [];
    
    for (const city of config.cities) {
      for (const industry of config.industries) {
        combinations.push({ city, industry });
      }
    }
    
    return combinations;
  }

  /**
   * Process a batch of search combinations
   */
  private async processSearchBatch(
    combinations: Array<{ city: string; industry: string }>,
    config: StateConfig
  ): Promise<BusinessData[]> {
    const businessData: BusinessData[] = [];
    
    for (const combination of combinations) {
      try {
        // Search for businesses
        const searchResults = await this.searchBusinesses(combination.city, combination.industry);
        
        // Scrape business details
        for (const url of searchResults) {
          try {
            const details = await businessDetailScraper.scrapeBusinessDetails(url);
            const cleanedData = BusinessDataProcessor.cleanBusinessData(details);
            
            // Add state information
            cleanedData.state = cleanStateName(config.state);
            cleanedData.isActive = true; // Add missing property
            
            businessData.push(cleanedData);
            
            // Apply rate limiting
            await this.sleep(1000);
            
          } catch (error: any) {
            console.error(`Error scraping ${url}:`, error);
          }
        }
        
      } catch (error: any) {
        console.error(`Error searching ${combination.city} ${combination.industry}:`, error);
      }
    }
    
    return businessData;
  }

  /**
   * Search for businesses using multiple search engines
   */
  private async searchBusinesses(city: string, industry: string): Promise<string[]> {
    const allResults: string[] = [];
    
    try {
      // Search Google
      const googleResults = await searchEngineScraper.searchGoogle(city, industry);
      allResults.push(...googleResults);
    } catch (error: any) {
      console.error('Google search failed:', error);
    }
    
    try {
      // Search Yellow Pages
      const yellowPagesResults = await searchEngineScraper.searchDirectory(city, industry, 'yellowpages');
      allResults.push(...yellowPagesResults);
    } catch (error: any) {
      console.error('Yellow Pages search failed:', error);
    }
    
    try {
      // Search Yelp
      const yelpResults = await searchEngineScraper.searchDirectory(city, industry, 'yelp');
      allResults.push(...yelpResults);
    } catch (error: any) {
      console.error('Yelp search failed:', error);
    }
    
    // Remove duplicates and limit results
    const uniqueResults = Array.from(new Set(allResults));
    return uniqueResults.slice(0, 5); // Limit to 5 businesses per search
  }

  /**
   * Group states by tier
   */
  private groupStatesByTier(): { [tier: number]: StateConfig[] } {
    const grouped: { [tier: number]: StateConfig[] } = {};
    
    for (const config of ALL_STATE_CONFIGS) {
      if (!grouped[config.tier]) {
        grouped[config.tier] = [];
      }
      grouped[config.tier].push(config);
    }
    
    return grouped;
  }

  /**
   * Sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get overall scraping statistics
   */
  getScrapingStats(): ScrapingStats {
    const allBusinesses = this.getAllBusinesses();
    const stats: ScrapingStats = {
      totalBusinesses: allBusinesses.length,
      byState: [],
      byCategory: [],
      successRate: 0,
      errorRate: 0,
      averageResponseTime: 0
    };

    // Count by state
    const stateCounts: { [state: string]: number } = {};
    for (const business of allBusinesses) {
      const state = business.state || 'Unknown';
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    }
    stats.byState = Object.entries(stateCounts)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);

    // Count by category
    const categoryCounts: { [category: string]: number } = {};
    for (const business of allBusinesses) {
      const category = business.category || 'Uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
    stats.byCategory = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate success and error rates
    const totalProcessed = this.results.reduce((sum, tier) => sum + tier.totalProcessed, 0);
    const totalSuccess = this.results.reduce((sum, tier) => sum + tier.totalSuccess, 0);
    const totalFailed = this.results.reduce((sum, tier) => sum + tier.totalFailed, 0);
    
    if (totalProcessed > 0) {
      stats.successRate = (totalSuccess / totalProcessed) * 100;
      stats.errorRate = (totalFailed / totalProcessed) * 100;
    }

    return stats;
  }

  /**
   * Get all businesses from results
   */
  private getAllBusinesses(): BusinessData[] {
    // This would be populated during actual scraping
    // For now, return empty array
    return [];
  }

  /**
   * Save businesses to database
   */
  async saveToDatabase(businesses: BusinessData[]): Promise<void> {
    console.log(`Saving ${businesses.length} businesses to database...`);
    
    try {
      // Insert businesses in batches
      for (let i = 0; i < businesses.length; i += 10) {
        const batch = businesses.slice(i, i + 10);
        
        await db.insert(businesses).values(batch);
        
        console.log(`Saved batch ${Math.floor(i / 10) + 1}/${Math.ceil(businesses.length / 10)}`);
        
        // Apply rate limiting
        if (i + 10 < businesses.length) {
          await this.sleep(this.config.rateLimitDelay);
        }
      }
      
      console.log('All businesses saved successfully!');
      
    } catch (error: any) {
      console.error('Error saving to database:', error);
      throw error;
    }
  }

  /**
   * Export results to various formats
   */
  exportResults(format: 'json' | 'csv' | 'xml' = 'json'): string {
    const stats = this.getScrapingStats();
    
    switch (format) {
      case 'json':
        return JSON.stringify({
          stats,
          tiers: this.results,
          timestamp: new Date().toISOString()
        }, null, 2);
        
      case 'csv':
        const headers = ['Tier', 'State', 'Target', 'Processed', 'Success', 'Failed'];
        const rows = this.results.flatMap(tier => 
          tier.states.map((state: any) => [
            tier.tier,
            state.state,
            state.target,
            state.processed,
            state.success,
            state.failed
          ])
        );
        
        return [headers, ...rows]
          .map(row => row.join(','))
          .join('\n');
        
      case 'xml':
        return `<?xml version="1.0" encoding="UTF-8"?>
<scrapingResults>
  <stats>
    <totalBusinesses>${stats.totalBusinesses}</totalBusinesses>
    <byState>
      ${stats.byState.map((s: any) => `<state name="${s.state}" count="${s.count}"/>`).join('\n      ')}
    </byState>
    <byCategory>
      ${stats.byCategory.map((c: any) => `<category name="${c.category}" count="${c.count}"/>`).join('\n      ')}
    </byCategory>
  </stats>
  <tiers>
    ${this.results.map(tier => `
    <tier number="${tier.tier}">
      <totalProcessed>${tier.totalProcessed}</totalProcessed>
      <totalSuccess>${tier.totalSuccess}</totalSuccess>
      <totalFailed>${tier.totalFailed}</totalFailed>
      <totalTarget>${tier.totalTarget}</totalTarget>
      <states>
        ${tier.states.map((state: any) => `
        <state name="${state.state}">
          <target>${state.target}</target>
          <processed>${state.processed}</processed>
          <success>${state.success}</success>
          <failed>${state.failed}</failed>
          <errors>
            ${state.errors.map((error: any) => `<error>${error}</error>`).join('\n            ')}
          </errors>
        </state>`).join('\n        ')}
      </states>
    </tier>`).join('\n    ')}
  </tiers>
  <timestamp>${new Date().toISOString()}</timestamp>
</scrapingResults>`;
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

// Export the service
export const nationalBusinessScrapingService = new NationalBusinessScraper();

// Export default instance
export default NationalBusinessScraper;

// Convenience functions for direct use
export const scrapeAllStates = async (config?: ScrapingConfig) => {
  const scraper = new NationalBusinessScraper(config);
  return await scraper.scrapeAllStates();
};

export const getScrapingStats = () => {
  const scraper = new NationalBusinessScraper();
  return scraper.getScrapingStats();
};

export const exportResults = (format: 'json' | 'csv' | 'xml' = 'json') => {
  const scraper = new NationalBusinessScraper();
  return scraper.exportResults(format);
};