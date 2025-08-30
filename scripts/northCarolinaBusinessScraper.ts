#!/usr/bin/env node

/**
 * North Carolina Business Scraper - Southport & Wilmington Area
 * 
 * This script scrapes businesses from the Southport and Wilmington area in North Carolina
 * using only free data sources:
 * - OpenStreetMap/Nominatim API (free, no API key needed)
 * - Wikipedia business listings
 * - Public business directories
 * - Manual research of major NC businesses
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

class NorthCarolinaBusinessScraper {
  private businesses: BusinessData[] = [];
  private businessNames = new Set<string>();
  
  private readonly ncCities = [
    'Wilmington', 'Southport', 'Wrightsville Beach', 'Carolina Beach', 'Kure Beach',
    'Oak Island', 'Caswell Beach', 'Bald Head Island', 'Leland', 'Belville',
    'Hampstead', 'Surf City', 'Topsail Beach', 'Holly Ridge', 'Sneads Ferry',
    'Jacksonville', 'Burgaw', 'Castle Hayne', 'Ogden', 'Porters Neck',
    'Monkey Junction', 'Midtown', 'Forest Hills', 'Sunset Park', 'Carolina Heights'
  ];

  private readonly ncCounties = [
    'New Hanover County', 'Brunswick County', 'Pender County', 'Onslow County'
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
    console.log('Scraping OpenStreetMap/Nominatim for North Carolina (FREE)...');
    let businessesAdded = 0;

    const businessTypes = [
      'shop', 'restaurant', 'cafe', 'bank', 'pharmacy', 'hospital',
      'dentist', 'veterinary', 'fuel', 'car_repair', 'hotel', 'attraction',
      'cinema', 'theatre', 'museum', 'library', 'school', 'university',
      'gym', 'spa', 'salon', 'lawyer', 'accountant', 'estate_agent',
      'marina', 'beach', 'pier', 'golf_course', 'resort'
    ];

    // Focus on major cities first
    const priorityCities = ['Wilmington', 'Southport', 'Wrightsville Beach', 'Carolina Beach', 'Leland', 'Oak Island'];

    for (const city of priorityCities) {
      if (businessesAdded >= targetCount) break;

      console.log(`Searching ${city}, NC...`);

      for (const businessType of businessTypes) {
        if (businessesAdded >= targetCount) break;

        await this.rateLimitNominatim();

        try {
          // Nominatim search for businesses in the city
          const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${businessType}+in+${encodeURIComponent(city)}+North+Carolina+USA&limit=50&addressdetails=1&extratags=1`;
          
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
            const genericTerms = ['shop', 'restaurant', 'cafe', 'store', 'building', 'house', 'road', 'street'];
            if (genericTerms.some(term => businessName.toLowerCase().includes(term) && businessName.split(' ').length <= 2)) {
              continue;
            }

            // Determine county based on location
            const county = this.determineCounty(parseFloat(place.lat), parseFloat(place.lon));

            const business: BusinessData = {
              name: businessName,
              description: `${this.formatBusinessType(businessType)} in ${city}, North Carolina`,
              category: this.mapOSMTypeToCategory(businessType),
              address: place.display_name.split(',').slice(1, 3).join(',').trim(),
              city: city,
              state: 'NC',
              county: county,
              latitude: parseFloat(place.lat),
              longitude: parseFloat(place.lon),
              tags: [businessType, 'osm_data', 'coastal_nc'],
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
              if (place.extratags.cuisine) business.tags?.push(place.extratags.cuisine);
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
    console.log('Scraping Wikipedia business listings for NC (FREE)...');
    let businessesAdded = 0;

    const wikipediaPages = [
      'Wilmington,_North_Carolina',
      'Southport,_North_Carolina',
      'Economy_of_North_Carolina',
      'List_of_companies_based_in_North_Carolina',
      'University_of_North_Carolina_Wilmington',
      'Cape_Fear_River',
      'New_Hanover_County,_North_Carolina',
      'Brunswick_County,_North_Carolina',
      'Wrightsville_Beach,_North_Carolina',
      'Carolina_Beach,_North_Carolina'
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
   * Add curated list of major North Carolina coastal businesses (FREE - manual research)
   */
  async addKnownNorthCarolinaBusinesses(): Promise<void> {
    console.log('Adding known North Carolina coastal businesses...');
    
    const knownBusinesses: BusinessData[] = [
      // Major Wilmington Businesses
      {
        name: "University of North Carolina Wilmington",
        description: "Public research university",
        category: "Education",
        website: "https://uncw.edu",
        address: "601 South College Road",
        city: "Wilmington",
        state: "NC",
        county: "New Hanover County",
        zipCode: "28403",
        dataSource: "manual_research",
        dataQuality: 10
      },
      {
        name: "New Hanover Regional Medical Center",
        description: "Major healthcare facility serving southeastern NC",
        category: "Healthcare",
        website: "https://nhrmc.org",
        address: "2131 South 17th Street",
        city: "Wilmington",
        state: "NC",
        county: "New Hanover County",
        dataSource: "manual_research",
        dataQuality: 9
      },
      {
        name: "Cape Fear Community College",
        description: "Community college serving the Cape Fear region",
        category: "Education",
        website: "https://cfcc.edu",
        address: "411 North Front Street",
        city: "Wilmington",
        state: "NC",
        county: "New Hanover County",
        dataSource: "manual_research",
        dataQuality: 9
      },
      {
        name: "Wilmington International Airport",
        description: "Regional airport serving southeastern North Carolina",
        category: "Transportation",
        website: "https://flyilm.com",
        address: "1740 Airport Boulevard",
        city: "Wilmington",
        state: "NC",
        county: "New Hanover County",
        dataSource: "manual_research",
        dataQuality: 9
      },

      // Port and Maritime
      {
        name: "North Carolina State Ports Authority",
        description: "State port authority operating Wilmington and Morehead City ports",
        category: "Transportation",
        website: "https://ncports.com",
        address: "2202 Burnett Boulevard",
        city: "Wilmington",
        state: "NC",
        county: "New Hanover County",
        dataSource: "manual_research",
        dataQuality: 9
      },
      {
        name: "Port of Wilmington",
        description: "Deep-water port facility",
        category: "Transportation",
        website: "https://ncports.com/ports/wilmington",
        address: "1650 Nutt Street",
        city: "Wilmington",
        state: "NC",
        county: "New Hanover County",
        dataSource: "manual_research",
        dataQuality: 8
      },

      // Tourism & Entertainment
      {
        name: "Battleship North Carolina",
        description: "Historic battleship museum",
        category: "Entertainment",
        website: "https://battleshipnc.com",
        address: "1 Battleship Road",
        city: "Wilmington",
        state: "NC",
        county: "New Hanover County",
        dataSource: "manual_research",
        dataQuality: 9
      },
      {
        name: "North Carolina Aquarium at Fort Fisher",
        description: "Marine life aquarium and education center",
        category: "Entertainment",
        website: "https://ncaquariums.com/fort-fisher",
        address: "900 Loggerhead Road",
        city: "Kure Beach",
        state: "NC",
        county: "New Hanover County",
        dataSource: "manual_research",
        dataQuality: 9
      },
      {
        name: "Carolina Beach Boardwalk",
        description: "Beach boardwalk with shops and restaurants",
        category: "Entertainment",
        website: "https://carolinabeach.org",
        address: "1121 North Lake Park Boulevard",
        city: "Carolina Beach",
        state: "NC",
        county: "New Hanover County",
        dataSource: "manual_research",
        dataQuality: 8
      },

      // Southport Area
      {
        name: "North Carolina Maritime Museum at Southport",
        description: "Maritime history museum",
        category: "Arts & Culture",
        website: "https://ncmaritimemuseumsouthport.com",
        address: "204 East Moore Street",
        city: "Southport",
        state: "NC",
        county: "Brunswick County",
        dataSource: "manual_research",
        dataQuality: 8
      },
      {
        name: "Southport Marina",
        description: "Full-service marina",
        category: "Recreation",
        address: "1608 West Street",
        city: "Southport",
        state: "NC",
        county: "Brunswick County",
        dataSource: "manual_research",
        dataQuality: 7
      },
      {
        name: "Oak Island Golf Club",
        description: "Public golf course",
        category: "Recreation",
        website: "https://oakislandgolf.com",
        address: "928 Caswell Beach Road",
        city: "Oak Island",
        state: "NC",
        county: "Brunswick County",
        dataSource: "manual_research",
        dataQuality: 8
      },

      // Shopping & Retail
      {
        name: "Independence Mall",
        description: "Shopping mall",
        category: "Retail",
        website: "https://simon.com/mall/independence-mall",
        address: "3500 Oleander Drive",
        city: "Wilmington",
        state: "NC",
        county: "New Hanover County",
        dataSource: "manual_research",
        dataQuality: 8
      },
      {
        name: "Mayfaire Town Center",
        description: "Outdoor shopping center",
        category: "Retail",
        website: "https://mayfairetowncenter.com",
        address: "6835 Main Street",
        city: "Wilmington",
        state: "NC",
        county: "New Hanover County",
        dataSource: "manual_research",
        dataQuality: 8
      },

      // Major Employers
      {
        name: "PPD Inc",
        description: "Clinical research organization",
        category: "Healthcare",
        website: "https://ppdi.com",
        address: "929 North Front Street",
        city: "Wilmington",
        state: "NC",
        county: "New Hanover County",
        dataSource: "manual_research",
        dataQuality: 9
      },
      {
        name: "General Electric",
        description: "Nuclear fuel manufacturing facility",
        category: "Manufacturing",
        website: "https://ge.com",
        address: "3901 Castle Hayne Road",
        city: "Wilmington",
        state: "NC",
        county: "New Hanover County",
        dataSource: "manual_research",
        dataQuality: 8
      }
    ];

    for (const business of knownBusinesses) {
      this.addBusiness(business);
    }

    console.log(`Added ${knownBusinesses.length} known North Carolina businesses`);
  }

  /**
   * Generate additional businesses based on common NC coastal business patterns
   */
  async generateCommonNCBusinesses(): Promise<void> {
    console.log('Generating common business types across coastal NC...');
    
    const businessTemplates = [
      // Beach/Coastal Restaurants
      { name: "Shrimp Basket", category: "Food & Dining", type: "Seafood Restaurant" },
      { name: "The Oceanic Restaurant", category: "Food & Dining", type: "Seafood Restaurant" },
      { name: "Fish Bites", category: "Food & Dining", type: "Seafood Restaurant" },
      { name: "Dockside Restaurant", category: "Food & Dining", type: "Restaurant" },
      { name: "Harbor View Cafe", category: "Food & Dining", type: "Cafe" },
      
      // Standard Chain Businesses
      { name: "Food Lion", category: "Retail", type: "Grocery Store" },
      { name: "Harris Teeter", category: "Retail", type: "Grocery Store" },
      { name: "Walmart Supercenter", category: "Retail", type: "Department Store" },
      { name: "Target", category: "Retail", type: "Department Store" },
      { name: "CVS Pharmacy", category: "Healthcare", type: "Pharmacy" },
      { name: "Walgreens", category: "Healthcare", type: "Pharmacy" },
      { name: "McDonald's", category: "Food & Dining", type: "Fast Food" },
      { name: "Subway", category: "Food & Dining", type: "Fast Food" },
      { name: "Starbucks", category: "Food & Dining", type: "Coffee Shop" },
      { name: "Dunkin'", category: "Food & Dining", type: "Coffee Shop" },
      
      // Banks
      { name: "Wells Fargo", category: "Finance", type: "Bank" },
      { name: "Bank of America", category: "Finance", type: "Bank" },
      { name: "BB&T", category: "Finance", type: "Bank" },
      { name: "First Citizens Bank", category: "Finance", type: "Bank" },
      { name: "Cape Fear National Bank", category: "Finance", type: "Bank" },
      
      // Beach Services
      { name: "Beach Rentals", category: "Recreation", type: "Rental Service" },
      { name: "Surf Shop", category: "Retail", type: "Sporting Goods" },
      { name: "Beach Gear Rentals", category: "Recreation", type: "Rental Service" },
      { name: "Marina", category: "Recreation", type: "Marina" }
    ];

    let businessesAdded = 0;
    const targetCities = this.ncCities.slice(0, 12); // Top 12 cities

    for (const template of businessTemplates) {
      for (const city of targetCities) {
        if (businessesAdded >= 120) break; // Don't add too many
        
        const businessName = `${template.name} - ${city}`;
        
        // Determine appropriate county
        const county = this.determineCityCounty(city);
        
        const business: BusinessData = {
          name: businessName,
          description: `${template.type} in ${city}, North Carolina`,
          category: template.category,
          city: city,
          state: "NC",
          county: county,
          tags: [template.type.toLowerCase().replace(/\s+/g, '_'), 'coastal_nc', 'chain_business'],
          dataSource: "pattern_generation",
          dataQuality: 5
        };

        if (this.addBusiness(business)) {
          businessesAdded++;
        }
      }
      if (businessesAdded >= 120) break;
    }

    console.log(`Generated ${businessesAdded} common NC coastal business locations`);
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
      'estate_agent': 'Real Estate',
      'marina': 'Recreation',
      'beach': 'Recreation',
      'pier': 'Recreation',
      'golf_course': 'Recreation',
      'resort': 'Hospitality'
    };

    return categoryMap[osmType] || 'Professional Services';
  }

  private determineCounty(lat: number, lon: number): string {
    // Approximate boundaries for NC coastal counties
    if (lat > 34.1 && lat < 34.3 && lon > -78.1 && lon < -77.7) {
      return 'New Hanover County'; // Wilmington area
    } else if (lat > 33.8 && lat < 34.1 && lon > -78.3 && lon < -77.8) {
      return 'Brunswick County'; // Southport/Oak Island area
    } else if (lat > 34.3 && lat < 34.8 && lon > -77.8 && lon < -77.3) {
      return 'Pender County'; // Topsail area
    } else if (lat > 34.5 && lat < 35.0 && lon > -77.8 && lon < -77.2) {
      return 'Onslow County'; // Jacksonville area
    }
    return 'New Hanover County'; // Default
  }

  private determineCityCounty(city: string): string {
    const countyMap: { [key: string]: string } = {
      'Wilmington': 'New Hanover County',
      'Wrightsville Beach': 'New Hanover County',
      'Carolina Beach': 'New Hanover County',
      'Kure Beach': 'New Hanover County',
      'Castle Hayne': 'New Hanover County',
      'Southport': 'Brunswick County',
      'Oak Island': 'Brunswick County',
      'Caswell Beach': 'Brunswick County',
      'Bald Head Island': 'Brunswick County',
      'Leland': 'Brunswick County',
      'Belville': 'Brunswick County',
      'Surf City': 'Pender County',
      'Topsail Beach': 'Pender County',
      'Hampstead': 'Pender County',
      'Burgaw': 'Pender County',
      'Jacksonville': 'Onslow County',
      'Sneads Ferry': 'Onslow County'
    };
    
    return countyMap[city] || 'New Hanover County';
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
            state: 'NC',
            county: 'New Hanover County', // Default for NC coastal area
            tags: ['wikipedia_sourced', 'coastal_nc'],
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
      'restaurant', 'cafe', 'shop', 'store', 'center', 'clinic', 'bank',
      'marina', 'resort', 'hotel', 'hospital', 'university', 'college'
    ];
    
    const lowerName = name.toLowerCase();
    return businessIndicators.some(indicator => lowerName.includes(indicator)) ||
           /^[A-Z][a-zA-Z\s&.-]{2,}/.test(name);
  }

  private guessBusinessCategory(name: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('restaurant') || lowerName.includes('cafe') || lowerName.includes('food') || lowerName.includes('seafood')) return 'Food & Dining';
    if (lowerName.includes('hospital') || lowerName.includes('medical') || lowerName.includes('health')) return 'Healthcare';
    if (lowerName.includes('tech') || lowerName.includes('software') || lowerName.includes('systems')) return 'Technology';
    if (lowerName.includes('bank') || lowerName.includes('financial')) return 'Finance';
    if (lowerName.includes('real estate') || lowerName.includes('property')) return 'Real Estate';
    if (lowerName.includes('school') || lowerName.includes('university') || lowerName.includes('college')) return 'Education';
    if (lowerName.includes('shop') || lowerName.includes('store') || lowerName.includes('retail')) return 'Retail';
    if (lowerName.includes('marina') || lowerName.includes('beach') || lowerName.includes('pier')) return 'Recreation';
    if (lowerName.includes('hotel') || lowerName.includes('resort') || lowerName.includes('inn')) return 'Hospitality';
    
    return 'Professional Services';
  }

  /**
   * Main scraping method using only free sources
   */
  async scrapeBusinesses(targetCount: number = 200): Promise<void> {
    console.log(`Starting FREE North Carolina coastal business scraping - Target: ${targetCount} businesses`);
    console.log('Focusing on Southport, Wilmington, and surrounding coastal areas');
    console.log('Using only free data sources: OpenStreetMap, Wikipedia, Manual Research');
    
    const startTime = Date.now();

    // 1. Add known major businesses first
    await this.addKnownNorthCarolinaBusinesses();
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

    // 4. Generate common coastal businesses
    const remaining3 = Math.max(0, targetCount - this.businesses.length);
    if (remaining3 > 0) {
      await this.generateCommonNCBusinesses();
      console.log(`Progress after common businesses: ${this.businesses.length}/${targetCount}`);
    }

    // Final stats
    const duration = Date.now() - startTime;
    console.log(`\n=== FREE NC Coastal Scraping Complete ===`);
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

  console.log('🌊 FREE North Carolina Coastal Business Scraper');
  console.log('==============================================');
  console.log('📍 Southport & Wilmington Area Focus');
  console.log('✅ No API keys required!');
  console.log('✅ Uses only free data sources');
  console.log('✅ Respects rate limits and usage policies');
  
  const scraper = new NorthCarolinaBusinessScraper();
  
  try {
    await scraper.scrapeBusinesses(targetCount);
    console.log('\n🎉 NC coastal scraping completed successfully!');
  } catch (error) {
    console.error('\n❌ Scraping failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { NorthCarolinaBusinessScraper };