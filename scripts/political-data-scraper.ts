import { getDB } from '../db/connection';
import { businesses, politicalActivity, dataSources, syncLogs } from '../db/schema';
import { eq } from 'drizzle-orm';

interface PoliticalActivityData {
  businessId: number;
  date: string;
  type: 'donation' | 'statement' | 'endorsement' | 'lobbying' | 'lawsuit' | 'sponsorship';
  title: string;
  description: string;
  amount?: number;
  recipient?: string;
  impact: 'positive' | 'negative' | 'neutral';
  sourceUrl?: string;
  sourceType?: string;
  confidence: number;
  isVerified: boolean;
  tags?: string[];
  metadata?: any;
}

interface DataSource {
  id: number;
  name: string;
  type: string;
  url?: string;
  apiKey?: string;
  rateLimit?: number;
}

class PoliticalDataScraper {
  private db: any;
  private dataSources: DataSource[] = [];

  constructor() {
    this.db = getDB();
  }

  async initialize() {
    // Load configured data sources from database
    this.dataSources = await this.db
      .select()
      .from(dataSources)
      .where(eq(dataSources.isActive, true));
    
    console.log(`Loaded ${this.dataSources.length} active data sources`);
  }

  /**
   * Scrape FEC (Federal Election Commission) data for corporate donations
   */
  async scrapeFECData(businessName: string, businessId: number): Promise<PoliticalActivityData[]> {
    const activities: PoliticalActivityData[] = [];
    
    try {
      // FEC API endpoint for contributor search
      const fecApiKey = process.env.FEC_API_KEY;
      if (!fecApiKey) {
        console.warn('FEC API key not configured');
        return activities;
      }

      const searchUrl = `https://api.open.fec.gov/v1/schedules/schedule_a/?api_key=${fecApiKey}&contributor_name=${encodeURIComponent(businessName)}&per_page=100&sort_hide_null=false&sort_nulls_last=false&sort=-contribution_receipt_date`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error(`FEC API error: ${response.status}`);
      }

      const data = await response.json();
      
      for (const donation of data.results || []) {
        if (donation.contribution_receipt_amount && donation.contribution_receipt_amount > 0) {
          activities.push({
            businessId,
            date: donation.contribution_receipt_date,
            type: 'donation',
            title: `Political Contribution to ${donation.committee?.name || 'Committee'}`,
            description: `Donated $${donation.contribution_receipt_amount.toLocaleString()} to ${donation.committee?.name || 'political committee'}${donation.election_cycle ? ` for ${donation.election_cycle} election cycle` : ''}`,
            amount: Math.round(donation.contribution_receipt_amount * 100), // Convert to cents
            recipient: donation.committee?.name,
            impact: this.determineDonationImpact(donation.committee),
            sourceUrl: `https://www.fec.gov/data/receipts/?contributor_name=${encodeURIComponent(businessName)}`,
            sourceType: 'fec',
            confidence: 0.95,
            isVerified: true,
            tags: ['political_donation', 'fec_data'],
            metadata: {
              committee_id: donation.committee?.committee_id,
              election_cycle: donation.election_cycle,
              filing_form: donation.filing_form,
            }
          });
        }
      }

      // Rate limiting - FEC allows 1000 requests per hour
      await this.sleep(100);
      
    } catch (error) {
      console.error(`Error scraping FEC data for ${businessName}:`, error);
    }

    return activities;
  }

  /**
   * Scrape lobbying data from OpenSecrets API
   */
  async scrapeLobbyingData(businessName: string, businessId: number): Promise<PoliticalActivityData[]> {
    const activities: PoliticalActivityData[] = [];
    
    try {
      const openSecretsKey = process.env.OPENSECRETS_API_KEY;
      if (!openSecretsKey) {
        console.warn('OpenSecrets API key not configured');
        return activities;
      }

      // Search for organization first
      const searchUrl = `https://www.opensecrets.org/api/?method=getOrgs&org=${encodeURIComponent(businessName)}&apikey=${openSecretsKey}&output=json`;
      
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) {
        throw new Error(`OpenSecrets API error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      
      if (searchData.response?.organization) {
        const orgId = searchData.response.organization['@attributes']?.orgid;
        
        if (orgId) {
          // Get lobbying data for the organization
          const lobbyUrl = `https://www.opensecrets.org/api/?method=getLobbyingForClient&id=${orgId}&apikey=${openSecretsKey}&output=json`;
          
          const lobbyResponse = await fetch(lobbyUrl);
          if (lobbyResponse.ok) {
            const lobbyData = await lobbyResponse.json();
            
            if (lobbyData.response?.lobbying) {
              const lobbying = Array.isArray(lobbyData.response.lobbying) 
                ? lobbyData.response.lobbying 
                : [lobbyData.response.lobbying];

              for (const record of lobbying) {
                const attrs = record['@attributes'];
                if (attrs?.amount && parseInt(attrs.amount) > 0) {
                  activities.push({
                    businessId,
                    date: `${attrs.year}-12-31`, // Use end of year as approximate date
                    type: 'lobbying',
                    title: `Lobbying Activity - ${attrs.year}`,
                    description: `Spent $${parseInt(attrs.amount).toLocaleString()} on lobbying activities`,
                    amount: parseInt(attrs.amount) * 100, // Convert to cents
                    recipient: 'U.S. Government',
                    impact: 'neutral',
                    sourceUrl: `https://www.opensecrets.org/orgs/lobbying.php?id=${orgId}`,
                    sourceType: 'lobbying_disclosure',
                    confidence: 0.9,
                    isVerified: true,
                    tags: ['lobbying', 'opensecrets_data'],
                    metadata: {
                      org_id: orgId,
                      year: attrs.year,
                    }
                  });
                }
              }
            }
          }
        }
      }

      await this.sleep(200); // Rate limiting
      
    } catch (error) {
      console.error(`Error scraping lobbying data for ${businessName}:`, error);
    }

    return activities;
  }

  /**
   * Scrape news articles and press releases for political statements
   */
  async scrapeNewsData(businessName: string, businessId: number): Promise<PoliticalActivityData[]> {
    const activities: PoliticalActivityData[] = [];
    
    try {
      const newsApiKey = process.env.NEWS_API_KEY;
      if (!newsApiKey) {
        console.warn('News API key not configured');
        return activities;
      }

      // Search for political news about the business
      const query = `"${businessName}" AND (political OR donation OR endorsement OR election OR campaign)`;
      const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&apiKey=${newsApiKey}&pageSize=50`;
      
      const response = await fetch(newsUrl);
      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`);
      }

      const data = await response.json();
      
      for (const article of data.articles || []) {
        if (this.isPoliticallyRelevant(article.title, article.description)) {
          const impact = this.determineArticleImpact(article.title, article.description);
          const type = this.determineActivityType(article.title, article.description);
          
          activities.push({
            businessId,
            date: article.publishedAt.split('T')[0],
            type,
            title: article.title,
            description: article.description || article.title,
            impact,
            sourceUrl: article.url,
            sourceType: 'news',
            confidence: 0.7,
            isVerified: false,
            tags: ['news_article', 'political_statement'],
            metadata: {
              source: article.source?.name,
              author: article.author,
              published_at: article.publishedAt,
            }
          });
        }
      }

      await this.sleep(1000); // News API rate limiting
      
    } catch (error) {
      console.error(`Error scraping news data for ${businessName}:`, error);
    }

    return activities;
  }

  /**
   * Process all political data for a business
   */
  async scrapeBusinessPoliticalData(businessId: number, businessName: string): Promise<void> {
    console.log(`Starting political data scraping for: ${businessName}`);
    
    const startTime = Date.now();
    let totalRecordsProcessed = 0;
    let totalRecordsAdded = 0;
    let totalRecordsFailed = 0;

    try {
      // Collect data from all sources
      const allActivities: PoliticalActivityData[] = [];
      
      // FEC donations
      const fecData = await this.scrapeFECData(businessName, businessId);
      allActivities.push(...fecData);
      console.log(`Found ${fecData.length} FEC records`);

      // Lobbying data
      const lobbyingData = await this.scrapeLobbyingData(businessName, businessId);
      allActivities.push(...lobbyingData);
      console.log(`Found ${lobbyingData.length} lobbying records`);

      // News/statements
      const newsData = await this.scrapeNewsData(businessName, businessId);
      allActivities.push(...newsData);
      console.log(`Found ${newsData.length} news records`);

      totalRecordsProcessed = allActivities.length;

      // Remove duplicates and save to database
      const uniqueActivities = this.deduplicateActivities(allActivities);
      
      for (const activity of uniqueActivities) {
        try {
          await this.db.insert(politicalActivity).values({
            businessId: activity.businessId,
            date: activity.date,
            type: activity.type,
            title: activity.title,
            description: activity.description,
            amount: activity.amount,
            recipient: activity.recipient,
            impact: activity.impact,
            sourceUrl: activity.sourceUrl,
            sourceType: activity.sourceType,
            confidence: activity.confidence,
            isVerified: activity.isVerified,
            tags: activity.tags ? JSON.stringify(activity.tags) : null,
            metadata: activity.metadata ? JSON.stringify(activity.metadata) : null,
          });
          
          totalRecordsAdded++;
        } catch (error) {
          console.error('Error inserting activity:', error);
          totalRecordsFailed++;
        }
      }

      console.log(`Completed scraping for ${businessName}: ${totalRecordsAdded}/${totalRecordsProcessed} records added`);

    } catch (error) {
      console.error(`Error processing business ${businessName}:`, error);
      totalRecordsFailed = totalRecordsProcessed;
    }

    // Log the sync results
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    // Note: You'll need to create a data source record for political scraping first
    // This assumes you have a data source with id 1 for political scraping
    await this.db.insert(syncLogs).values({
      dataSourceId: 1, // Update this with actual data source ID
      status: totalRecordsFailed === 0 ? 'success' : (totalRecordsAdded > 0 ? 'partial' : 'failed'),
      recordsProcessed: totalRecordsProcessed,
      recordsAdded: totalRecordsAdded,
      recordsFailed: totalRecordsFailed,
      duration,
    });
  }

  /**
   * Run scraper for all businesses
   */
  async scrapeAllBusinesses(): Promise<void> {
    await this.initialize();

    const allBusinesses = await this.db
      .select({
        id: businesses.id,
        name: businesses.name,
      })
      .from(businesses)
      .where(eq(businesses.isActive, true));

    console.log(`Starting political data scraping for ${allBusinesses.length} businesses`);

    for (const business of allBusinesses) {
      await this.scrapeBusinessPoliticalData(business.id, business.name);
      
      // Rate limiting between businesses
      await this.sleep(2000);
    }

    console.log('Political data scraping completed for all businesses');
  }

  // Helper methods
  private determineDonationImpact(committee: any): 'positive' | 'negative' | 'neutral' {
    // This is a simplified example - you'd want more sophisticated political alignment logic
    if (!committee) return 'neutral';
    
    const name = committee.name?.toLowerCase() || '';
    
    if (name.includes('democratic') || name.includes('progressive') || name.includes('liberal')) {
      return 'positive'; // Assuming liberal alignment
    } else if (name.includes('republican') || name.includes('conservative')) {
      return 'negative'; // Assuming this doesn't align with liberal values
    }
    
    return 'neutral';
  }

  private isPoliticallyRelevant(title: string, description: string): boolean {
    const text = `${title} ${description}`.toLowerCase();
    const politicalKeywords = [
      'political', 'donation', 'campaign', 'election', 'endorsement',
      'policy', 'legislation', 'government', 'lobbying', 'pac',
      'democrat', 'republican', 'liberal', 'conservative',
      'biden', 'trump', 'congress', 'senate', 'house'
    ];
    
    return politicalKeywords.some(keyword => text.includes(keyword));
  }

  private determineArticleImpact(title: string, description: string): 'positive' | 'negative' | 'neutral' {
    const text = `${title} ${description}`.toLowerCase();
    
    const positiveKeywords = ['supports', 'endorses', 'donates to', 'backs', 'champions'];
    const negativeKeywords = ['opposes', 'against', 'withdraws support', 'boycotts', 'protests'];
    
    if (positiveKeywords.some(keyword => text.includes(keyword))) {
      return 'positive';
    } else if (negativeKeywords.some(keyword => text.includes(keyword))) {
      return 'negative';
    }
    
    return 'neutral';
  }

  private determineActivityType(title: string, description: string): PoliticalActivityData['type'] {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('donation') || text.includes('contribut')) return 'donation';
    if (text.includes('endorsement') || text.includes('endorse')) return 'endorsement';
    if (text.includes('lobbying') || text.includes('lobby')) return 'lobbying';
    if (text.includes('lawsuit') || text.includes('legal action')) return 'lawsuit';
    if (text.includes('sponsor')) return 'sponsorship';
    
    return 'statement';
  }

  private deduplicateActivities(activities: PoliticalActivityData[]): PoliticalActivityData[] {
    const seen = new Set<string>();
    return activities.filter(activity => {
      const key = `${activity.businessId}-${activity.date}-${activity.title}-${activity.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
if (require.main === module) {
  const scraper = new PoliticalDataScraper();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'all') {
    scraper.scrapeAllBusinesses().catch(console.error);
  } else if (command === 'business' && args[1]) {
    const businessId = parseInt(args[1]);
    const businessName = args[2] || 'Unknown Business';
    scraper.scrapeBusinessPoliticalData(businessId, businessName).catch(console.error);
  } else {
    console.log('Usage:');
    console.log('  npx ts-node scripts/political-data-scraper.ts all');
    console.log('  npx ts-node scripts/political-data-scraper.ts business <id> <name>');
  }
}

export { PoliticalDataScraper };