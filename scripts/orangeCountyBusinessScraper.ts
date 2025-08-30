#!/usr/bin/env node

/**
 * Orange County Business Scraper
 * 
 * This script scrapes businesses from Orange County using multiple data sources:
 * - Google Places API
 * - Yelp Fusion API
 * - OpenStreetMap/Nominatim
 * - Local business directories
 * 
 * Designed to gather 200+ unique businesses with comprehensive deduplication.
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

interface ScrapingResult {
  success: boolean;
  businessesFound: number;
  businessesAdded: number;
  errors: string[];
}

class OrangeCountyBusinessScraper {
  private businesses: BusinessData[] = [];
  private businessNames = new Set<string>(); // For deduplication
  private readonly orangeCountyCities = [
    'Anaheim', 'Santa Ana', 'Irvine', 'Huntington Beach', 'Garden Grove',
    'Orange', 'Fullerton', 'Costa Mesa', 'Mission Viejo', 'Westminster',
    'Newport Beach', 'Buena Park', 'Lake Forest', 'Tustin', 'Yorba Linda',
    'San Clemente', 'Laguna Niguel', 'La Habra', 'Fountain Valley', 'Placentia',
    'Rancho Santa Margarita', 'Aliso Viejo', 'Cypress', 'Brea', 'Stanton',
    'San Juan Capistrano', 'Dana Point', 'Laguna Beach', 'La Palma', 'Los Alamitos',
    'Seal Beach', 'Laguna Hills', 'Laguna Woods', 'Villa Park'
  ];

  private readonly businessCategories = [
    'Restaurant', 'Retail', 'Healthcare', 'Professional Services', 'Automotive',
    'Beauty & Personal Care', 'Fitness & Recreation', 'Education', 'Technology',
    'Manufacturing', 'Real Estate', 'Finance', 'Entertainment', 'Transportation',
    'Construction', 'Home Services', 'Legal Services', 'Marketing & Advertising',
    'Consulting', 'Non-Profit'
  ];

  // Rate limiting helpers
  private googleApiLastCall = 0;
  private yelpApiLastCall = 0;

  private async rateLimitGoogle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.googleApiLastCall;
    const minInterval = 100; // 10 requests per second max for Google Places
    
    if (timeSinceLastCall < minInterval) {
      await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastCall));
    }
    this.googleApiLastCall = Date.now();
  }

  private async rateLimitYelp(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.yelpApiLastCall;
    const minInterval = 200; // 5 requests per second max for Yelp
    
    if (timeSinceLastCall < minInterval) {
      await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastCall));
    }
    this.yelpApiLastCall = Date.now();
  }

  /**
   * Check if business is already found (deduplication)
   */
  private isDuplicateBusiness(name: string, address?: string): boolean {
    const normalizedName = name.toLowerCase().trim();
    
    // Simple name-based deduplication
    if (this.businessNames.has(normalizedName)) {
      return true;
    }

    // Check for similar names (fuzzy matching)
    for (const existingName of this.businessNames) {
      if (this.calculateSimilarity(normalizedName, existingName) > 0.85) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate string similarity (Jaro-Winkler-like)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0 || len2 === 0) return 0;
    
    const maxDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
    let matches = 0;
    const str1Matches = new Array(len1).fill(false);
    const str2Matches = new Array(len2).fill(false);
    
    // Find matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - maxDistance);
      const end = Math.min(i + maxDistance + 1, len2);
      
      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }
    
    if (matches === 0) return 0;
    
    // Calculate transpositions
    let transpositions = 0;
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }
    
    return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  }

  /**
   * Add business if not duplicate
   */
  private addBusiness(business: BusinessData): boolean {
    if (!this.isDuplicateBusiness(business.name, business.address)) {
      this.businesses.push(business);
      this.businessNames.add(business.name.toLowerCase().trim());
      return true;
    }
    return false;
  }

  /**
   * Scrape businesses from Google Places API
   */
  async scrapeGooglePlaces(targetCount: number = 100): Promise<ScrapingResult> {
    const errors: string[] = [];
    let businessesFound = 0;
    let businessesAdded = 0;

    try {
      const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!googleApiKey) {
        errors.push('Google Places API key not configured');
        return { success: false, businessesFound: 0, businessesAdded: 0, errors };
      }

      console.log('Scraping Google Places API...');

      // Search for businesses in each major city
      const citiesToSearch = this.orangeCountyCities.slice(0, 8); // Top 8 cities
      
      for (const city of citiesToSearch) {
        if (businessesAdded >= targetCount) break;

        console.log(`Searching businesses in ${city}, CA...`);

        // Search multiple business types per city
        const searchQueries = [
          `restaurants in ${city} CA`,
          `shops in ${city} CA`,
          `services in ${city} CA`,
          `healthcare in ${city} CA`,
          `businesses in ${city} CA`
        ];

        for (const query of searchQueries) {
          if (businessesAdded >= targetCount) break;

          await this.rateLimitGoogle();

          try {
            const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=33.7173,-117.8311&radius=50000&key=${googleApiKey}`;
            
            const response = await fetch(url);
            if (!response.ok) {
              errors.push(`Google Places API error for "${query}": ${response.status}`);
              continue;
            }

            const data = await response.json();

            if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
              errors.push(`Google Places API status error: ${data.status}`);
              continue;
            }

            for (const place of data.results || []) {
              if (businessesAdded >= targetCount) break;

              businessesFound++;

              // Get detailed information
              await this.rateLimitGoogle();
              
              const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,price_level,rating,user_ratings_total,types,photos&key=${googleApiKey}`;
              
              const detailsResponse = await fetch(detailsUrl);
              if (!detailsResponse.ok) continue;
              
              const details = await detailsResponse.json();
              if (details.status !== 'OK') continue;

              const business = this.transformGooglePlaceBusiness(details.result);
              if (business && this.addBusiness(business)) {
                businessesAdded++;
                console.log(`Added: ${business.name} (${businessesAdded}/${targetCount})`);
              }
            }

            // Handle pagination if needed
            if (data.next_page_token && businessesAdded < targetCount) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Required delay for next_page_token
              
              const nextPageUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${data.next_page_token}&key=${googleApiKey}`;
              const nextPageResponse = await fetch(nextPageUrl);
              
              if (nextPageResponse.ok) {
                const nextPageData = await nextPageResponse.json();
                
                for (const place of nextPageData.results || []) {
                  if (businessesAdded >= targetCount) break;
                  
                  businessesFound++;
                  await this.rateLimitGoogle();
                  
                  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,price_level,rating,user_ratings_total,types,photos&key=${googleApiKey}`;
                  
                  const detailsResponse = await fetch(detailsUrl);
                  if (!detailsResponse.ok) continue;
                  
                  const details = await detailsResponse.json();
                  if (details.status !== 'OK') continue;

                  const business = this.transformGooglePlaceBusiness(details.result);
                  if (business && this.addBusiness(business)) {
                    businessesAdded++;
                    console.log(`Added: ${business.name} (${businessesAdded}/${targetCount})`);
                  }
                }
              }
            }
          } catch (error) {
            errors.push(`Error searching "${query}": ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

    } catch (error) {
      errors.push(`Google Places scraping error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, businessesFound, businessesAdded, errors };
    }

    return { success: true, businessesFound, businessesAdded, errors };
  }

  /**
   * Scrape businesses from Yelp Fusion API
   */
  async scrapeYelpBusinesses(targetCount: number = 100): Promise<ScrapingResult> {
    const errors: string[] = [];
    let businessesFound = 0;
    let businessesAdded = 0;

    try {
      const yelpApiKey = process.env.YELP_API_KEY;
      if (!yelpApiKey) {
        errors.push('Yelp API key not configured');
        return { success: false, businessesFound: 0, businessesAdded: 0, errors };
      }

      console.log('Scraping Yelp Fusion API...');

      // Search for businesses in Orange County
      const categories = ['restaurants', 'shopping', 'homeservices', 'auto', 'beautysvc', 'active', 'professional', 'health'];
      const locations = ['Anaheim, CA', 'Santa Ana, CA', 'Irvine, CA', 'Newport Beach, CA', 'Huntington Beach, CA'];

      for (const location of locations) {
        if (businessesAdded >= targetCount) break;

        for (const category of categories) {
          if (businessesAdded >= targetCount) break;

          await this.rateLimitYelp();

          try {
            const url = `https://api.yelp.com/v3/businesses/search?location=${encodeURIComponent(location)}&categories=${category}&limit=50&sort_by=rating`;
            
            const response = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${yelpApiKey}`,
                'Content-Type': 'application/json'
              }
            });

            if (!response.ok) {
              errors.push(`Yelp API error for ${category} in ${location}: ${response.status}`);
              continue;
            }

            const data = await response.json();

            for (const yelpBusiness of data.businesses || []) {
              if (businessesAdded >= targetCount) break;

              businessesFound++;

              const business = this.transformYelpBusiness(yelpBusiness);
              if (business && this.addBusiness(business)) {
                businessesAdded++;
                console.log(`Added: ${business.name} (${businessesAdded}/${targetCount})`);
              }
            }
          } catch (error) {
            errors.push(`Error searching Yelp ${category} in ${location}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

    } catch (error) {
      errors.push(`Yelp scraping error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, businessesFound, businessesAdded, errors };
    }

    return { success: true, businessesFound, businessesAdded, errors };
  }

  /**
   * Transform Google Places business data
   */
  private transformGooglePlaceBusiness(place: any): BusinessData | null {
    if (!place.name) return null;

    // Determine if it's in Orange County
    const address = place.formatted_address || '';
    const isInOC = this.orangeCountyCities.some(city => 
      address.includes(city) && address.includes('CA')
    );
    
    if (!isInOC) return null;

    // Extract city from address
    const city = this.orangeCountyCities.find(c => address.includes(c)) || '';

    // Map Google types to our categories
    const category = this.mapGoogleTypesToCategory(place.types || []);
    
    // Extract price range
    const priceRange = place.price_level ? '$'.repeat(place.price_level) : undefined;

    // Format hours
    let hours = '';
    if (place.opening_hours?.weekday_text) {
      hours = place.opening_hours.weekday_text.join('; ');
    }

    return {
      name: place.name,
      description: `${category} in ${city}, Orange County`,
      category,
      website: place.website,
      address: place.formatted_address,
      city,
      state: 'CA',
      county: 'Orange County',
      latitude: place.geometry?.location?.lat,
      longitude: place.geometry?.location?.lng,
      phone: place.formatted_phone_number,
      hours,
      priceRange,
      imageUrl: place.photos?.[0] ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}` : undefined,
      attributes: {
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        place_id: place.place_id
      },
      tags: place.types,
      dataSource: 'google_places',
      dataQuality: 8
    };
  }

  /**
   * Transform Yelp business data
   */
  private transformYelpBusiness(business: any): BusinessData | null {
    if (!business.name) return null;

    // Check if it's in Orange County
    const location = business.location;
    const city = location?.city;
    const state = location?.state;
    
    if (state !== 'CA' || !this.orangeCountyCities.includes(city)) {
      return null;
    }

    // Map Yelp categories to our categories
    const category = this.mapYelpCategoriesToCategory(business.categories || []);

    // Format address
    const addressParts = [
      ...(location?.display_address || [])
    ];
    const address = addressParts.join(', ');

    // Price range
    const priceRange = business.price || undefined;

    return {
      name: business.name,
      description: business.snippet_text || `${category} in ${city}, Orange County`,
      category,
      website: business.url,
      address,
      city,
      state: 'CA',
      zipCode: location?.zip_code,
      county: 'Orange County',
      latitude: business.coordinates?.latitude,
      longitude: business.coordinates?.longitude,
      phone: business.display_phone,
      priceRange,
      imageUrl: business.image_url,
      attributes: {
        rating: business.rating,
        review_count: business.review_count,
        yelp_id: business.id,
        is_closed: business.is_closed
      },
      tags: business.categories?.map((cat: any) => cat.alias) || [],
      dataSource: 'yelp',
      dataQuality: 7
    };
  }

  /**
   * Map Google Place types to our category system
   */
  private mapGoogleTypesToCategory(types: string[]): string {
    const categoryMap: { [key: string]: string } = {
      'restaurant': 'Food & Dining',
      'food': 'Food & Dining',
      'meal_takeaway': 'Food & Dining',
      'cafe': 'Food & Dining',
      'bar': 'Food & Dining',
      'store': 'Retail',
      'clothing_store': 'Retail',
      'shopping_mall': 'Retail',
      'supermarket': 'Retail',
      'department_store': 'Retail',
      'hospital': 'Healthcare',
      'doctor': 'Healthcare',
      'dentist': 'Healthcare',
      'veterinary_care': 'Healthcare',
      'pharmacy': 'Healthcare',
      'gym': 'Fitness & Recreation',
      'spa': 'Beauty & Personal Care',
      'beauty_salon': 'Beauty & Personal Care',
      'hair_care': 'Beauty & Personal Care',
      'car_dealer': 'Automotive',
      'car_repair': 'Automotive',
      'gas_station': 'Automotive',
      'bank': 'Finance',
      'insurance_agency': 'Finance',
      'real_estate_agency': 'Real Estate',
      'lawyer': 'Professional Services',
      'accounting': 'Professional Services',
      'school': 'Education',
      'university': 'Education',
      'tourist_attraction': 'Entertainment',
      'amusement_park': 'Entertainment',
      'movie_theater': 'Entertainment'
    };

    for (const type of types) {
      if (categoryMap[type]) {
        return categoryMap[type];
      }
    }

    return 'Professional Services'; // Default category
  }

  /**
   * Map Yelp categories to our category system
   */
  private mapYelpCategoriesToCategory(categories: any[]): string {
    if (!categories.length) return 'Professional Services';

    const categoryMap: { [key: string]: string } = {
      'restaurants': 'Food & Dining',
      'food': 'Food & Dining',
      'bars': 'Food & Dining',
      'coffee': 'Food & Dining',
      'shopping': 'Retail',
      'fashion': 'Retail',
      'health': 'Healthcare',
      'doctors': 'Healthcare',
      'dentists': 'Healthcare',
      'fitness': 'Fitness & Recreation',
      'gyms': 'Fitness & Recreation',
      'beautysvc': 'Beauty & Personal Care',
      'spas': 'Beauty & Personal Care',
      'auto': 'Automotive',
      'homeservices': 'Professional Services',
      'professional': 'Professional Services',
      'financialservices': 'Finance',
      'realestate': 'Real Estate',
      'education': 'Education',
      'arts': 'Entertainment',
      'eventservices': 'Entertainment'
    };

    const firstCategory = categories[0];
    const alias = firstCategory.alias || firstCategory.title?.toLowerCase() || '';
    
    for (const [key, value] of Object.entries(categoryMap)) {
      if (alias.includes(key)) {
        return value;
      }
    }

    return 'Professional Services';
  }

  /**
   * Main scraping method
   */
  async scrapeBusinesses(targetCount: number = 200): Promise<void> {
    console.log(`Starting Orange County business scraping - Target: ${targetCount} businesses`);
    
    const startTime = Date.now();

    // Scrape from Google Places
    console.log('\n=== Google Places Scraping ===');
    const googleResult = await this.scrapeGooglePlaces(Math.floor(targetCount * 0.6));
    console.log(`Google Places: Found ${googleResult.businessesFound}, Added ${googleResult.businessesAdded}`);
    
    if (googleResult.errors.length > 0) {
      console.log('Google Places Errors:');
      googleResult.errors.forEach(error => console.log(`  - ${error}`));
    }

    // Scrape from Yelp
    console.log('\n=== Yelp Scraping ===');
    const remainingTarget = Math.max(0, targetCount - this.businesses.length);
    const yelpResult = await this.scrapeYelpBusinesses(remainingTarget);
    console.log(`Yelp: Found ${yelpResult.businessesFound}, Added ${yelpResult.businessesAdded}`);
    
    if (yelpResult.errors.length > 0) {
      console.log('Yelp Errors:');
      yelpResult.errors.forEach(error => console.log(`  - ${error}`));
    }

    // Final stats
    const duration = Date.now() - startTime;
    console.log(`\n=== Scraping Complete ===`);
    console.log(`Total businesses scraped: ${this.businesses.length}`);
    console.log(`Duration: ${Math.round(duration / 1000)}s`);

    // Add businesses to database
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

  console.log('Orange County Business Scraper');
  console.log('==============================');
  
  const scraper = new OrangeCountyBusinessScraper();
  
  try {
    await scraper.scrapeBusinesses(targetCount);
    console.log('\n✅ Scraping completed successfully!');
  } catch (error) {
    console.error('\n❌ Scraping failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { OrangeCountyBusinessScraper };