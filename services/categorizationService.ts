import { getDB } from '../db/connection';
import { businesses, businessCategories, businessTags, businessTagRelations } from '../db/schema';
import { eq, and, or, ilike, desc, sql, inArray } from 'drizzle-orm';

// Types for categorization
interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  businessCount?: number;
}

interface Tag {
  id: number;
  name: string;
  description?: string;
  category?: string;
  isActive: boolean;
  businessCount?: number;
}

interface BusinessCategory {
  businessId: number;
  categoryId: number;
  isPrimary: boolean;
  confidence: number;
}

interface BusinessTag {
  businessId: number;
  tagId: number;
  relevance: number;
  source: 'auto' | 'user' | 'admin';
}

interface Attribute {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description?: string;
}

interface CategorizationResult {
  businessId: number;
  primaryCategory: Category;
  secondaryCategories: Category[];
  tags: Tag[];
  attributes: Attribute[];
  confidence: number;
}

// Predefined business categories
const PREDEFINED_CATEGORIES: Omit<Category, 'id' | 'businessCount'>[] = [
  {
    name: 'Food & Dining',
    description: 'Restaurants, cafes, bars, and food services',
    icon: 'restaurant',
    color: '#FF6B6B',
    isActive: true
  },
  {
    name: 'Retail',
    description: 'Shopping stores, malls, and retail services',
    icon: 'storefront',
    color: '#4ECDC4',
    isActive: true
  },
  {
    name: 'Healthcare',
    description: 'Hospitals, clinics, pharmacies, and medical services',
    icon: 'medical',
    color: '#45B7D1',
    isActive: true
  },
  {
    name: 'Professional Services',
    description: 'Legal, financial, consulting, and business services',
    icon: 'briefcase',
    color: '#96CEB4',
    isActive: true
  },
  {
    name: 'Entertainment',
    description: 'Movies, theaters, music venues, and entertainment services',
    icon: 'musical-notes',
    color: '#FECA57',
    isActive: true
  },
  {
    name: 'Education',
    description: 'Schools, universities, training centers, and educational services',
    icon: 'school',
    color: '#FF9FF3',
    isActive: true
  },
  {
    name: 'Travel & Tourism',
    description: 'Hotels, travel agencies, tourist attractions, and transportation',
    icon: 'airplane',
    color: '#54A0FF',
    isActive: true
  },
  {
    name: 'Automotive',
    description: 'Car dealerships, repair shops, and automotive services',
    icon: 'car',
    color: '#48DBFB',
    isActive: true
  },
  {
    name: 'Real Estate',
    description: 'Property management, real estate agencies, and housing services',
    icon: 'home',
    color: '#1DD1A1',
    isActive: true
  },
  {
    name: 'Technology',
    description: 'Software companies, IT services, and technology providers',
    icon: 'laptop',
    color: '#5F27CD',
    isActive: true
  },
  {
    name: 'Fitness & Wellness',
    description: 'Gyms, spas, yoga studios, and wellness services',
    icon: 'fitness',
    color: '#00D2D3',
    isActive: true
  },
  {
    name: 'Beauty & Personal Care',
    description: 'Salons, barbershops, spas, and personal care services',
    icon: 'person',
    color: '#FF6B9D',
    isActive: true
  },
  {
    name: 'Home Services',
    description: 'Plumbing, electrical, cleaning, and home maintenance services',
    icon: 'construct',
    color: '#C44569',
    isActive: true
  },
  {
    name: 'Financial Services',
    description: 'Banks, credit unions, investment services, and financial planning',
    icon: 'card',
    color: '#F8B500',
    isActive: true
  },
  {
    name: 'Government & Public Services',
    description: 'Government offices, public services, and municipal services',
    icon: 'business',
    color: '#6C5CE7',
    isActive: true
  },
  {
    name: 'Non-profit & Organizations',
    description: 'Charities, non-profits, and community organizations',
    icon: 'heart',
    color: '#A29BFE',
    isActive: true
  },
  {
    name: 'Manufacturing & Industrial',
    description: 'Factories, warehouses, and industrial services',
    icon: 'hammer',
    color: '#636E72',
    isActive: true
  },
  {
    name: 'Agriculture',
    description: 'Farms, agricultural services, and food production',
    icon: 'leaf',
    color: '#00B894',
    isActive: true
  },
  {
    name: 'Media & Publishing',
    description: 'Newspapers, magazines, broadcasting, and media services',
    icon: 'newspaper',
    color: '#E17055',
    isActive: true
  },
  {
    name: 'Legal Services',
    description: 'Law firms, legal consulting, and legal services',
    icon: 'document-text',
    color: '#2D3436',
    isActive: true
  }
];

// Predefined tags
const PREDEFINED_TAGS: Omit<Tag, 'id' | 'businessCount'>[] = [
  // General tags
  { name: 'family-friendly', description: 'Suitable for families with children', category: 'general', isActive: true },
  { name: 'pet-friendly', description: 'Allows pets on premises', category: 'general', isActive: true },
  { name: 'wheelchair-accessible', description: 'Accessible for wheelchair users', category: 'general', isActive: true },
  { name: 'outdoor-seating', description: 'Has outdoor seating available', category: 'general', isActive: true },
  { name: 'wifi', description: 'Free WiFi available', category: 'general', isActive: true },
  { name: 'parking', description: 'Parking available', category: 'general', isActive: true },
  { name: 'delivery', description: 'Offers delivery service', category: 'general', isActive: true },
  { name: 'takeout', description: 'Offers takeout service', category: 'general', isActive: true },
  { name: 'reservation', description: 'Accepts reservations', category: 'general', isActive: true },
  { name: 'credit-card', description: 'Accepts credit cards', category: 'general', isActive: true },
  
  // Price range tags
  { name: 'budget-friendly', description: 'Affordable prices', category: 'price', isActive: true },
  { name: 'mid-range', description: 'Moderate prices', category: 'price', isActive: true },
  { name: 'upscale', description: 'Higher-end pricing', category: 'price', isActive: true },
  { name: 'luxury', description: 'Luxury experience and pricing', category: 'price', isActive: true },
  
  // Hours tags
  { name: '24-hours', description: 'Open 24 hours', category: 'hours', isActive: true },
  { name: 'late-night', description: 'Open late at night', category: 'hours', isActive: true },
  { name: 'early-morning', description: 'Open early in the morning', category: 'hours', isActive: true },
  { name: 'weekends', description: 'Open on weekends', category: 'hours', isActive: true },
  
  // Service tags
  { name: 'curbside-pickup', description: 'Offers curbside pickup', category: 'service', isActive: true },
  { name: 'drive-thru', description: 'Has drive-thru service', category: 'service', isActive: true },
  { name: 'online-ordering', description: 'Accepts online orders', category: 'service', isActive: true },
  { name: 'appointment-only', description: 'Requires appointments', category: 'service', isActive: true },
  { name: 'walk-ins-welcome', description: 'Accepts walk-in customers', category: 'service', isActive: true },
  
  // Atmosphere tags
  { name: 'casual', description: 'Casual atmosphere', category: 'atmosphere', isActive: true },
  { name: 'formal', description: 'Formal atmosphere', category: 'atmosphere', isActive: true },
  { name: 'romantic', description: 'Romantic atmosphere', category: 'atmosphere', isActive: true },
  { name: 'trendy', description: 'Trendy and modern atmosphere', category: 'atmosphere', isActive: true },
  { name: 'historic', description: 'Historic location or building', category: 'atmosphere', isActive: true },
  
  // Special features
  { name: 'outdoor-activities', description: 'Offers outdoor activities', category: 'features', isActive: true },
  { name: 'live-music', description: 'Features live music', category: 'features', isActive: true },
  { name: 'happy-hour', description: 'Offers happy hour specials', category: 'features', isActive: true },
  { name: 'kids-menu', description: 'Has kids menu', category: 'features', isActive: true },
  { name: 'vegan-options', description: 'Offers vegan options', category: 'features', isActive: true },
  { name: 'gluten-free', description: 'Offers gluten-free options', category: 'features', isActive: true },
  { name: 'organic', description: 'Uses organic ingredients/products', category: 'features', isActive: true },
  { name: 'local', description: 'Locally owned or uses local products', category: 'features', isActive: true },
  { name: 'sustainable', description: 'Environmentally sustainable practices', category: 'features', isActive: true },
  { name: 'award-winning', description: 'Has received awards or recognition', category: 'features', isActive: true }
];

class CategorizationService {
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

  // Initialize categories and tags
  async initializeCategoriesAndTags(): Promise<boolean> {
    if (!this.db) {
      console.error('Database connection not available');
      return false;
    }

    try {
      console.log('Starting to initialize categories and tags...');
      
      // Insert predefined categories
      console.log(`Inserting ${PREDEFINED_CATEGORIES.length} predefined categories...`);
      for (const categoryData of PREDEFINED_CATEGORIES) {
        try {
          await this.db.insert(businessCategories).values(categoryData).onConflictDoNothing();
        } catch (error) {
          console.error(`Error inserting category ${categoryData.name}:`, error);
        }
      }
      console.log('Categories inserted successfully');

      // Insert predefined tags
      console.log(`Inserting ${PREDEFINED_TAGS.length} predefined tags...`);
      for (const tagData of PREDEFINED_TAGS) {
        try {
          await this.db.insert(businessTags).values(tagData).onConflictDoNothing();
        } catch (error) {
          console.error(`Error inserting tag ${tagData.name}:`, error);
        }
      }
      console.log('Tags inserted successfully');

      console.log('Categories and tags initialization completed');
      return true;
    } catch (error) {
      console.error('Error initializing categories and tags:', error);
      return false;
    }
  }

  // Categorize a business based on its data
  async categorizeBusiness(business: any): Promise<CategorizationResult> {
    try {
      const cacheKey = `categorize_${business.id}`;
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      // Get all categories
      const categories = await this.db.select().from(businessCategories).where(eq(businessCategories.isActive, true));
      
      // Get all tags
      const tags = await this.db.select().from(businessTags).where(eq(businessTags.isActive, true));

      // Analyze business data for categorization
      const analysis = this.analyzeBusinessForCategorization(business, categories, tags);

      const result: CategorizationResult = {
        businessId: business.id,
        primaryCategory: analysis.primaryCategory,
        secondaryCategories: analysis.secondaryCategories,
        tags: analysis.tags,
        attributes: analysis.attributes,
        confidence: analysis.confidence
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error categorizing business:', error);
      return {
        businessId: business.id,
        primaryCategory: { id: 0, name: 'Uncategorized', isActive: true },
        secondaryCategories: [],
        tags: [],
        attributes: [],
        confidence: 0
      };
    }
  }

  // Analyze business data for categorization
  private analyzeBusinessForCategorization(business: any, categories: any[], tags: any[]): any {
    const businessText = `${business.name} ${business.description || ''} ${business.category || ''}`.toLowerCase();
    
    // Score categories based on relevance
    const categoryScores = categories.map(category => {
      let score = 0;
      const categoryText = `${category.name} ${category.description || ''}`.toLowerCase();
      
      // Check for direct category match
      if (business.category && business.category.toLowerCase() === category.name.toLowerCase()) {
        score += 100;
      }
      
      // Check for keyword matches
      const keywords = this.extractKeywords(categoryText);
      keywords.forEach(keyword => {
        if (businessText.includes(keyword)) {
          score += 10;
        }
      });
      
      // Check for partial matches
      if (businessText.includes(category.name.toLowerCase())) {
        score += 50;
      }
      
      return { category, score };
    });

    // Sort by score and select primary and secondary categories
    categoryScores.sort((a, b) => b.score - a.score);
    
    const primaryCategory = categoryScores[0]?.score > 0 ? categoryScores[0].category : { id: 0, name: 'Uncategorized', isActive: true };
    const secondaryCategories = categoryScores
      .filter(item => item.score > 20 && item.category.id !== primaryCategory.id)
      .slice(0, 3)
      .map(item => item.category);

    // Score tags based on relevance
    const tagScores = tags.map(tag => {
      let score = 0;
      const tagText = `${tag.name} ${tag.description || ''}`.toLowerCase();
      
      // Check for keyword matches
      const keywords = this.extractKeywords(tagText);
      keywords.forEach(keyword => {
        if (businessText.includes(keyword)) {
          score += 5;
        }
      });
      
      return { tag, score };
    });

    // Select relevant tags
    const relevantTags = tagScores
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.tag);

    // Extract attributes
    const attributes = this.extractAttributes(business);

    // Calculate overall confidence
    const maxCategoryScore = Math.max(...categoryScores.map(item => item.score));
    const confidence = Math.min(100, maxCategoryScore);

    return {
      primaryCategory,
      secondaryCategories,
      tags: relevantTags,
      attributes,
      confidence
    };
  }

  // Extract keywords from text
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const keywords: string[] = [];
    
    words.forEach(word => {
      // Remove common suffixes and prefixes
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3) {
        keywords.push(cleanWord);
      }
    });
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  // Extract attributes from business data
  private extractAttributes(business: any): Attribute[] {
    const attributes: Attribute[] = [];
    
    // Price range attribute
    if (business.priceRange) {
      attributes.push({
        key: 'price_range',
        value: business.priceRange,
        type: 'string',
        description: 'Price range of the business'
      });
    }
    
    // Hours attribute
    if (business.hours) {
      attributes.push({
        key: 'hours',
        value: business.hours,
        type: 'string',
        description: 'Business hours'
      });
    }
    
    // Phone attribute
    if (business.phone) {
      attributes.push({
        key: 'phone',
        value: business.phone,
        type: 'string',
        description: 'Business phone number'
      });
    }
    
    // Website attribute
    if (business.website) {
      attributes.push({
        key: 'website',
        value: business.website,
        type: 'string',
        description: 'Business website'
      });
    }
    
    // Email attribute
    if (business.email) {
      attributes.push({
        key: 'email',
        value: business.email,
        type: 'string',
        description: 'Business email'
      });
    }
    
    // Location attributes
    if (business.city) {
      attributes.push({
        key: 'city',
        value: business.city,
        type: 'string',
        description: 'Business city'
      });
    }
    
    if (business.state) {
      attributes.push({
        key: 'state',
        value: business.state,
        type: 'string',
        description: 'Business state'
      });
    }
    
    if (business.zipCode) {
      attributes.push({
        key: 'zip_code',
        value: business.zipCode,
        type: 'string',
        description: 'Business zip code'
      });
    }
    
    // Rating attribute
    if (business.rating) {
      attributes.push({
        key: 'rating',
        value: business.rating.toString(),
        type: 'number',
        description: 'Business rating'
      });
    }
    
    return attributes;
  }

  // Save business categorization to database
  async saveBusinessCategorization(businessId: number, categorization: CategorizationResult): Promise<boolean> {
    if (!this.db) return false;

    try {
      // Update business category field with primary category
      await this.db
        .update(businesses)
        .set({ 
          category: categorization.primaryCategory.name,
          updatedAt: new Date()
        })
        .where(eq(businesses.id, businessId));

      // Save tags
      for (const tag of categorization.tags) {
        await this.db.insert(businessTagRelations).values({
          businessId,
          tagId: tag.id
        }).onConflictDoNothing();
      }

      // Save attributes as JSON in the business record
      if (categorization.attributes.length > 0) {
        const attributesJson = JSON.stringify(categorization.attributes);
        await this.db
          .update(businesses)
          .set({ 
            attributes: attributesJson,
            updatedAt: new Date()
          })
          .where(eq(businesses.id, businessId));
      }

      return true;
    } catch (error) {
      console.error('Error saving business categorization:', error);
      return false;
    }
  }

  // Get business categories
  async getBusinessCategories(businessId: number): Promise<{ primary?: Category; secondary: Category[] }> {
    if (!this.db) return { secondary: [] };

    try {
      // Get business record to extract category
      const business = await this.db
        .select()
        .from(businesses)
        .where(eq(businesses.id, businessId))
        .limit(1);

      if (business.length === 0) return { secondary: [] };

      // Get all categories
      const allCategories = await this.db.select().from(businessCategories).where(eq(businessCategories.isActive, true));
      
      // Find primary category
      const primaryCategory = allCategories.find((cat: any) => cat.name === business[0].category);
      
      // For now, return empty secondary categories since we don't have a junction table
      return {
        primary: primaryCategory ? {
          id: primaryCategory.id,
          name: primaryCategory.name,
          description: primaryCategory.description,
          icon: primaryCategory.icon,
          color: primaryCategory.color,
          isActive: true
        } : undefined,
        secondary: []
      };
    } catch (error) {
      console.error('Error getting business categories:', error);
      return { secondary: [] };
    }
  }

  // Get business tags
  async getBusinessTags(businessId: number): Promise<Tag[]> {
    if (!this.db) return [];

    try {
      const result = await this.db
        .select({
          tagId: businessTags.id,
          tagName: businessTags.name,
          tagDescription: businessTags.description,
          tagCategory: businessTags.category
        })
        .from(businessTagRelations)
        .innerJoin(businessTags, eq(businessTagRelations.tagId, businessTags.id))
        .where(eq(businessTagRelations.businessId, businessId));

      return result.map((item: any) => ({
        id: item.tagId,
        name: item.tagName,
        description: item.tagDescription,
        category: item.tagCategory,
        isActive: true
      }));
    } catch (error) {
      console.error('Error getting business tags:', error);
      return [];
    }
  }

  // Get business attributes
  async getBusinessAttributes(businessId: number): Promise<Attribute[]> {
    if (!this.db) return [];

    try {
      const result = await this.db
        .select({ attributes: businesses.attributes })
        .from(businesses)
        .where(eq(businesses.id, businessId))
        .limit(1);

      if (result.length === 0 || !result[0].attributes) return [];

      try {
        return JSON.parse(result[0].attributes);
      } catch {
        return [];
      }
    } catch (error) {
      console.error('Error getting business attributes:', error);
      return [];
    }
  }

  // Search businesses by category
  async searchByCategory(categoryName: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    if (!this.db) return [];

    try {
      const result = await this.db
        .select()
        .from(businesses)
        .where(and(
          eq(businesses.category, categoryName),
          eq(businesses.isActive, true)
        ))
        .limit(limit)
        .offset(offset);

      return result;
    } catch (error) {
      console.error('Error searching by category:', error);
      return [];
    }
  }

  // Search businesses by tags
  async searchByTags(tagNames: string[], limit: number = 20, offset: number = 0): Promise<any[]> {
    if (!this.db) return [];

    try {
      // Get tag IDs from tag names
      const tags = await this.db
        .select({ id: businessTags.id, name: businessTags.name })
        .from(businessTags)
        .where(inArray(businessTags.name, tagNames));

      const tagIds = tags.map((tag: any) => tag.id);

      if (tagIds.length === 0) return [];

      const result = await this.db
        .select({
          businessId: businesses.id,
          businessName: businesses.name,
          businessDescription: businesses.description,
          businessCategory: businesses.category,
          businessAddress: businesses.address,
          businessCity: businesses.city,
          businessState: businesses.state,
          businessLatitude: businesses.latitude,
          businessLongitude: businesses.longitude,
          businessWebsite: businesses.website,
          businessPhone: businesses.phone,
          businessImageUrl: businesses.imageUrl
        })
        .from(businessTagRelations)
        .innerJoin(businesses, eq(businessTagRelations.businessId, businesses.id))
        .where(and(
          inArray(businessTagRelations.tagId, tagIds),
          eq(businesses.isActive, true)
        ))
        .groupBy(businesses.id)
        .limit(limit)
        .offset(offset);

      return result;
    } catch (error) {
      console.error('Error searching by tags:', error);
      return [];
    }
  }

  // Get all categories with business counts
  async getAllCategories(): Promise<Category[]> {
    if (!this.db) return [];

    try {
      const cacheKey = 'all_categories';
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      // Get all categories
      const categories = await this.db.select().from(businessCategories).where(eq(businessCategories.isActive, true));
      
      // Count businesses for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category: any) => {
          const countResult = await this.db
            .select({ count: sql`count(*)` })
            .from(businesses)
            .where(and(
              eq(businesses.category, category.name),
              eq(businesses.isActive, true)
            ));
          
          return {
            ...category,
            businessCount: countResult[0].count
          };
        })
      );

      // Sort by business count
      categoriesWithCounts.sort((a, b) => (b.businessCount || 0) - (a.businessCount || 0));

      this.setCache(cacheKey, categoriesWithCounts);
      return categoriesWithCounts;
    } catch (error) {
      console.error('Error getting all categories:', error);
      return [];
    }
  }

  // Get all tags with business counts
  async getAllTags(): Promise<Tag[]> {
    if (!this.db) return [];

    try {
      const cacheKey = 'all_tags';
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const result = await this.db
        .select({
          id: businessTags.id,
          name: businessTags.name,
          description: businessTags.description,
          category: businessTags.category,
          isActive: businessTags.isActive,
          businessCount: sql`count(DISTINCT ${businessTagRelations.businessId})`.as('business_count')
        })
        .from(businessTags)
        .leftJoin(businessTagRelations, eq(businessTags.id, businessTagRelations.tagId))
        .where(eq(businessTags.isActive, true))
        .groupBy(businessTags.id)
        .orderBy(desc(sql`count(DISTINCT ${businessTagRelations.businessId})`));

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error getting all tags:', error);
      return [];
    }
  }

  // Categorize all businesses
  async categorizeAllBusinesses(): Promise<{ success: number; failed: number }> {
    if (!this.db) return { success: 0, failed: 0 };

    try {
      const allBusinesses = await this.db.select().from(businesses).where(eq(businesses.isActive, true));
      let success = 0;
      let failed = 0;

      for (const business of allBusinesses) {
        try {
          const categorization = await this.categorizeBusiness(business);
          const saved = await this.saveBusinessCategorization(business.id, categorization);
          
          if (saved) {
            success++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`Error categorizing business ${business.name}:`, error);
          failed++;
        }
      }

      // Clear cache
      this.cache.clear();

      return { success, failed };
    } catch (error) {
      console.error('Error categorizing all businesses:', error);
      return { success: 0, failed: 0 };
    }
  }

  // Get categorization statistics
  async getCategorizationStatistics(): Promise<any> {
    try {
      const categories = await this.getAllCategories();
      const tags = await this.getAllTags();
      
      const totalBusinesses = await this.db.select({ count: sql`count(*)` }).from(businesses).where(eq(businesses.isActive, true));
      const businessesWithCategories = await this.db
        .select({ count: sql`count(DISTINCT id)` })
        .from(businesses)
        .where(and(
          sql`category IS NOT NULL`,
          eq(businesses.isActive, true)
        ));
      const businessesWithTags = await this.db
        .select({ count: sql`count(DISTINCT businessId)` })
        .from(businessTagRelations);

      return {
        totalBusinesses: totalBusinesses[0].count,
        businessesWithCategories: businessesWithCategories[0].count,
        businessesWithTags: businessesWithTags[0].count,
        categoryCoverage: (businessesWithCategories[0].count / totalBusinesses[0].count) * 100,
        tagCoverage: (businessesWithTags[0].count / totalBusinesses[0].count) * 100,
        totalCategories: categories.length,
        totalTags: tags.length,
        topCategories: categories.slice(0, 5),
        topTags: tags.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting categorization statistics:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export the service
export const categorizationService = new CategorizationService();
export default CategorizationService;
