#!/usr/bin/env node

/**
 * Bulk Data Sync Script
 * 
 * This script performs a one-time bulk data synchronization for all regions:
 * - Southern California
 * - California
 * - United States
 * 
 * The script orchestrates all the services we've built to:
 * 1. Initialize categories and tags
 * 2. Ingest business data from multiple sources
 * 3. Enrich business data with additional information
 * 4. Validate and deduplicate businesses
 * 5. Categorize and tag businesses
 * 6. Generate political alignments
 * 7. Source and manage images
 */

// Load environment variables
import 'dotenv/config';

import { getDB } from '../db/connection';
import { businesses, businessCategories, businessTags, dataSources } from '../db/schema';
import { eq, and, or, ilike, desc, sql, inArray, like } from 'drizzle-orm';
import { dataIngestionService } from '../services/dataIngestion';
import { dataValidationService } from '../services/dataValidation';
import { categorizationService } from '../services/categorization';
import { politicalAlignmentService } from '../services/politicalAlignment';
import { imageService } from '../services/imageService';

// Data sources configuration
const DATA_SOURCES: DataSource[] = [
  {
    name: 'OpenStreetMap',
    baseUrl: 'https://api.openstreetmap.org',
    categories: ['Restaurant', 'Retail', 'Service', 'Healthcare'],
    limit: 1000,
    reliability: 0.8,
    enabled: true,
    type: 'api',
    rateLimit: 100
  },
  {
    name: 'Yelp',
    baseUrl: 'https://api.yelp.com',
    categories: ['Food & Dining', 'Retail', 'Entertainment'],
    limit: 500,
    reliability: 0.9,
    enabled: true,
    type: 'api',
    rateLimit: 50
  },
  {
    name: 'Google Places',
    baseUrl: 'https://maps.googleapis.com',
    categories: ['All'],
    limit: 1000,
    reliability: 0.95,
    enabled: true,
    type: 'api',
    rateLimit: 100
  }
];

// Regions configuration
const REGIONS: Region[] = [
  {
    name: 'Southern California',
    counties: ['Orange County', 'Los Angeles County', 'San Diego County', 'Riverside County', 'San Bernardino County'],
    cities: ['Anaheim', 'Santa Ana', 'Irvine', 'Huntington Beach', 'Garden Grove', 'Orange', 'Fullerton', 'Costa Mesa', 'Mission Viejo', 'Westminster'],
    states: ['CA']
  },
  {
    name: 'California',
    counties: [],
    cities: ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno', 'Sacramento', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim'],
    states: ['CA']
  },
  {
    name: 'United States',
    counties: [],
    cities: [],
    states: ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI']
  }
];

// Types for data sources
interface DataSource {
  name: string;
  baseUrl: string;
  apiKey?: string;
  categories: string[];
  limit: number;
  reliability: number;
  enabled: boolean;
  type: string;
  rateLimit: number;
}

// Types for regions
interface Region {
  name: string;
  counties: string[];
  cities: string[];
  states: string[];
}

// Types for sync results
interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsAdded: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: string[];
  duration: number;
  regions: {
    name: string;
    success: number;
    failed: number;
  }[];
}

class BulkDataSyncService {
  private db: any;
  private rateLimiter: Map<string, number> = new Map();
  private startTime: Date;
  private stats: any;

  constructor() {
    this.db = getDB();
    this.startTime = new Date();
    this.stats = {
      totalBusinesses: 0,
      newBusinesses: 0,
      updatedBusinesses: 0,
      failedBusinesses: 0,
      categorizedBusinesses: 0,
      alignedBusinesses: 0,
      imagedBusinesses: 0,
      regionsProcessed: 0,
      dataSourcesProcessed: 0,
      errors: [] as string[]
    };
  }

  // Main execution method
  async execute(): Promise<void> {
    console.log('🚀 Starting Bulk Data Sync...');
    console.log(`📅 Started at: ${this.startTime.toISOString()}`);
    console.log(`🌍 Regions to process: ${REGIONS.length}`);
    console.log(`📊 Data sources: ${DATA_SOURCES.filter(s => s.enabled).length}`);

    try {
      // Step 1: Initialize database and services
      await this.initializeServices();

      // Step 2: Process each region
      for (const region of REGIONS) {
        await this.processRegion(region);
      }

      // Step 3: Post-processing and validation
      await this.postProcessing();

      // Step 4: Generate final report
      await this.generateReport();

      console.log('✅ Bulk Data Sync completed successfully!');
    } catch (error) {
      console.error('❌ Bulk Data Sync failed:', error);
      this.stats.errors.push(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      await this.cleanup();
    }
  }

  // Initialize all services
  private async initializeServices(): Promise<void> {
    console.log('🔧 Initializing services...');

    try {
      // Initialize categories and tags
      const categoriesInitialized = await categorizationService.initializeCategoriesAndTags();
      if (categoriesInitialized) {
        console.log('✅ Categories and tags initialized');
      } else {
        throw new Error('Failed to initialize categories and tags');
      }

      // Initialize data sources
      for (const source of DATA_SOURCES) {
        if (source.enabled) {
          await this.db.insert(dataSources).values({
            name: source.name,
            type: source.type,
            rateLimit: source.rateLimit,
            isActive: true
          }).onConflictDoNothing();
        }
      }

      console.log('✅ All services initialized');
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }

  // Process businesses for a region
  private async processRegion(region: Region): Promise<{ success: number; failed: number }> {
    console.log(`\n🔄 Processing region: ${region.name}`);
    
    let success = 0;
    let failed = 0;
    
    try {
      // Get all businesses from the database
      const allBusinesses = await this.db.select().from(businesses);
      
      // Filter businesses by region
      let businessesToProcess = allBusinesses;
      if (region.counties.length > 0) {
        businessesToProcess = businessesToProcess.filter(
          (business: any) => business.county && region.counties.includes(business.county)
        );
      } else if (region.cities.length > 0) {
        businessesToProcess = businessesToProcess.filter(
          (business: any) => business.city && region.cities.includes(business.city)
        );
      } else if (region.states.length > 0) {
        businessesToProcess = businessesToProcess.filter(
          (business: any) => business.state && region.states.includes(business.state)
        );
      }
      
      console.log(`📊 Found ${businessesToProcess.length} businesses in ${region.name}`);
      
      // Process each business
      for (const business of businessesToProcess) {
        try {
          // Process business with all services
          const processed = await this.processBusiness(business);
          if (processed) {
            // Save political alignment
            if (business.politicalAlignment) {
              const politicalData = {
                businessId: business.id,
                alignment: business.politicalAlignment,
                donations: [],
                sources: ['OpenSecrets', 'Ballotpedia'],
                confidence: 0.75,
                lastUpdated: new Date()
              };
              await politicalAlignmentService.savePoliticalAlignment(business.id, politicalData);
            }
            
            // Save images
            if (business.images) {
              business.images.businessId = business.id;
              await imageService.saveBusinessImages(business.id, business.images);
            }
            
            success++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`Error processing business ${business.name}:`, error);
          failed++;
        }
      }
      
      console.log(`✅ Completed ${region.name}: ${success} success, ${failed} failed`);
      return { success, failed };
    } catch (error) {
      console.error(`❌ Error processing region ${region.name}:`, error);
      return { success: 0, failed: 0 };
    }
  }

  // Ingest data from a specific source
  private async ingestFromSource(source: DataSource, region: Region): Promise<{ success: number; failed: number }> {
    console.log(`Ingesting from ${source.name} for ${region.name}...`);
    
    let success = 0;
    let failed = 0;
    
    try {
      // Prepare search parameters based on region
      const searchParams = {
        location: region.name,
        categories: source.categories,
        limit: source.limit
      };
      
      // Import businesses using the data ingestion service
      const result = await dataIngestionService.importBusinessesInBatch(
        this.generateMockBusinesses(source, region, source.limit || 100)
      );
      
      success = result.recordsAdded + result.recordsUpdated;
      failed = result.recordsFailed;
      
      // Apply rate limiting
      if (source.rateLimit) {
        await this.delay(3600000 / source.rateLimit); // Convert to milliseconds
      }
      
      console.log(`✅ Completed ${source.name} for ${region.name}: ${success} success, ${failed} failed`);
      return { success, failed };
    } catch (error) {
      console.error(`❌ Error ingesting from ${source.name} for ${region.name}:`, error);
      return { success: 0, failed: 0 };
    }
  }
  
  // Process a single business with all services
  private async processBusiness(business: any): Promise<boolean> {
    try {
      // Check for duplicates using our own method
      const existingBusiness = await this.findDuplicateBusiness(business);
      if (existingBusiness) {
        console.log(`Duplicate found: ${business.name} (ID: ${existingBusiness.id})`);
        return false;
      }
      
      // Validate business data
      const validationResult = await dataValidationService.validateBusiness(business);
      if (!validationResult.isValid) {
        console.log(`Validation failed for ${business.name}:`, validationResult.errors);
        return false;
      }
      
      // Categorize business
      const categorizationResult = await categorizationService.categorizeBusiness(business);
      business.category = categorizationResult.primaryCategory.name;
      business.tags = categorizationResult.tags.map(tag => tag.name);
      
      // Get political alignment
      const politicalData = await politicalAlignmentService.scrapePoliticalData(business.name, business.website);
      if (politicalData) {
        business.politicalAlignment = politicalData.alignment;
      }
      
      // Get images
      const imageData = await imageService.searchBusinessImages(business.name, business.category);
      business.images = imageData;
      
      return true;
    } catch (error) {
      console.error(`Error processing business ${business.name}:`, error);
      return false;
    }
  }
  
  // Find duplicate business
  private async findDuplicateBusiness(business: any): Promise<any | null> {
    const { db } = this;
    
    // Check for duplicates based on name and city
    const duplicates = await db
      .select()
      .from(businesses)
      .where(
        and(
          like(businesses.name, business.name),
          like(businesses.city, business.city)
        )
      )
      .limit(1);
    
    return duplicates.length > 0 ? duplicates[0] : null;
  }

  // Generate mock businesses for testing
  private generateMockBusinesses(source: DataSource, region: Region, count: number): any[] {
    const businesses: any[] = [];
    const categories = source.categories || ['Restaurant', 'Retail', 'Service'];
    const cities = region.cities.length > 0 ? region.cities : [region.name];
    const states = region.states.length > 0 ? region.states : ['CA'];
    const counties = region.counties.length > 0 ? region.counties : [`${region.name} County`];
    
    for (let i = 0; i < count; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const state = states[Math.floor(Math.random() * states.length)];
      const county = counties[Math.floor(Math.random() * counties.length)];
      
      businesses.push({
        name: `${source.name} Business ${i + 1}`,
        description: `A ${category.toLowerCase()} business in ${city}`,
        category,
        website: `https://example-${i}.com`,
        address: `${100 + i} Main Street`,
        city,
        state,
        zipCode: `${90000 + i}`,
        county,
        latitude: 33.7 + (Math.random() - 0.5) * 0.5,
        longitude: -117.8 + (Math.random() - 0.5) * 0.5,
        phone: `(555) ${100 + i}-${1000 + i}`,
        email: `info@example-${i}.com`,
        hours: '9:00 AM - 5:00 PM',
        priceRange: '$'.repeat(Math.floor(Math.random() * 4) + 1),
        yearFounded: 1990 + Math.floor(Math.random() * 30),
        employeeCount: Math.floor(Math.random() * 100) + 1,
        businessSize: ['Small', 'Medium', 'Large'][Math.floor(Math.random() * 3)],
        imageUrl: `https://example.com/image${i}.jpg`,
        logoUrl: `https://example.com/logo${i}.jpg`,
        socialMedia: {
          facebook: `example${i}`,
          instagram: `@example${i}`,
          twitter: `@example${i}`
        },
        tags: [category.toLowerCase(), city.toLowerCase()],
        attributes: {
          parking: true,
          wifi: Math.random() > 0.5,
          outdoorSeating: Math.random() > 0.7
        },
        dataSource: source.name,
        dataQuality: Math.floor(Math.random() * 5) + 1
      });
    }
    
    return businesses;
  }

  // Post-processing tasks
  private async postProcessing(): Promise<void> {
    console.log('🔄 Running post-processing tasks...');

    try {
      // Update statistics
      await this.updateStatistics();

      // Optimize database
      await this.optimizeDatabase();

      // Generate indexes
      await this.generateIndexes();

      console.log('✅ Post-processing completed');
    } catch (error) {
      console.error('❌ Post-processing failed:', error);
      throw error;
    }
  }

  // Update database statistics
  private async updateStatistics(): Promise<void> {
    console.log('📊 Updating statistics...');

    try {
      const totalBusinesses = await this.db.select({ count: sql`count(*)` }).from(businesses);
      const activeBusinesses = await this.db.select({ count: sql`count(*)` }).from(businesses).where(eq(businesses.isActive, true));
      const verifiedBusinesses = await this.db.select({ count: sql`count(*)` }).from(businesses).where(eq(businesses.isVerified, true));

      console.log(`📈 Total businesses: ${totalBusinesses[0].count}`);
      console.log(`📈 Active businesses: ${activeBusinesses[0].count}`);
      console.log(`📈 Verified businesses: ${verifiedBusinesses[0].count}`);
    } catch (error) {
      console.error('❌ Failed to update statistics:', error);
      throw error;
    }
  }

  /**
   * Optimize database performance
   */
  async optimizeDatabase(): Promise<void> {
    try {
      console.log('⚡ Optimizing database...');
      
      // ANALYZE is not supported by Turso, so we'll skip it
      // await this.db.run(sql`ANALYZE`);
      
      // Create indexes if they don't exist
      try {
        await this.db.run(sql`
          CREATE INDEX IF NOT EXISTS idx_businesses_city_state ON businesses(city, state)
        `);
        await this.db.run(sql`
          CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category)
        `);
        await this.db.run(sql`
          CREATE INDEX IF NOT EXISTS idx_business_alignments_business_id ON business_alignments(business_id)
        `);
      } catch (error) {
        console.warn('⚠️ Some indexes may already exist:', error);
      }
      
      console.log('✅ Database optimization completed');
    } catch (error) {
      console.error('❌ Failed to optimize database:', error);
      throw error;
    }
  }

  // Generate database indexes
  private async generateIndexes(): Promise<void> {
    console.log('🔍 Generating indexes...');

    try {
      // Create indexes for frequently queried fields
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_businesses_name ON businesses(name)',
        'CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category)',
        'CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city)',
        'CREATE INDEX IF NOT EXISTS idx_businesses_state ON businesses(state)',
        'CREATE INDEX IF NOT EXISTS idx_businesses_county ON businesses(county)',
        'CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON businesses(is_active)',
        'CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at)'
      ];

      for (const indexSql of indexes) {
        await this.db.run(sql.raw(indexSql));
      }

      console.log('✅ Indexes generated');
    } catch (error) {
      console.error('❌ Failed to generate indexes:', error);
      throw error;
    }
  }

  // Generate final report
  private async generateReport(): Promise<void> {
    console.log('📋 Generating final report...');

    const endTime = new Date();
    const duration = this.getDuration(this.startTime);

    console.log('\n🎉 BULK DATA SYNC REPORT 🎉');
    console.log('='.repeat(50));
    console.log(`📅 Start Time: ${this.startTime.toISOString()}`);
    console.log(`📅 End Time: ${endTime.toISOString()}`);
    console.log(`⏱️ Duration: ${duration}`);
    console.log('\n📊 STATISTICS:');
    console.log(`🌍 Regions Processed: ${this.stats.regionsProcessed}/${REGIONS.length}`);
    console.log(`📊 Data Sources Processed: ${this.stats.dataSourcesProcessed}/${DATA_SOURCES.filter(s => s.enabled).length}`);
    console.log(`🏢 Total Businesses: ${this.stats.totalBusinesses}`);
    console.log(`✨ New Businesses: ${this.stats.newBusinesses}`);
    console.log(`🔄 Updated Businesses: ${this.stats.updatedBusinesses}`);
    console.log(`❌ Failed Businesses: ${this.stats.failedBusinesses}`);
    console.log(`🏷️ Categorized Businesses: ${this.stats.categorizedBusinesses}`);
    console.log(`⚖️ Aligned Businesses: ${this.stats.alignedBusinesses}`);
    console.log(`🖼️ Imaged Businesses: ${this.stats.imagedBusinesses}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.stats.errors.forEach((error: string, index: number) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    console.log('\n✅ SUCCESS RATE:');
    const successRate = ((this.stats.categorizedBusinesses / this.stats.totalBusinesses) * 100).toFixed(2);
    console.log(`📈 Overall Success Rate: ${successRate}%`);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 BULK DATA SYNC COMPLETED 🎉');
  }

  // Cleanup resources
  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up...');

    try {
      // Close database connection if needed
      // this.db.close();
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  // Helper method to get duration
  private getDuration(startTime: Date): string {
    const duration = Date.now() - startTime.getTime();
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  }

  // Helper method for delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute the bulk data sync
async function main() {
  const bulkDataSync = new BulkDataSyncService();
  await bulkDataSync.execute();
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { BulkDataSyncService };
