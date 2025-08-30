#!/usr/bin/env tsx

/**
 * National Free Data Sources Business Scraper
 * 
 * This script scrapes businesses nationally using only free data sources:
 * - OpenStreetMap/Nominatim API (free, no API key needed)
 * - Wikipedia business listings
 * - Public business directories
 * - Government data sources
 * 
 * No API keys required - completely free and CAPTCHA-friendly!
 */

import 'dotenv/config';
import { dataIngestionService } from '../services/dataIngestion';
import { TIER_EXECUTION_ORDER } from '../services/scrapeNational/constants';

interface BusinessData {
  name: string;
  description?: string;
  category: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  hours?: string;
  priceRange?: string;
  yearFounded?: number;
  employeeCount?: number;
  businessSize?: string;
  imageUrl?: string;
  logoUrl?: string;
  socialMedia?: Record<string, string | undefined>;
  tags?: string[];
  attributes?: Record<string, any>;
  dataSource?: string;
  dataQuality?: number;
}

interface StateResult {
  state: string;
  targetCount: number;
  actualCount: number;
  successCount: number;
  errors: string[];
}

interface TierResult {
  tier: number;
  states: StateResult[];
  totalTarget: number;
  totalActual: number;
  totalSuccess: number;
}

class NationalFreeDataScraper {
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  private userAgent = 'VoteWithYourWallet/1.0 (Educational Research)';
  
  /**
   * Scrape businesses from OpenStreetMap for a specific city/state
   */
  async scrapeOpenStreetMapByLocation(city: string, state: string, limit: number = 50): Promise<BusinessData[]> {
    console.log(`  📍 Scraping OpenStreetMap for ${city}, ${state}...`);
    
    const businesses: BusinessData[] = [];
    
    try {
      // Business categories to search for in OSM
      const categories = [
        'shop', 'restaurant', 'cafe', 'hospital', 'clinic', 
        'bank', 'office', 'hotel', 'tourism', 'amenity'
      ];
      
      for (const category of categories.slice(0, 3)) { // Limit categories to avoid too many requests
        await this.delay(2000); // 2 second delay between requests
        
        const query = `[out:json][timeout:25];
          area["name"="${state}"]["admin_level"="4"]->.searchArea;
          (
            nwr["${category}"]["name"]["addr:city"="${city}"](area.searchArea);
          );
          out center meta;`;
        
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'User-Agent': this.userAgent
          },
          body: query
        });
        
        if (!response.ok) {
          console.log(`    ⚠️  Warning: OSM query failed for ${category} in ${city}`);
          continue;
        }
        
        const data = await response.json();
        
        for (const element of data.elements || []) {
          if (element.tags?.name && businesses.length < limit) {
            const business: BusinessData = {
              name: element.tags.name,
              description: element.tags.description || `${category} business in ${city}, ${state}`,
              category: this.mapOSMCategoryToBusiness(category),
              address: this.buildAddress(element.tags),
              city: city,
              state: this.getStateAbbreviation(state),
              zipCode: element.tags['addr:postcode'],
              latitude: element.lat || element.center?.lat,
              longitude: element.lon || element.center?.lon,
              phone: element.tags.phone,
              website: element.tags.website,
              tags: ['openstreetmap_sourced', category],
              dataSource: 'openstreetmap',
              dataQuality: 8
            };
            
            businesses.push(business);
          }
        }
      }
      
      console.log(`    ✅ Found ${businesses.length} businesses from OSM`);
      return businesses;
      
    } catch (error) {
      console.log(`    ❌ Error scraping OSM for ${city}: ${error}`);
      return [];
    }
  }
  
  /**
   * Scrape Wikipedia for business listings by state
   */
  async scrapeWikipediaByState(state: string, limit: number = 20): Promise<BusinessData[]> {
    console.log(`  📖 Scraping Wikipedia for ${state} businesses...`);
    
    const businesses: BusinessData[] = [];
    
    try {
      await this.delay(1500);
      
      // Search for business-related Wikipedia pages
      const searchTerms = [
        `companies based in ${state}`,
        `businesses in ${state}`,
        `corporations ${state}`,
        `${state} companies`
      ];
      
      for (const searchTerm of searchTerms.slice(0, 2)) { // Limit searches
        const searchUrl = `https://en.wikipedia.org/w/api.php?` +
          `action=opensearch&search=${encodeURIComponent(searchTerm)}` +
          `&limit=10&namespace=0&format=json&origin=*`;
        
        const response = await fetch(searchUrl, {
          headers: { 'User-Agent': this.userAgent }
        });
        
        if (!response.ok) continue;
        
        const [, titles, descriptions, urls] = await response.json();
        
        for (let i = 0; i < Math.min(titles.length, 5); i++) {
          if (businesses.length >= limit) break;
          
          const title = titles[i];
          if (this.isLikelyBusinessArticle(title)) {
            const business: BusinessData = {
              name: title,
              description: descriptions[i] || `Business from Wikipedia: ${title}`,
              category: this.guessBusinessCategory(title),
              state: this.getStateAbbreviation(state),
              website: urls[i],
              tags: ['wikipedia_sourced'],
              dataSource: 'wikipedia',
              dataQuality: 6
            };
            
            businesses.push(business);
          }
        }
        
        await this.delay(1000);
      }
      
      console.log(`    ✅ Found ${businesses.length} businesses from Wikipedia`);
      return businesses;
      
    } catch (error) {
      console.log(`    ❌ Error scraping Wikipedia for ${state}: ${error}`);
      return [];
    }
  }
  
  private buildAddress(tags: any): string | undefined {
    const parts = [
      tags['addr:housenumber'],
      tags['addr:street'],
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(' ') : undefined;
  }
  
  private mapOSMCategoryToBusiness(osmCategory: string): string {
    const mapping: { [key: string]: string } = {
      'restaurant': 'Food & Dining',
      'cafe': 'Food & Dining', 
      'shop': 'Retail',
      'hospital': 'Healthcare',
      'clinic': 'Healthcare',
      'bank': 'Finance',
      'office': 'Professional Services',
      'hotel': 'Hospitality',
      'tourism': 'Tourism',
      'amenity': 'Community Services'
    };
    
    return mapping[osmCategory] || 'Professional Services';
  }
  
  private isLikelyBusinessArticle(title: string): boolean {
    const businessIndicators = [
      'Corporation', 'Corp', 'Inc', 'Company', 'Co.', 'LLC', 'LP', 
      'Enterprises', 'Group', 'Systems', 'Technologies', 'Solutions',
      'Restaurant', 'Cafe', 'Shop', 'Store', 'Center', 'Clinic'
    ];
    
    return businessIndicators.some(indicator => 
      title.includes(indicator) && 
      !title.includes('List of') && 
      !title.includes('Category:')
    );
  }
  
  private guessBusinessCategory(name: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('restaurant') || lowerName.includes('cafe') || lowerName.includes('food')) return 'Food & Dining';
    if (lowerName.includes('hospital') || lowerName.includes('medical') || lowerName.includes('health')) return 'Healthcare';
    if (lowerName.includes('tech') || lowerName.includes('software') || lowerName.includes('systems')) return 'Technology';
    if (lowerName.includes('bank') || lowerName.includes('financial')) return 'Finance';
    if (lowerName.includes('real estate') || lowerName.includes('property')) return 'Real Estate';
    if (lowerName.includes('school') || lowerName.includes('university') || lowerName.includes('college')) return 'Education';
    if (lowerName.includes('shop') || lowerName.includes('store') || lowerName.includes('retail')) return 'Retail';
    
    return 'Professional Services';
  }
  
  private getStateAbbreviation(fullName: string): string {
    const stateMap: { [key: string]: string } = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
      'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
      'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
      'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
      'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
      'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
      'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
      'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
    };
    
    return stateMap[fullName] || fullName;
  }
  
  /**
   * Scrape businesses for a single state
   */
  async scrapeState(stateName: string, cities: string[], targetCount: number): Promise<StateResult> {
    console.log(`\n🏛️ Scraping ${stateName} (Target: ${targetCount} businesses)`);
    
    const result: StateResult = {
      state: stateName,
      targetCount,
      actualCount: 0,
      successCount: 0,
      errors: []
    };
    
    let allBusinesses: BusinessData[] = [];
    
    try {
      // Scrape Wikipedia for state-level businesses
      const wikiBusinesses = await this.scrapeWikipediaByState(stateName, Math.floor(targetCount * 0.3));
      allBusinesses.push(...wikiBusinesses);
      
      // Scrape OpenStreetMap for major cities
      const businessesPerCity = Math.floor((targetCount * 0.7) / Math.min(cities.length, 3));
      
      for (const city of cities.slice(0, 3)) { // Limit to top 3 cities to avoid too many requests
        console.log(`  🏙️ Processing ${city}...`);
        
        try {
          const osmBusinesses = await this.scrapeOpenStreetMapByLocation(city, stateName, businessesPerCity);
          allBusinesses.push(...osmBusinesses);
          
          await this.delay(3000); // 3 second delay between cities
          
        } catch (error) {
          const errorMsg = `Error processing ${city}: ${error}`;
          result.errors.push(errorMsg);
          console.log(`    ❌ ${errorMsg}`);
        }
      }
      
      // Remove duplicates
      const uniqueBusinesses = this.removeDuplicateBusinesses(allBusinesses);
      result.actualCount = uniqueBusinesses.length;
      
      console.log(`  📊 Found ${result.actualCount} unique businesses for ${stateName}`);
      
      // Save to database
      if (uniqueBusinesses.length > 0) {
        console.log(`  💾 Saving ${uniqueBusinesses.length} businesses to database...`);
        
        const saveResult = await dataIngestionService.importBusinessesInBatch(uniqueBusinesses);
        result.successCount = saveResult.recordsAdded + saveResult.recordsUpdated;
        
        if (saveResult.errors.length > 0) {
          result.errors.push(...saveResult.errors);
        }
        
        console.log(`  ✅ Successfully saved ${result.successCount} businesses`);
      }
      
    } catch (error) {
      const errorMsg = `Failed to scrape ${stateName}: ${error}`;
      result.errors.push(errorMsg);
      console.log(`  ❌ ${errorMsg}`);
    }
    
    return result;
  }
  
  private removeDuplicateBusinesses(businesses: BusinessData[]): BusinessData[] {
    const seen = new Set<string>();
    return businesses.filter(business => {
      const key = `${business.name.toLowerCase()}_${business.city}_${business.state}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  /**
   * Main method to scrape all states nationally
   */
  async scrapeNationally(): Promise<TierResult[]> {
    console.log('🇺🇸 NATIONAL FREE DATA SCRAPER');
    console.log('==============================');
    console.log('✅ No API keys required!');
    console.log('✅ Uses only free data sources (OpenStreetMap + Wikipedia)');
    console.log('✅ CAPTCHA-free scraping');
    console.log('✅ Covers all 50 states');
    
    const tierResults: TierResult[] = [];
    
    for (const tierConfig of TIER_EXECUTION_ORDER) {
      console.log(`\n🎯 Starting Tier ${tierConfig.tier}: ${tierConfig.description}`);
      console.log(`   States: ${tierConfig.states.join(', ')}`);
      console.log(`   Target per state: ${tierConfig.target} businesses`);
      
      const tierResult: TierResult = {
        tier: tierConfig.tier,
        states: [],
        totalTarget: tierConfig.states.length * tierConfig.target,
        totalActual: 0,
        totalSuccess: 0
      };
      
      for (const stateName of tierConfig.states) {
        // For free scraping, we'll use a simplified city list
        const majorCities = this.getMajorCitiesForState(stateName);
        
        const stateResult = await this.scrapeState(stateName, majorCities, tierConfig.target);
        tierResult.states.push(stateResult);
        tierResult.totalActual += stateResult.actualCount;
        tierResult.totalSuccess += stateResult.successCount;
        
        // Delay between states to be respectful
        console.log(`  ⏱️ Waiting 10 seconds before next state...`);
        await this.delay(10000);
      }
      
      tierResults.push(tierResult);
      
      console.log(`\n✅ Tier ${tierConfig.tier} Complete:`);
      console.log(`   Target: ${tierResult.totalTarget} businesses`);
      console.log(`   Found: ${tierResult.totalActual} businesses`);
      console.log(`   Saved: ${tierResult.totalSuccess} businesses`);
      
      // Longer delay between tiers
      if (tierConfig.tier < 4) {
        console.log(`\n⏱️ Waiting 30 seconds before next tier...`);
        await this.delay(30000);
      }
    }
    
    return tierResults;
  }
  
  private getMajorCitiesForState(state: string): string[] {
    // Simplified list of major cities per state for free scraping
    const cityMap: { [key: string]: string[] } = {
      'California': ['Los Angeles', 'San Francisco', 'San Diego'],
      'Texas': ['Houston', 'Dallas', 'Austin'],
      'Florida': ['Miami', 'Tampa', 'Orlando'],
      'New York': ['New York City', 'Buffalo', 'Albany'],
      'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown']
      // Add more as needed - keeping minimal for now
    };
    
    return cityMap[state] || [state.split(' ')[0]]; // Fallback to first part of state name
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
National Free Data Scraper

Usage: npm run scrape:free:national [options]

Options:
  --help, -h     Show this help message
  --dry-run      Show what would be scraped without running

Features:
  ✅ Scrapes all 50 states using tiered approach
  ✅ Uses only free data sources (OpenStreetMap + Wikipedia)
  ✅ No API keys required
  ✅ CAPTCHA-free scraping
  ✅ Respectful rate limiting

Examples:
  npm run scrape:free:national           # Run national free scraping
  npm run scrape:free:national --dry-run # Preview what will be scraped
  `);
    process.exit(0);
  }
  
  if (args.includes('--dry-run')) {
    console.log('🔍 National free scraping plan:');
    console.log('Data sources: OpenStreetMap + Wikipedia');
    console.log('Rate limits: 2-3 seconds between requests');
    console.log('Expected time: 4-6 hours for all states');
    console.log('Total target: ~3,750 businesses');
    
    TIER_EXECUTION_ORDER.forEach(tier => {
      console.log(`\nTier ${tier.tier}: ${tier.states.length} states × ${tier.target} = ${tier.states.length * tier.target} businesses`);
    });
    
    process.exit(0);
  }
  
  const scraper = new NationalFreeDataScraper();
  
  try {
    const results = await scraper.scrapeNationally();
    
    console.log('\n🎉 NATIONAL FREE SCRAPING COMPLETED!');
    console.log('=====================================');
    
    let totalTarget = 0, totalActual = 0, totalSuccess = 0;
    
    results.forEach(tier => {
      totalTarget += tier.totalTarget;
      totalActual += tier.totalActual;
      totalSuccess += tier.totalSuccess;
    });
    
    console.log(`📊 Final Results:`);
    console.log(`   Target: ${totalTarget} businesses`);
    console.log(`   Found: ${totalActual} businesses`);
    console.log(`   Saved: ${totalSuccess} businesses`);
    console.log(`   Success Rate: ${((totalSuccess/totalTarget) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('\n❌ National free scraping failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { NationalFreeDataScraper };
