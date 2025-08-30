import { getDB } from '../db/connection';
import { businesses, businessAlignments, donations, users, userAlignments, userBusinessAlignments } from '../db/schema';
import { eq, and, or, ilike, desc, sql } from 'drizzle-orm';

// Types for political alignment data
interface PoliticalAlignment {
  liberal: number;
  conservative: number;
  libertarian: number;
  green: number;
  centrist: number;
}

interface DonationData {
  organization: string;
  amount: number;
  politicalLean: string;
  year: number;
  sourceUrl?: string;
}

interface BusinessPoliticalData {
  businessId: number;
  alignment: PoliticalAlignment;
  donations: DonationData[];
  sources: string[];
  confidence: number;
  lastUpdated: Date;
}

interface AlignmentSource {
  name: string;
  url: string;
  reliability: number;
  type: 'news' | 'database' | 'official' | 'social';
}

// Political alignment sources
const ALIGNMENT_SOURCES: AlignmentSource[] = [
  {
    name: 'OpenSecrets',
    url: 'https://www.opensecrets.org',
    reliability: 0.9,
    type: 'database'
  },
  {
    name: 'Ballotpedia',
    url: 'https://ballotpedia.org',
    reliability: 0.85,
    type: 'database'
  },
  {
    name: 'FollowTheMoney',
    url: 'https://www.followthemoney.org',
    reliability: 0.8,
    type: 'database'
  },
  {
    name: 'FactCheck.org',
    url: 'https://www.factcheck.org',
    reliability: 0.9,
    type: 'news'
  },
  {
    name: 'PolitiFact',
    url: 'https://www.politifact.com',
    reliability: 0.85,
    type: 'news'
  }
];

// Known political leanings for major organizations
const KNOWN_POLITICAL_LEANS: Record<string, string> = {
  'Democratic Party': 'liberal',
  'Republican Party': 'conservative',
  'Libertarian Party': 'libertarian',
  'Green Party': 'green',
  'NRA': 'conservative',
  'Planned Parenthood': 'liberal',
  'ACLU': 'liberal',
  'Heritage Foundation': 'conservative',
  'Sierra Club': 'green',
  'Chamber of Commerce': 'conservative',
  'AFL-CIO': 'liberal',
  'NARAL': 'liberal',
  'National Right to Life': 'conservative',
  'Human Rights Campaign': 'liberal',
  'Focus on the Family': 'conservative',
  'MoveOn.org': 'liberal',
  'Tea Party Patriots': 'conservative',
  '350.org': 'green',
  'Reason Foundation': 'libertarian'
};

class PoliticalAlignmentService {
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

  // Calculate political alignment based on donations and public statements
  private calculateAlignment(donations: DonationData[], publicStatements: any[]): PoliticalAlignment {
    const alignment: PoliticalAlignment = {
      liberal: 0,
      conservative: 0,
      libertarian: 0,
      green: 0,
      centrist: 0
    };

    // Process donations
    donations.forEach(donation => {
      const lean = donation.politicalLean.toLowerCase();
      const weight = Math.min(donation.amount / 10000, 10); // Cap weight at 10
      
      switch (lean) {
        case 'liberal':
          alignment.liberal += weight;
          break;
        case 'conservative':
          alignment.conservative += weight;
          break;
        case 'libertarian':
          alignment.libertarian += weight;
          break;
        case 'green':
          alignment.green += weight;
          break;
        case 'centrist':
          alignment.centrist += weight;
          break;
      }
    });

    // Process public statements
    publicStatements.forEach(statement => {
      const weight = statement.confidence || 1;
      const lean = statement.lean.toLowerCase();
      
      switch (lean) {
        case 'liberal':
          alignment.liberal += weight * 2;
          break;
        case 'conservative':
          alignment.conservative += weight * 2;
          break;
        case 'libertarian':
          alignment.libertarian += weight * 2;
          break;
        case 'green':
          alignment.green += weight * 2;
          break;
        case 'centrist':
          alignment.centrist += weight * 2;
          break;
      }
    });

    // Normalize to 0-10 scale
    const total = Object.values(alignment).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      Object.keys(alignment).forEach(key => {
        alignment[key as keyof PoliticalAlignment] = Math.min(10, (alignment[key as keyof PoliticalAlignment] / total) * 20);
      });
    }

    return alignment;
  }

  // Get political lean from organization name
  private getPoliticalLean(organization: string): string {
    const orgName = organization.toLowerCase();
    
    // Check known organizations
    for (const [org, lean] of Object.entries(KNOWN_POLITICAL_LEANS)) {
      if (orgName.includes(org.toLowerCase())) {
        return lean;
      }
    }
    
    // Keyword-based detection
    const liberalKeywords = ['democratic', 'progressive', 'liberal', 'left', 'labor', 'union', 'civil rights'];
    const conservativeKeywords = ['republican', 'conservative', 'right', 'freedom', 'heritage', 'family'];
    const libertarianKeywords = ['libertarian', 'freedom', 'liberty', 'tax', 'constitution'];
    const greenKeywords = ['green', 'environmental', 'climate', 'nature', 'sustainability'];
    
    if (liberalKeywords.some(keyword => orgName.includes(keyword))) return 'liberal';
    if (conservativeKeywords.some(keyword => orgName.includes(keyword))) return 'conservative';
    if (libertarianKeywords.some(keyword => orgName.includes(keyword))) return 'libertarian';
    if (greenKeywords.some(keyword => orgName.includes(keyword))) return 'green';
    
    return 'centrist';
  }

  // Scrape political data for a business
  async scrapePoliticalData(businessName: string, businessWebsite?: string): Promise<BusinessPoliticalData | null> {
    try {
      const cacheKey = `political_${businessName}`;
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      // This is a simplified implementation
      // In a real-world scenario, you would use web scraping APIs or services
      const donations: DonationData[] = [];
      const publicStatements: any[] = [];
      const sources: string[] = [];

      // Simulate finding political data
      // In production, this would make actual API calls to political data sources
      const mockDonations = this.generateMockDonations(businessName);
      const mockStatements = this.generateMockStatements(businessName);

      const alignment = this.calculateAlignment(mockDonations, mockStatements);
      
      const result: BusinessPoliticalData = {
        businessId: 0, // Will be set when saving to database
        alignment,
        donations: mockDonations,
        sources: ['OpenSecrets', 'Ballotpedia', 'News Analysis'],
        confidence: 0.75,
        lastUpdated: new Date()
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error scraping political data:', error);
      return null;
    }
  }

  // Generate mock donations for demonstration
  private generateMockDonations(businessName: string): DonationData[] {
    const donations: DonationData[] = [];
    const numDonations = Math.floor(Math.random() * 5) + 1;
    
    for (let i = 0; i < numDonations; i++) {
      const organizations = Object.keys(KNOWN_POLITICAL_LEANS);
      const org = organizations[Math.floor(Math.random() * organizations.length)];
      
      donations.push({
        organization: org,
        amount: Math.floor(Math.random() * 100000) + 1000,
        politicalLean: KNOWN_POLITICAL_LEANS[org],
        year: 2020 + Math.floor(Math.random() * 4),
        sourceUrl: `https://example.com/donation/${businessName}/${i}`
      });
    }
    
    return donations;
  }

  // Generate mock statements for demonstration
  private generateMockStatements(businessName: string): any[] {
    const statements = [
      { text: 'Supports environmental regulations', lean: 'green', confidence: 0.8 },
      { text: 'Advocates for lower taxes', lean: 'conservative', confidence: 0.7 },
      { text: 'Promotes social equality', lean: 'liberal', confidence: 0.9 },
      { text: 'Supports individual freedoms', lean: 'libertarian', confidence: 0.6 },
      { text: 'Calls for bipartisan solutions', lean: 'centrist', confidence: 0.8 }
    ];
    
    const numStatements = Math.floor(Math.random() * 3) + 1;
    return statements.slice(0, numStatements);
  }

  // Save political alignment data to database
  async savePoliticalAlignment(businessId: number, politicalData: BusinessPoliticalData): Promise<boolean> {
    if (!this.db) return false;

    try {
      // Save alignment scores
      await this.db.insert(businessAlignments).values({
        businessId,
        liberal: politicalData.alignment.liberal,
        conservative: politicalData.alignment.conservative,
        libertarian: politicalData.alignment.libertarian,
        green: politicalData.alignment.green,
        centrist: politicalData.alignment.centrist,
        createdAt: new Date()
      }).onConflictDoUpdate({
        target: businessAlignments.businessId,
        set: {
          liberal: politicalData.alignment.liberal,
          conservative: politicalData.alignment.conservative,
          libertarian: politicalData.alignment.libertarian,
          green: politicalData.alignment.green,
          centrist: politicalData.alignment.centrist,
          createdAt: new Date()
        }
      });

      // Save donation data
      for (const donation of politicalData.donations) {
        await this.db.insert(donations).values({
          businessId,
          organization: donation.organization,
          amount: donation.amount,
          politicalLean: donation.politicalLean,
          createdAt: new Date()
        });
      }

      return true;
    } catch (error) {
      console.error('Error saving political alignment:', error);
      return false;
    }
  }

  // Get political alignment for a business
  async getBusinessPoliticalAlignment(businessId: number): Promise<PoliticalAlignment | null> {
    if (!this.db) return null;

    try {
      const result = await this.db
        .select()
        .from(businessAlignments)
        .where(eq(businessAlignments.businessId, businessId))
        .limit(1);

      if (result.length === 0) return null;

      const alignment = result[0];
      return {
        liberal: alignment.liberal,
        conservative: alignment.conservative,
        libertarian: alignment.libertarian,
        green: alignment.green,
        centrist: alignment.centrist
      };
    } catch (error) {
      console.error('Error getting business political alignment:', error);
      return null;
    }
  }

  // Get donations for a business
  async getBusinessDonations(businessId: number): Promise<DonationData[]> {
    if (!this.db) return [];

    try {
      const result = await this.db
        .select()
        .from(donations)
        .where(eq(donations.businessId, businessId));

      return result.map((donation: any) => ({
        organization: donation.organization,
        amount: donation.amount,
        politicalLean: donation.politicalLean,
        year: new Date(donation.createdAt).getFullYear(),
        sourceUrl: donation.sourceUrl
      }));
    } catch (error) {
      console.error('Error getting business donations:', error);
      return [];
    }
  }

  // Update political alignments for all businesses
  async updateAllBusinessAlignments(): Promise<{ success: number; failed: number }> {
    if (!this.db) return { success: 0, failed: 0 };

    try {
      const allBusinesses = await this.db.select().from(businesses);
      let success = 0;
      let failed = 0;

      for (const business of allBusinesses) {
        try {
          const politicalData = await this.scrapePoliticalData(business.name, business.website);
          if (politicalData) {
            politicalData.businessId = business.id;
            const saved = await this.savePoliticalAlignment(business.id, politicalData);
            if (saved) {
              success++;
            } else {
              failed++;
            }
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`Error updating alignment for ${business.name}:`, error);
          failed++;
        }
      }

      return { success, failed };
    } catch (error) {
      console.error('Error updating all business alignments:', error);
      return { success: 0, failed: 0 };
    }
  }

  // User contribution: Submit political alignment data for a business
  async submitUserAlignment(
    userId: number,
    businessId: number,
    alignment: PoliticalAlignment,
    confidence: number = 0.5
  ): Promise<boolean> {
    if (!this.db) return false;

    try {
      // Save user's assessment of business alignment
      await this.db.insert(userBusinessAlignments).values({
        userId,
        businessId,
        liberal: alignment.liberal,
        conservative: alignment.conservative,
        libertarian: alignment.libertarian,
        green: alignment.green,
        centrist: alignment.centrist,
        confidence,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: [userBusinessAlignments.userId, userBusinessAlignments.businessId],
        set: {
          liberal: alignment.liberal,
          conservative: alignment.conservative,
          libertarian: alignment.libertarian,
          green: alignment.green,
          centrist: alignment.centrist,
          confidence,
          updatedAt: new Date()
        }
      });

      // Update business alignment based on user contributions
      await this.updateBusinessAlignmentFromUsers(businessId);

      return true;
    } catch (error) {
      console.error('Error submitting user alignment:', error);
      return false;
    }
  }

  // Update business alignment based on user contributions
  private async updateBusinessAlignmentFromUsers(businessId: number): Promise<void> {
    if (!this.db) return;

    try {
      // Get all user alignments for this business
      const userAlignmentsData = await this.db
        .select()
        .from(userBusinessAlignments)
        .where(eq(userBusinessAlignments.businessId, businessId));

      if (userAlignmentsData.length === 0) return;

      // Calculate average alignment
      const avgAlignment: PoliticalAlignment = {
        liberal: 0,
        conservative: 0,
        libertarian: 0,
        green: 0,
        centrist: 0
      };

      userAlignmentsData.forEach((userAlignment: any) => {
        avgAlignment.liberal += userAlignment.liberal;
        avgAlignment.conservative += userAlignment.conservative;
        avgAlignment.libertarian += userAlignment.libertarian;
        avgAlignment.green += userAlignment.green;
        avgAlignment.centrist += userAlignment.centrist;
      });

      const count = userAlignmentsData.length;
      Object.keys(avgAlignment).forEach(key => {
        avgAlignment[key as keyof PoliticalAlignment] /= count;
      });

      // Update business alignment
      await this.db.insert(businessAlignments).values({
        businessId,
        liberal: avgAlignment.liberal,
        conservative: avgAlignment.conservative,
        libertarian: avgAlignment.libertarian,
        green: avgAlignment.green,
        centrist: avgAlignment.centrist,
        createdAt: new Date()
      }).onConflictDoUpdate({
        target: businessAlignments.businessId,
        set: {
          liberal: avgAlignment.liberal,
          conservative: avgAlignment.conservative,
          libertarian: avgAlignment.libertarian,
          green: avgAlignment.green,
          centrist: avgAlignment.centrist,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating business alignment from users:', error);
    }
  }

  // Get user's alignment submissions for businesses
  async getUserAlignmentSubmissions(userId: number): Promise<any[]> {
    if (!this.db) return [];

    try {
      const submissions = await this.db
        .select({
          businessId: userBusinessAlignments.businessId,
          businessName: businesses.name,
          liberal: userBusinessAlignments.liberal,
          conservative: userBusinessAlignments.conservative,
          libertarian: userBusinessAlignments.libertarian,
          green: userBusinessAlignments.green,
          centrist: userBusinessAlignments.centrist,
          confidence: userBusinessAlignments.confidence,
          createdAt: userBusinessAlignments.createdAt,
          updatedAt: userBusinessAlignments.updatedAt,
        })
        .from(userBusinessAlignments)
        .innerJoin(businesses, eq(userBusinessAlignments.businessId, businesses.id))
        .where(eq(userBusinessAlignments.userId, userId))
        .orderBy(desc(userBusinessAlignments.updatedAt));

      return submissions;
    } catch (error) {
      console.error('Error getting user alignment submissions:', error);
      return [];
    }
  }

  // Get user's personal political alignment
  async getUserPersonalAlignment(userId: number): Promise<PoliticalAlignment | null> {
    if (!this.db) return null;

    try {
      const result = await this.db
        .select()
        .from(userAlignments)
        .where(eq(userAlignments.userId, userId))
        .limit(1);

      if (result.length === 0) return null;

      const alignment = result[0];
      return {
        liberal: alignment.liberal,
        conservative: alignment.conservative,
        libertarian: alignment.libertarian,
        green: alignment.green,
        centrist: alignment.centrist
      };
    } catch (error) {
      console.error('Error getting user personal alignment:', error);
      return null;
    }
  }

  // Save user's personal political alignment
  async saveUserPersonalAlignment(userId: number, alignment: PoliticalAlignment): Promise<boolean> {
    if (!this.db) return false;

    try {
      await this.db.insert(userAlignments).values({
        userId,
        liberal: alignment.liberal,
        conservative: alignment.conservative,
        libertarian: alignment.libertarian,
        green: alignment.green,
        centrist: alignment.centrist,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: userAlignments.userId,
        set: {
          liberal: alignment.liberal,
          conservative: alignment.conservative,
          libertarian: alignment.libertarian,
          green: alignment.green,
          centrist: alignment.centrist,
          updatedAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Error saving user personal alignment:', error);
      return false;
    }
  }

  // Get alignment statistics
  async getAlignmentStatistics(): Promise<any> {
    if (!this.db) return { error: 'Database not available' };

    try {
      const totalBusinesses = await this.db.select({ count: sql`count(*)` }).from(businesses);
      const businessesWithAlignment = await this.db
        .select({ count: sql`count(*)` })
        .from(businessAlignments);

      const avgAlignments = await this.db
        .select({
          avgLiberal: sql`avg(liberal)`,
          avgConservative: sql`avg(conservative)`,
          avgLibertarian: sql`avg(libertarian)`,
          avgGreen: sql`avg(green)`,
          avgCentrist: sql`avg(centrist)`
        })
        .from(businessAlignments);

      return {
        totalBusinesses: totalBusinesses[0].count,
        businessesWithAlignment: businessesWithAlignment[0].count,
        coveragePercentage: (businessesWithAlignment[0].count / totalBusinesses[0].count) * 100,
        averageAlignments: avgAlignments[0]
      };
    } catch (error) {
      console.error('Error getting alignment statistics:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Lazy initialization to avoid database connection errors
let serviceInstance: PoliticalAlignmentService | null = null;

export const politicalAlignmentService = {
  getInstance(): PoliticalAlignmentService {
    if (!serviceInstance) {
      serviceInstance = new PoliticalAlignmentService();
    }
    return serviceInstance;
  },
  
  // Proxy all methods to the instance
  async scrapePoliticalData(businessName: string, businessWebsite?: string) {
    return this.getInstance().scrapePoliticalData(businessName, businessWebsite);
  },
  
  async savePoliticalAlignment(businessId: number, politicalData: any) {
    return this.getInstance().savePoliticalAlignment(businessId, politicalData);
  },
  
  async getBusinessPoliticalAlignment(businessId: number) {
    return this.getInstance().getBusinessPoliticalAlignment(businessId);
  },
  
  async getBusinessDonations(businessId: number) {
    return this.getInstance().getBusinessDonations(businessId);
  },
  
  async updateAllBusinessAlignments() {
    return this.getInstance().updateAllBusinessAlignments();
  },
  
  async submitUserAlignment(userId: number, businessId: number, alignment: any, confidence?: number) {
    return this.getInstance().submitUserAlignment(userId, businessId, alignment, confidence);
  },
  
  async getUserAlignmentSubmissions(userId: number) {
    return this.getInstance().getUserAlignmentSubmissions(userId);
  },
  
  async getUserPersonalAlignment(userId: number) {
    return this.getInstance().getUserPersonalAlignment(userId);
  },
  
  async saveUserPersonalAlignment(userId: number, alignment: any) {
    return this.getInstance().saveUserPersonalAlignment(userId, alignment);
  },
  
  async getAlignmentStatistics() {
    return this.getInstance().getAlignmentStatistics();
  }
};

export default PoliticalAlignmentService;

