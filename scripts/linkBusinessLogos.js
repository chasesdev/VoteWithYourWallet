const fs = require('fs');
const path = require('path');

// For this script, we'll use a direct SQL approach
const Database = require('better-sqlite3');

// Mapping of business names to their logo files
const logoMappings = {
  'Patagonia': 'assets/images/businesses/patagonia.png',
  'Chick-fil-A': 'assets/images/businesses/chick_fil_a.png',
  'Ben & Jerry\'s': 'assets/images/businesses/ben___jerry_s.png',
  'Tesla': 'assets/images/businesses/tesla.png',
  'Walmart': 'assets/images/businesses/walmart.png',
  'South Coast Plaza': 'assets/images/businesses/south_coast_plaza.png',
  'Disneyland Resort': 'assets/images/businesses/disneyland_resort.png',
  'John Wayne Airport': 'assets/images/businesses/john_wayne_airport.png',
  'UC Irvine': 'assets/images/businesses/uc_irvine.png',
  'The Irvine Company': 'assets/images/businesses/the_irvine_company.png',
  'Spectrum Center': 'assets/images/businesses/spectrum_center.png',
  'Angel Stadium': 'assets/images/businesses/angel_stadium.png',
  'Honda Center': 'assets/images/businesses/honda_center.png',
  'The OC Fair & Event Center': 'assets/images/businesses/the_oc_fair___event_center.png',
  'Orange County Great Park': 'assets/images/businesses/orange_county_great_park.png',
  'Newport Beach Pier': 'assets/images/businesses/newport_beach_pier.png',
  'Laguna Beach Art Museum': 'assets/images/businesses/laguna_beach_art_museum.png',
  'Crystal Cove State Park': 'assets/images/businesses/crystal_cove_state_park.png',
  'The Bowers Museum': 'assets/images/businesses/the_bowers_museum.png',
  'Discovery Cube Orange County': 'assets/images/businesses/discovery_cube_orange_county.png',
  'Fashion Island Newport Beach': 'assets/images/businesses/fashion_island_newport_beach.png',
  'Irvine Spectrum Center': 'assets/images/businesses/irvine_spectrum_center.png',
  'Mission San Juan Capistrano': 'assets/images/businesses/mission_san_juan_capistrano.png',
  'Balboa Island': 'assets/images/businesses/balboa_island.png',
  'The Ritz-Carlton Laguna Niguel': 'assets/images/businesses/the_ritz_carlton_laguna_niguel.png',
  'Dana Point Harbor': 'assets/images/businesses/dana_point_harbor.png'
};

async function linkLogos() {
  console.log('Starting to link business logos...');
  
  let updated = 0;
  let notFound = 0;
  
  try {
    // Get all businesses from database
    const allBusinesses = await db.select().from(businesses);
    console.log(`Found ${allBusinesses.length} businesses in database`);
    
    for (const business of allBusinesses) {
      const logoPath = logoMappings[business.name];
      
      if (logoPath) {
        // Check if file exists
        const fullPath = path.join(process.cwd(), logoPath);
        if (fs.existsSync(fullPath)) {
          // Update the business with the logo URL
          await db.update(businesses)
            .set({ logoUrl: logoPath })
            .where(eq(businesses.id, business.id));
          
          console.log(`✓ Updated ${business.name} with logo: ${logoPath}`);
          updated++;
        } else {
          console.log(`⚠ Logo file not found for ${business.name}: ${logoPath}`);
          notFound++;
        }
      } else {
        console.log(`⚠ No logo mapping found for: ${business.name}`);
        notFound++;
      }
    }
    
    console.log(`\nUpdate complete: ${updated} businesses updated, ${notFound} logos not found`);
    
  } catch (error) {
    console.error('Error linking logos:', error);
  } finally {
    client.close();
  }
}

// Run the script
linkLogos();