require('dotenv').config();

const { getDB } = require('./db/connection');
const { businesses, businessMedia } = require('./db/schema');
const { sql } = require('drizzle-orm');

async function generateFinalReport() {
  const db = getDB();
  
  try {
    console.log('🎉 BULK LOGO FETCHING FINAL REPORT 🎉');
    console.log('='.repeat(60));
    
    // Get total businesses
    const totalBusinesses = await db.select({ count: sql`count(*)` }).from(businesses);
    console.log(`🏢 Total Businesses: ${totalBusinesses[0].count}`);
    
    // Get businesses with logos
    const businessesWithLogos = await db.select().from(businesses).where(sql`${businesses.logoUrl} is not null`);
    const businessesWithoutLogos = totalBusinesses[0].count - businessesWithLogos.length;
    
    console.log(`✅ Businesses with logos: ${businessesWithLogos.length}`);
    console.log(`❌ Businesses without logos: ${businessesWithoutLogos}`);
    
    // Calculate success rate
    const successRate = ((businessesWithLogos.length / totalBusinesses[0].count) * 100).toFixed(1);
    console.log(`📈 Success Rate: ${successRate}%`);
    
    // Get logo sources
    const logoSources = {};
    businessesWithLogos.forEach(business => {
      const source = business.logoUrl.split('/')[2]; // Extract domain
      logoSources[source] = (logoSources[source] || 0) + 1;
    });
    
    console.log('\n🔍 Logo Sources:');
    Object.entries(logoSources).forEach(([source, count]) => {
      console.log(`• ${source}: ${count} logos`);
    });
    
    // Show businesses without logos
    console.log('\n❌ Businesses without logos:');
    const businessesNoLogos = await db.select().from(businesses).where(sql`${businesses.logoUrl} is null`);
    businessesNoLogos.slice(0, 10).forEach(business => {
      console.log(`  - ${business.name}`);
    });
    if (businessesNoLogos.length > 10) {
      console.log(`  ... and ${businessesNoLogos.length - 10} more`);
    }
    
    // Get media records
    const mediaRecords = await db.select({ count: sql`count(*)` }).from(businessMedia);
    console.log(`\n📸 Total Media Records: ${mediaRecords[0].count}`);
    
    // Get logo media records
    const logoMedia = await db.select({ count: sql`count(*)` }).from(businessMedia).where(sql`${businessMedia.type} = 'logo'`);
    console.log(`🏷️ Logo Media Records: ${logoMedia[0].count}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 REPORT GENERATION COMPLETED 🎉');
    
  } catch (error) {
    console.error('Error generating report:', error);
  }
}

generateFinalReport();
