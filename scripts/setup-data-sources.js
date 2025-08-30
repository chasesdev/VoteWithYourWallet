const { getDB } = require('../db/connection');
const { dataSources } = require('../db/schema');

/**
 * Initialize data sources for political data collection
 */
async function setupDataSources() {
  try {
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
        // Check if source already exists
        const existing = await db.select()
          .from(dataSources)
          .where(eq(dataSources.name, source.name))
          .limit(1);

        if (existing.length > 0) {
          console.log(`✓ Data source already exists: ${source.name}`);
        } else {
          await db.insert(dataSources).values(source);
          console.log(`✓ Created data source: ${source.name}`);
        }
      } catch (error) {
        console.error(`✗ Failed to configure ${source.name}:`, error.message);
      }
    }

    console.log('Data sources setup completed');
  } catch (error) {
    console.error('Error setting up data sources:', error.message);
  }
}

if (require.main === module) {
  setupDataSources().then(() => process.exit(0)).catch(console.error);
}

module.exports = { setupDataSources };