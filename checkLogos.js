require('dotenv').config();

const { getDB } = require('./db/connection');
const { businesses } = require('./db/schema');
const { sql } = require('drizzle-orm');

async function checkLogos() {
  const db = getDB();
  try {
    const businessesWithLogos = await db.select().from(businesses).where(sql`${businesses.logoUrl} is not null`);
    console.log('Businesses with logos:');
    businessesWithLogos.forEach(business => {
      console.log(`- ${business.name}: ${business.logoUrl}`);
    });
    console.log(`\nTotal businesses with logos: ${businessesWithLogos.length}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkLogos();
