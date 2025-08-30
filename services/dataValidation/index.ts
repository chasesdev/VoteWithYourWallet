import { getDB } from '../db/connection';
import { businesses, businessCategories, businessTags, businessTagRelations, businessMedia, businessAlignments, donations, dataSources, syncLogs } from '../db/schema';
import { eq, and, or, ilike, desc, sql } from 'drizzle-orm';

// Types for validation results
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
}

interface BusinessValidationResult extends ValidationResult {
  businessId?: number;
  businessName: string;
  duplicateId?: number;
  similarityScore?: number;
}

interface DuplicateGroup {
  businesses: Array<{
    id: number;
    name: string;
    address?: string;
    category: string;
    similarityScore: number;
  }>;
  representativeId: number;
  confidence: number;
}

interface DataQualityReport {
  totalBusinesses: number;
  validBusinesses: number;
  invalidBusinesses: number;
  duplicateGroups: DuplicateGroup[];
  qualityScore: number;
  issues: {
    critical: string[];
    warning: string[];
    info: string[];
  };
}

class DataValidationService {
  private db: any;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.db = getDB();
  }

  // Cache helper methods
  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Calculate string similarity (Levenshtein distance based)
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.calculateEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Calculate edit distance
  private calculateEditDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j += 1) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Normalize business name for comparison
  private normalizeBusinessName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Validate a single business
  async validateBusiness(business: any): Promise<BusinessValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Required fields validation
    if (!business.name || business.name.trim().length === 0) {
      errors.push('Business name is required');
      score -= 20;
    }

    if (!business.category || business.category.trim().length === 0) {
      errors.push('Business category is required');
      score -= 15;
    }

    // Name validation
    if (business.name && business.name.length < 2) {
      errors.push('Business name must be at least 2 characters long');
      score -= 10;
    }

    if (business.name && business.name.length > 100) {
      warnings.push('Business name is very long');
      score -= 5;
    }

    // Description validation
    if (business.description && business.description.length > 500) {
      warnings.push('Description is very long');
      score -= 3;
    }

    // Website validation
    if (business.website) {
      try {
        new URL(business.website);
      } catch {
        errors.push('Invalid website URL');
        score -= 10;
      }
    }

    // Email validation
    if (business.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(business.email)) {
        errors.push('Invalid email address');
        score -= 10;
      }
    }

    // Phone validation
    if (business.phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = business.phone.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        warnings.push('Phone number format may be invalid');
        score -= 5;
      }
    }

    // Location validation
    if (business.latitude && business.longitude) {
      if (business.latitude < -90 || business.latitude > 90) {
        errors.push('Invalid latitude value');
        score -= 10;
      }
      if (business.longitude < -180 || business.longitude > 180) {
        errors.push('Invalid longitude value');
        score -= 10;
      }
    }

    // Data quality validation
    if (!business.address && !business.city) {
      warnings.push('Missing location information');
      score -= 8;
    }

    if (!business.website && !business.phone && !business.email) {
      warnings.push('No contact information provided');
      score -= 8;
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
      businessId: business.id,
      businessName: business.name
    };
  }

  // Find duplicate businesses
  async findDuplicateBusinesses(threshold: number = 0.85): Promise<DuplicateGroup[]> {
    try {
      const cacheKey = `duplicates_${threshold}`;
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      if (!this.db) return [];

      // Get all businesses
      const allBusinesses = await this.db.select().from(businesses);
      const duplicates: DuplicateGroup[] = [];
      const processed = new Set<number>();

      for (let i = 0; i < allBusinesses.length; i++) {
        const business1 = allBusinesses[i];
        
        if (processed.has(business1.id)) continue;

        const similarBusinesses: Array<{
          id: number;
          name: string;
          address?: string;
          category: string;
          similarityScore: number;
        }> = [];

        for (let j = i + 1; j < allBusinesses.length; j++) {
          const business2 = allBusinesses[j];
          
          if (processed.has(business2.id)) continue;

          // Calculate name similarity
          const nameSimilarity = this.calculateStringSimilarity(
            this.normalizeBusinessName(business1.name),
            this.normalizeBusinessName(business2.name)
          );

          // Calculate address similarity if available
          let addressSimilarity = 0;
          if (business1.address && business2.address) {
            addressSimilarity = this.calculateStringSimilarity(
              business1.address.toLowerCase(),
              business2.address.toLowerCase()
            );
          }

          // Calculate category similarity
          const categorySimilarity = business1.category === business2.category ? 1 : 0;

          // Calculate overall similarity
          const weights = { name: 0.6, address: 0.3, category: 0.1 };
          const overallSimilarity = 
            (nameSimilarity * weights.name) +
            (addressSimilarity * weights.address) +
            (categorySimilarity * weights.category);

          if (overallSimilarity >= threshold) {
            similarBusinesses.push({
              id: business2.id,
              name: business2.name,
              address: business2.address,
              category: business2.category,
              similarityScore: overallSimilarity
            });
            processed.add(business2.id);
          }
        }

        if (similarBusinesses.length > 0) {
          similarBusinesses.unshift({
            id: business1.id,
            name: business1.name,
            address: business1.address,
            category: business1.category,
            similarityScore: 1.0
          });

          duplicates.push({
            businesses: similarBusinesses,
            representativeId: business1.id,
            confidence: Math.max(...similarBusinesses.map(b => b.similarityScore))
          });

          processed.add(business1.id);
        }
      }

      this.setCache(cacheKey, duplicates);
      return duplicates;
    } catch (error) {
      console.error('Error finding duplicate businesses:', error);
      return [];
    }
  }

  // Validate all businesses and generate quality report
  async generateDataQualityReport(): Promise<DataQualityReport> {
    try {
      const cacheKey = 'quality_report';
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      if (!this.db) {
        return {
          totalBusinesses: 0,
          validBusinesses: 0,
          invalidBusinesses: 0,
          duplicateGroups: [],
          qualityScore: 0,
          issues: { critical: [], warning: [], info: [] }
        };
      }

      // Get all businesses
      const allBusinesses = await this.db.select().from(businesses);
      const duplicateGroups = await this.findDuplicateBusinesses();

      // Validate each business
      const validationResults: BusinessValidationResult[] = [];
      for (const business of allBusinesses) {
        const result = await this.validateBusiness(business);
        validationResults.push(result);
      }

      // Calculate statistics
      const validBusinesses = validationResults.filter(r => r.isValid).length;
      const invalidBusinesses = validationResults.filter(r => !r.isValid).length;
      const averageScore = validationResults.reduce((sum, r) => sum + r.score, 0) / validationResults.length;

      // Collect issues
      const issues = {
        critical: [] as string[],
        warning: [] as string[],
        info: [] as string[]
      };

      validationResults.forEach(result => {
        result.errors.forEach(error => {
          if (!issues.critical.includes(error)) {
            issues.critical.push(error);
          }
        });
        result.warnings.forEach(warning => {
          if (!issues.warning.includes(warning)) {
            issues.warning.push(warning);
          }
        });
      });

      // Add duplicate information
      if (duplicateGroups.length > 0) {
        issues.warning.push(`Found ${duplicateGroups.length} groups of duplicate businesses`);
        duplicateGroups.forEach(group => {
          issues.info.push(`Duplicate group: ${group.businesses.map(b => b.name).join(', ')}`);
        });
      }

      const report: DataQualityReport = {
        totalBusinesses: allBusinesses.length,
        validBusinesses,
        invalidBusinesses,
        duplicateGroups,
        qualityScore: Math.round(averageScore),
        issues
      };

      this.setCache(cacheKey, report);
      return report;
    } catch (error) {
      console.error('Error generating data quality report:', error);
      return {
        totalBusinesses: 0,
        validBusinesses: 0,
        invalidBusinesses: 0,
        duplicateGroups: [],
        qualityScore: 0,
        issues: { critical: [error instanceof Error ? error.message : 'Unknown error'], warning: [], info: [] }
      };
    }
  }

  // Merge duplicate businesses
  async mergeDuplicateBusinesses(duplicateGroupId: number, keepBusinessId: number): Promise<boolean> {
    try {
      if (!this.db) return false;

      // Get duplicate businesses
      const duplicates = await this.findDuplicateBusinesses();
      const duplicateGroup = duplicates.find(g => g.businesses.some(b => b.id === duplicateGroupId));
      
      if (!duplicateGroup) return false;

      const businessesToMerge = duplicateGroup.businesses.filter(b => b.id !== keepBusinessId);
      
      // Merge data for each business
      for (const businessToMerge of businessesToMerge) {
        // Move related data to the kept business
        await this.mergeBusinessData(businessToMerge.id, keepBusinessId);
        
        // Delete the duplicate business
        await this.db.delete(businesses).where(eq(businesses.id, businessToMerge.id));
      }

      // Clear cache
      this.cache.clear();

      return true;
    } catch (error) {
      console.error('Error merging duplicate businesses:', error);
      return false;
    }
  }

  // Merge data from one business to another
  private async mergeBusinessData(fromBusinessId: number, toBusinessId: number): Promise<void> {
    if (!this.db) return;

    try {
      // Move business media
      await this.db
        .update(businessMedia)
        .set({ businessId: toBusinessId })
        .where(eq(businessMedia.businessId, fromBusinessId));

      // Move business alignments
      await this.db
        .update(businessAlignments)
        .set({ businessId: toBusinessId })
        .where(eq(businessAlignments.businessId, fromBusinessId));

      // Move donations
      await this.db
        .update(donations)
        .set({ businessId: toBusinessId })
        .where(eq(donations.businessId, fromBusinessId));

      // Move tag relations
      await this.db
        .update(businessTagRelations)
        .set({ businessId: toBusinessId })
        .where(eq(businessTagRelations.businessId, fromBusinessId));
    } catch (error) {
      console.error('Error merging business data:', error);
    }
  }

  // Clean and standardize business data
  async cleanBusinessData(businessId: number): Promise<boolean> {
    try {
      if (!this.db) return false;

      // Get business data
      const business = await this.db
        .select()
        .from(businesses)
        .where(eq(businesses.id, businessId))
        .limit(1);

      if (business.length === 0) return false;

      const updates: any = {};

      // Clean and standardize name
      if (business[0].name) {
        updates.name = business[0].name
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s\-\&\']/g, '');
      }

      // Clean and standardize address
      if (business[0].address) {
        updates.address = business[0].address
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s\-\.\,\#]/g, '');
      }

      // Clean and standardize website
      if (business[0].website) {
        let website = business[0].website.trim();
        if (!website.startsWith('http://') && !website.startsWith('https://')) {
          website = 'https://' + website;
        }
        updates.website = website;
      }

      // Clean and standardize phone
      if (business[0].phone) {
        updates.phone = business[0].phone.replace(/[^\d\+\-\(\)\s]/g, '');
      }

      // Clean and standardize email
      if (business[0].email) {
        updates.email = business[0].email.trim().toLowerCase();
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        await this.db
          .update(businesses)
          .set(updates)
          .where(eq(businesses.id, businessId));
      }

      return true;
    } catch (error) {
      console.error('Error cleaning business data:', error);
      return false;
    }
  }

  // Clean all business data
  async cleanAllBusinessData(): Promise<{ success: number; failed: number }> {
    try {
      if (!this.db) return { success: 0, failed: 0 };

      const allBusinesses = await this.db.select().from(businesses);
      let success = 0;
      let failed = 0;

      for (const business of allBusinesses) {
        const result = await this.cleanBusinessData(business.id);
        if (result) {
          success++;
        } else {
          failed++;
        }
      }

      // Clear cache
      this.cache.clear();

      return { success, failed };
    } catch (error) {
      console.error('Error cleaning all business data:', error);
      return { success: 0, failed: 0 };
    }
  }

  // Get validation statistics
  async getValidationStatistics(): Promise<any> {
    try {
      const report = await this.generateDataQualityReport();
      const duplicates = await this.findDuplicateBusinesses();

      return {
        totalBusinesses: report.totalBusinesses,
        validBusinesses: report.validBusinesses,
        invalidBusinesses: report.invalidBusinesses,
        duplicateGroups: duplicates.length,
        duplicateBusinesses: duplicates.reduce((sum, group) => sum + group.businesses.length, 0),
        qualityScore: report.qualityScore,
        criticalIssues: report.issues.critical.length,
        warnings: report.issues.warning.length,
        info: report.issues.info.length
      };
    } catch (error) {
      console.error('Error getting validation statistics:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export the service
export const dataValidationService = new DataValidationService();
export default DataValidationService;