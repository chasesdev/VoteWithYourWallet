// Simple logo update script
const logoMappings = [
  { name: 'Patagonia', logoUrl: 'assets/images/businesses/patagonia.png' },
  { name: 'Chick-fil-A', logoUrl: 'assets/images/businesses/chick_fil_a.png' },
  { name: 'Ben & Jerry\'s', logoUrl: 'assets/images/businesses/ben___jerry_s.png' },
  { name: 'Tesla', logoUrl: 'assets/images/businesses/tesla.png' },
  { name: 'Walmart', logoUrl: 'assets/images/businesses/walmart.png' },
  { name: 'South Coast Plaza', logoUrl: 'assets/images/businesses/south_coast_plaza.png' },
  { name: 'Disneyland Resort', logoUrl: 'assets/images/businesses/disneyland_resort.png' },
  { name: 'John Wayne Airport', logoUrl: 'assets/images/businesses/john_wayne_airport.png' },
  { name: 'UC Irvine', logoUrl: 'assets/images/businesses/uc_irvine.png' },
  { name: 'The Irvine Company', logoUrl: 'assets/images/businesses/the_irvine_company.png' },
  { name: 'Spectrum Center', logoUrl: 'assets/images/businesses/spectrum_center.png' },
  { name: 'Angel Stadium', logoUrl: 'assets/images/businesses/angel_stadium.png' },
  { name: 'Honda Center', logoUrl: 'assets/images/businesses/honda_center.png' },
  { name: 'The OC Fair & Event Center', logoUrl: 'assets/images/businesses/the_oc_fair___event_center.png' },
  { name: 'Orange County Great Park', logoUrl: 'assets/images/businesses/orange_county_great_park.png' },
  { name: 'Newport Beach Pier', logoUrl: 'assets/images/businesses/newport_beach_pier.png' },
  { name: 'Laguna Beach Art Museum', logoUrl: 'assets/images/businesses/laguna_beach_art_museum.png' },
  { name: 'Crystal Cove State Park', logoUrl: 'assets/images/businesses/crystal_cove_state_park.png' },
  { name: 'The Bowers Museum', logoUrl: 'assets/images/businesses/the_bowers_museum.png' },
  { name: 'Discovery Cube Orange County', logoUrl: 'assets/images/businesses/discovery_cube_orange_county.png' },
  { name: 'Fashion Island Newport Beach', logoUrl: 'assets/images/businesses/fashion_island_newport_beach.png' },
  { name: 'Irvine Spectrum Center', logoUrl: 'assets/images/businesses/irvine_spectrum_center.png' },
  { name: 'Mission San Juan Capistrano', logoUrl: 'assets/images/businesses/mission_san_juan_capistrano.png' },
  { name: 'Balboa Island', logoUrl: 'assets/images/businesses/balboa_island.png' },
  { name: 'The Ritz-Carlton Laguna Niguel', logoUrl: 'assets/images/businesses/the_ritz_carlton_laguna_niguel.png' },
  { name: 'Dana Point Harbor', logoUrl: 'assets/images/businesses/dana_point_harbor.png' }
];

// Generate SQL UPDATE statements
console.log('-- SQL UPDATE statements to link business logos');
console.log('');

logoMappings.forEach(({ name, logoUrl }) => {
  console.log(`UPDATE businesses SET logo_url = '${logoUrl}' WHERE name = '${name.replace(/'/g, "''")}';`);
});

console.log('');
console.log('-- Verification query');
console.log('SELECT name, logo_url FROM businesses WHERE logo_url IS NOT NULL;');