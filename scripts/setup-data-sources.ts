import { getDB } from '../db/connection';
import { dataSources } from '../db/schema';

/**
 * Initialize data sources for political data collection
 */
async function setupDataSources() {
  const db = getDB();

  const sources = [
    {
      name: 'Political Data Scraper',
      type: 'scrape',
      url: 'multiple',
      rateLimit: 100, // requests per hour across all sources
      isActive: true,
    },
    {
      name: 'FEC (Federal Election Commission)',
      type: 'api',
      url: 'https://api.open.fec.gov/v1/',
      rateLimit: 1000, // FEC allows 1000 requests per hour
      isActive: true,
    },
    {
      name: 'OpenSecrets.org',
      type: 'api', 
      url: 'https://www.opensecrets.org/api/',
      rateLimit: 200, // Conservative rate limit
      isActive: true,
    },
    {
      name: 'NewsAPI',
      type: 'api',
      url: 'https://newsapi.org/v2/',
      rateLimit: 100, // Depends on plan
      isActive: true,
    },
    {
      name: 'Corporate Political Statements',
      type: 'scrape',
      url: 'multiple',
      rateLimit: 50,
      isActive: true,
    },
  ];

  console.log('Setting up data sources...');

  for (const source of sources) {
    try {
      await db.insert(dataSources).values(source).onConflictDoUpdate({
        target: dataSources.name,
        set: {
          type: source.type,
          url: source.url,
          rateLimit: source.rateLimit,
          isActive: source.isActive,
          updatedAt: new Date(),
        },
      });
      
      console.log(`✓ Configured data source: ${source.name}`);
    } catch (error) {
      console.error(`✗ Failed to configure ${source.name}:`, error);
    }
  }

  console.log('Data sources setup completed');
}

if (require.main === module) {
  setupDataSources().catch(console.error);
}

export { setupDataSources };