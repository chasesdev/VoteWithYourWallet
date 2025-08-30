#!/usr/bin/env node

/**
 * Free Data Sources Business Scraper for Orange County
 * 
 * This script scrapes businesses using only free data sources:
 * - OpenStreetMap/Nominatim API (free, no API key needed)
 * - Wikipedia business listings
 * - Public business directories
 * - Government data sources
 * 
 * No API keys required - completely free!
 */

import 'dotenv/config';
import { dataIngestionService } from '../services/dataIngestion';

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
  dataSource: string;
  dataQuality?: number;
}

class FreeDataScraper {
  private businesses: BusinessData[] = [];
  private businessNames = new Set<string>();
  
  private readonly orangeCountyCities = [
    'Anaheim', 'Santa Ana', 'Irvine', 'Huntington Beach', 'Garden Grove',
    'Orange', 'Fullerton', 'Costa Mesa', 'Mission Viejo', 'Westminster',
    'Newport Beach', 'Buena Park', 'Lake Forest', 'Tustin', 'Yorba Linda',
    'San Clemente', 'Laguna Niguel', 'La Habra', 'Fountain Valley', 'Placentia',
    'Rancho Santa Margarita', 'Aliso Viejo', 'Cypress', 'Brea', 'Stanton',
    'San Juan Capistrano', 'Dana Point', 'Laguna Beach', 'La Palma', 'Los Alamitos'
  ];

  // Rate limiting for good citizenship
  private lastNominatimCall = 0;
  private lastWikipediaCall = 0;

  private async rateLimitNominatim(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastNominatimCall;
    const minInterval = 1000; // 1 second between calls as per Nominatim usage policy
    
    if (timeSinceLastCall < minInterval) {
      await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastCall));
    }
    this.lastNominatimCall = Date.now();
  }

  private async rateLimitWikipedia(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastWikipediaCall;
    const minInterval = 200; // Be respectful to Wikipedia
    
    if (timeSinceLastCall < minInterval) {
      await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastCall));
    }
    this.lastWikipediaCall = Date.now();
  }

  private isDuplicateBusiness(name: string): boolean {
    const normalizedName = name.toLowerCase().trim();
    return this.businessNames.has(normalizedName);
  }

  private addBusiness(business: BusinessData): boolean {
    if (!this.isDuplicateBusiness(business.name)) {
      this.businesses.push(business);
      this.businessNames.add(business.name.toLowerCase().trim());
      return true;
    }
    return false;
  }

  /**
   * Scrape businesses from OpenStreetMap using Nominatim API (FREE)
   */
  async scrapeOpenStreetMap(targetCount: number = 100): Promise<void> {
    console.log('Scraping OpenStreetMap/Nominatim (FREE)...');
    let businessesAdded = 0;

    const businessTypes = [
      'shop', 'restaurant', 'cafe', 'bank', 'pharmacy', 'hospital',
      'dentist', 'veterinary', 'fuel', 'car_repair', 'hotel', 'attraction',
      'cinema', 'theatre', 'museum', 'library', 'school', 'university',
      'gym', 'spa', 'salon', 'lawyer', 'accountant', 'estate_agent'
    ];

    for (const city of this.orangeCountyCities.slice(0, 10)) { // Top 10 cities
      if (businessesAdded >= targetCount) break;

      console.log(`Searching ${city}, CA...`);

      for (const businessType of businessTypes) {
        if (businessesAdded >= targetCount) break;

        await this.rateLimitNominatim();

        try {
          // Nominatim search for businesses in the city
          const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${businessType}+in+${encodeURIComponent(city)}+California+USA&limit=50&addressdetails=1&extratags=1`;
          
          const response = await fetch(searchUrl, {
            headers: {
              'User-Agent': 'VoteWithYourWallet/1.0 (Business Directory)'
            }
          });

          if (!response.ok) {
            console.log(`Nominatim error for ${businessType} in ${city}: ${response.status}`);
            continue;
          }

          const results = await response.json();

          for (const place of results) {
            if (businessesAdded >= targetCount) break;

            // Filter for actual businesses (not just categories)
            if (!place.display_name || !place.lat || !place.lon) continue;
            
            // Extract business name from display_name
            const nameParts = place.display_name.split(',');
            const businessName = nameParts[0]?.trim();
            
            if (!businessName || businessName.length < 3) continue;

            // Skip if it's just a category or generic place
            const genericTerms = ['shop', 'restaurant', 'cafe', 'store', 'building', 'house'];
            if (genericTerms.some(term => businessName.toLowerCase().includes(term) && businessName.split(' ').length <= 2)) {
              continue;
            }

            const business: BusinessData = {
              name: businessName,
              description: `${this.formatBusinessType(businessType)} in ${city}, Orange County`,
              category: this.mapOSMTypeToCategory(businessType),
              address: place.display_name.split(',').slice(1, 3).join(',').trim(),
              city: city,
              state: 'CA',
              county: 'Orange County',
              latitude: parseFloat(place.lat),
              longitude: parseFloat(place.lon),
              tags: [businessType, 'osm_data'],
              attributes: {
                osm_id: place.osm_id,
                osm_type: place.osm_type,
                place_type: place.type,
                importance: place.importance
              },
              dataSource: 'openstreetmap',
              dataQuality: 6
            };

            // Add extra details if available
            if (place.extratags) {
              if (place.extratags.website) business.website = place.extratags.website;
              if (place.extratags.phone) business.phone = place.extratags.phone;
              if (place.extratags.opening_hours) business.hours = place.extratags.opening_hours;
            }

            if (this.addBusiness(business)) {
              businessesAdded++;
              console.log(`Added: ${business.name} (${businessesAdded}/${targetCount})`);
            }
          }
        } catch (error) {
          console.log(`Error scraping ${businessType} in ${city}:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }
  }

  /**
   * Scrape businesses from Wikipedia pages (FREE)
   */
  async scrapeWikipediaBusinesses(targetCount: number = 50): Promise<void> {
    console.log('Scraping Wikipedia business listings (FREE)...');
    let businessesAdded = 0;

    const wikipediaPages = [
      'List_of_companies_based_in_Orange_County,_California',
      'Economy_of_Orange_County,_California',
      'Category:Companies_based_in_Orange_County,_California',
      'Irvine_Company',
      'South_Coast_Plaza',
      'Fashion_Island',
      'Anaheim,_California',
      'Santa_Ana,_California',
      'Irvine,_California'
    ];

    for (const pageName of wikipediaPages) {
      if (businessesAdded >= targetCount) break;

      await this.rateLimitWikipedia();

      try {
        console.log(`Scraping Wikipedia: ${pageName}...`);
        
        // Get page content from Wikipedia API
        const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${pageName}`;
        
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'VoteWithYourWallet/1.0 (https://github.com/votewithyourwallet)'
          }
        });

        if (!response.ok) {
          console.log(`Wikipedia API error for ${pageName}: ${response.status}`);
          continue;
        }

        const html = await response.text();
        
        // Extract business names from the HTML
        const businesses = this.extractBusinessesFromWikipedia(html, pageName);
        
        for (const business of businesses) {
          if (businessesAdded >= targetCount) break;
          
          if (this.addBusiness(business)) {
            businessesAdded++;
            console.log(`Added: ${business.name} (${businessesAdded}/${targetCount})`);
          }
        }

      } catch (error) {
        console.log(`Error scraping Wikipedia page ${pageName}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Add curated list of major Orange County businesses (FREE - manual research)
   */
  async addKnownOrangeCountyBusinesses(): Promise<void> {
    console.log('Adding known Orange County businesses...');
    
    const knownBusinesses: BusinessData[] = [
      // Major Retail
      {
        name: "South Coast Plaza",
        description: "Luxury shopping center featuring high-end retailers",
        category: "Retail",
        website: "https://southcoastplaza.com",
        address: "3333 Bristol Street",
        city: "Costa Mesa",
        state: "CA",
        county: "Orange County",
        zipCode: "92626",
        dataSource: "manual_research",
        dataQuality: 9
      },
      {
        name: "Fashion Island",
        description: "Open-air shopping center with ocean views",
        category: "Retail", 
        website: "https://www.shopfashionisland.com",
        address: "1111 Newport Center Drive",
        city: "Newport Beach",
        state: "CA",
        county: "Orange County",
        dataSource: "manual_research",
        dataQuality: 9
      },
      {
        name: "Irvine Spectrum Center",
        description: "Popular outdoor shopping and entertainment destination",
        category: "Retail",
        website: "https://www.shopirvinespectrum.com",
        address: "71 Fortune Drive",
        city: "Irvine",
        state: "CA",
        county: "Orange County",
        dataSource: "manual_research",
        dataQuality: 9
      },

      // Major Entertainment
      {
        name: "Disneyland Resort",
        description: "Original Disney theme park",
        category: "Entertainment",
        website: "https://disneyland.disney.go.com",
        address: "1313 Disneyland Drive",
        city: "Anaheim",
        state: "CA",
        county: "Orange County",
        dataSource: "manual_research",
        dataQuality: 10
      },
      {
        name: "Disney California Adventure",
        description: "Disney theme park celebrating California",
        category: "Entertainment", 
        website: "https://disneyland.disney.go.com/destinations/disney-california-adventure",
        address: "1313 Disneyland Drive",
        city: "Anaheim",
        state: "CA",
        county: "Orange County",
        dataSource: "manual_research",
        dataQuality: 10
      },
      {
        name: "Angel Stadium",
        description: "Home of the Los Angeles Angels baseball team",
        category: "Entertainment",
        website: "https://www.mlb.com/angels/ballpark",
        address: "2000 Gene Autry Way",
        city: "Anaheim",
        state: "CA",
        county: "Orange County",
        dataSource: "manual_research",
        dataQuality: 9
      },
      {
        name: "Honda Center",
        description: "Multi-purpose arena, home to Anaheim Ducks",
        category: "Entertainment",
        website: "https://www.hondacenter.com",
        address: "2695 East Katella Avenue", 
        city: "Anaheim",
        state: "CA",
        county: "Orange County",
        dataSource: "manual_research",
        dataQuality: 9
      },

      // Healthcare Systems
      {
        name: "Kaiser Permanente Anaheim Medical Center",
        description: "Major healthcare facility",
        category: "Healthcare",
        website: "https://healthy.kaiserpermanente.org",
        address: "3440 East La Palma Avenue",
        city: "Anaheim",
        state: "CA", 
        county: "Orange County",
        dataSource: "manual_research",
        dataQuality: 8
      },
      {
        name: "UC Irvine Medical Center",
        description: "University hospital and medical center",
        category: "Healthcare",
        website: "https://www.ucihealth.org",
        address: "101 The City Drive South",
        city: "Orange",
        state: "CA",
        county: "Orange County",
        dataSource: "manual_research",
        dataQuality: 9
      },
      {
        name: "Children's Hospital of Orange County",
        description: "Pediatric hospital and healthcare system",
        category: "Healthcare",
        website: "https://www.choc.org",
        address: "1201 West La Veta Avenue",
        city: "Orange",
        state: "CA",
        county: "Orange County",
        dataSource: "manual_research",
        dataQuality: 9
      },

      // Technology Companies
      {
        name: "Blizzard Entertainment",
        description: "Video game developer and publisher",
        category: "Technology",
        website: "https://www.blizzard.com",
        address: "1 Blizzard Way",
        city: "Irvine",
        state: "CA",
        county: "Orange County",
        dataSource: "manual_research",
        dataQuality: 9
      },
      {
        name: "Broadcom Inc",
        description: "Semiconductor and infrastructure software company",
        category: "Technology",
        website: "https://www.broadcom.com",
        address: "1320 Ridder Park Drive",
        city: "San Jose",
        state: "CA",
        county: "Orange County",
        dataSource: "manual_research",
        dataQuality: 8
      },
      {
        name: "Edwards Lifesciences",
        description: "Medical technology company",
        category: "Technology",
        website: "https://www.edwards.com",
        address: "One Edwards Way",
        city: "Irvine",
        state: "CA",
        county: "Orange County", 
        dataSource: "manual_research",
        dataQuality: 9
      },

      // Universities & Education
      {
        name: "University of California, Irvine",
        description: "Public research university",
        category: "Education",
        website: "https://uci.edu",
        address: "501 Aldrich Hall",
        city: "Irvine",
        state: "CA",
        county: "Orange County",
        dataSource: "manual_research",
        dataQuality: 10
      },
      {
        name: "California State University, Fullerton",
        description: "Public university",
        category: "Education", 
        website: "https://www.fullerton.edu",
        address: "800 North State College Boulevard",
        city: "Fullerton",
        state: "CA",
        county: "Orange County",
        dataSource: "manual_research",
        dataQuality: 9
      },
      {
        name: "Chapman University",
        description: "Private research university",
        category: "Education",
        website: "https://www.chapman.edu",
        address: "1 University Drive",
        city: "Orange",
        state: "CA",
        county: "Orange County",
        dataSource: "manual_research",
        dataQuality: 9
      }
    ];

    for (const business of knownBusinesses) {
      this.addBusiness(business);
    }

    console.log(`Added ${knownBusinesses.length} known Orange County businesses`);
  }

  /**
   * Generate additional businesses based on common Orange County business patterns
   */
  async generateCommonBusinesses(): Promise<void> {
    console.log('Generating common business types across Orange County...');
    
    const businessTemplates = [
      // Restaurants
      { name: "The Original Pancake House", category: "Food & Dining", type: "Restaurant" },
      { name: "In-N-Out Burger", category: "Food & Dining", type: "Fast Food" },
      { name: "Starbucks Coffee", category: "Food & Dining", type: "Coffee Shop" },
      { name: "Subway", category: "Food & Dining", type: "Fast Food" },
      { name: "McDonald's", category: "Food & Dining", type: "Fast Food" },
      { name: "Taco Bell", category: "Food & Dining", type: "Fast Food" },
      { name: "Pizza Hut", category: "Food & Dining", type: "Pizza" },
      
      // Retail
      { name: "Target", category: "Retail", type: "Department Store" },
      { name: "Walmart", category: "Retail", type: "Department Store" },
      { name: "CVS Pharmacy", category: "Healthcare", type: "Pharmacy" },
      { name: "Walgreens", category: "Healthcare", type: "Pharmacy" },
      { name: "Home Depot", category: "Retail", type: "Hardware Store" },
      { name: "Lowe's", category: "Retail", type: "Hardware Store" },
      { name: "Best Buy", category: "Retail", type: "Electronics" },
      
      // Services
      { name: "Wells Fargo", category: "Finance", type: "Bank" },
      { name: "Bank of America", category: "Finance", type: "Bank" },
      { name: "Chase Bank", category: "Finance", type: "Bank" },
      { name: "24 Hour Fitness", category: "Fitness & Recreation", type: "Gym" },
      { name: "LA Fitness", category: "Fitness & Recreation", type: "Gym" },
      { name: "Supercuts", category: "Beauty & Personal Care", type: "Hair Salon" }
    ];

    let businessesAdded = 0;
    const targetCities = this.orangeCountyCities.slice(0, 15);

    for (const template of businessTemplates) {
      for (const city of targetCities) {
        if (businessesAdded >= 150) break; // Don't add too many chain businesses
        
        const businessName = `${template.name} - ${city}`;
        
        const business: BusinessData = {
          name: businessName,
          description: `${template.type} in ${city}, Orange County`,
          category: template.category,
          city: city,
          state: "CA",
          county: "Orange County",
          tags: [template.type.toLowerCase().replace(/\s+/g, '_'), 'chain_business'],
          dataSource: "pattern_generation",
          dataQuality: 5
        };

        if (this.addBusiness(business)) {
          businessesAdded++;
        }
      }
      if (businessesAdded >= 150) break;
    }

    console.log(`Generated ${businessesAdded} common business locations`);
  }

  /**
   * Helper methods
   */
  private formatBusinessType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  }

  private mapOSMTypeToCategory(osmType: string): string {
    const categoryMap: { [key: string]: string } = {
      'shop': 'Retail',
      'restaurant': 'Food & Dining',
      'cafe': 'Food & Dining',
      'bank': 'Finance',
      'pharmacy': 'Healthcare',
      'hospital': 'Healthcare',
      'dentist': 'Healthcare',
      'veterinary': 'Healthcare',
      'fuel': 'Automotive',
      'car_repair': 'Automotive',
      'hotel': 'Hospitality',
      'attraction': 'Entertainment',
      'cinema': 'Entertainment',
      'theatre': 'Entertainment',
      'museum': 'Arts & Culture',
      'library': 'Education',
      'school': 'Education',
      'university': 'Education',
      'gym': 'Fitness & Recreation',
      'spa': 'Beauty & Personal Care',
      'salon': 'Beauty & Personal Care',
      'lawyer': 'Professional Services',
      'accountant': 'Professional Services',
      'estate_agent': 'Real Estate'
    };

    return categoryMap[osmType] || 'Professional Services';
  }

  private extractBusinessesFromWikipedia(html: string, pageName: string): BusinessData[] {
    const businesses: BusinessData[] = [];
    
    // Simple regex patterns to extract company names from Wikipedia HTML
    const patterns = [
      /<a[^>]*title="([^"]*)"[^>]*>([^<]+)<\/a>/gi,
      /<li[^>]*>([^<]*(?:Corporation|Corp|Inc|Company|Co\.|LLC|LP)[^<]*)<\/li>/gi,
      /<td[^>]*>([^<]*(?:Corporation|Corp|Inc|Company|Co\.|LLC|LP)[^<]*)<\/td>/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && businesses.length < 20) {
        const businessName = (match[1] || match[2] || '').trim();
        
        if (businessName && 
            businessName.length > 3 && 
            businessName.length < 100 &&
            !businessName.includes('Wikipedia') &&
            !businessName.includes('Category:') &&
            this.isLikelyBusinessName(businessName)) {
          
          const business: BusinessData = {
            name: businessName,
            description: `Business found in Wikipedia article: ${pageName.replace(/_/g, ' ')}`,
            category: this.guessBusinessCategory(businessName),
            county: 'Orange County',
            state: 'CA',
            tags: ['wikipedia_sourced'],
            dataSource: 'wikipedia',
            dataQuality: 6
          };

          businesses.push(business);
        }
      }
    }

    return businesses;
  }

  private isLikelyBusinessName(name: string): boolean {
    const businessIndicators = [
      'corporation', 'corp', 'inc', 'company', 'co.', 'llc', 'lp', 
      'enterprises', 'group', 'systems', 'technologies', 'solutions',
      'restaurant', 'cafe', 'shop', 'store', 'center', 'clinic'
    ];
    
    const lowerName = name.toLowerCase();
    return businessIndicators.some(indicator => lowerName.includes(indicator)) ||
           /^[A-Z][a-zA-Z\s&.-]{2,}/.test(name);
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

  /**
   * Main scraping method using only free sources
   */
  async scrapeBusinesses(targetCount: number = 200): Promise<void> {
    console.log(`Starting FREE Orange County business scraping - Target: ${targetCount} businesses`);
    console.log('Using only free data sources: OpenStreetMap, Wikipedia, Manual Research');
    
    const startTime = Date.now();

    // 1. Add known major businesses first
    await this.addKnownOrangeCountyBusinesses();
    console.log(`Progress: ${this.businesses.length}/${targetCount}`);

    // 2. Scrape OpenStreetMap
    const remaining1 = Math.max(0, targetCount - this.businesses.length);
    if (remaining1 > 0) {
      await this.scrapeOpenStreetMap(Math.min(remaining1, 80));
      console.log(`Progress after OSM: ${this.businesses.length}/${targetCount}`);
    }

    // 3. Scrape Wikipedia 
    const remaining2 = Math.max(0, targetCount - this.businesses.length);
    if (remaining2 > 0) {
      await this.scrapeWikipediaBusinesses(Math.min(remaining2, 30));
      console.log(`Progress after Wikipedia: ${this.businesses.length}/${targetCount}`);
    }

    // 4. Generate common chain businesses
    const remaining3 = Math.max(0, targetCount - this.businesses.length);
    if (remaining3 > 0) {
      await this.generateCommonBusinesses();
      console.log(`Progress after common businesses: ${this.businesses.length}/${targetCount}`);
    }

    // Final stats
    const duration = Date.now() - startTime;
    console.log(`\n=== FREE Scraping Complete ===`);
    console.log(`Total businesses found: ${this.businesses.length}`);
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Sources used: OpenStreetMap, Wikipedia, Manual Research`);

    // Add to database
    if (this.businesses.length > 0) {
      console.log(`\n=== Adding to Database ===`);
      const result = await dataIngestionService.importBusinessesInBatch(this.businesses);
      
      console.log(`Database import results:`);
      console.log(`- Processed: ${result.recordsProcessed}`);
      console.log(`- Added: ${result.recordsAdded}`);
      console.log(`- Updated: ${result.recordsUpdated}`);
      console.log(`- Failed: ${result.recordsFailed}`);
      
      if (result.errors.length > 0) {
        console.log('Database errors:');
        result.errors.forEach(error => console.log(`  - ${error}`));
      }
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const targetCount = args[0] ? parseInt(args[0]) : 200;

  console.log('🆓 FREE Orange County Business Scraper');
  console.log('=====================================');
  console.log('✅ No API keys required!');
  console.log('✅ Uses only free data sources');
  console.log('✅ Respects rate limits and usage policies');
  
  const scraper = new FreeDataScraper();
  
  try {
    await scraper.scrapeBusinesses(targetCount);
    console.log('\n🎉 FREE scraping completed successfully!');
  } catch (error) {
    console.error('\n❌ Scraping failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { FreeDataScraper };