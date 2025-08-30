/**
 * Browser Console Logo Downloader
 * 
 * Copy and paste this script into your browser console to download business logos
 * Run this on any webpage (like clearbit.com/logo or similar logo services)
 */

// Business names and their likely official websites/logo sources
const businesses = [
  { name: 'Patagonia', domain: 'patagonia.com' },
  { name: 'Chick-fil-A', domain: 'chick-fil-a.com' },
  { name: 'Ben & Jerry\'s', domain: 'benjerry.com' },
  { name: 'Tesla', domain: 'tesla.com' },
  { name: 'Walmart', domain: 'walmart.com' },
  { name: 'South Coast Plaza', domain: 'southcoastplaza.com' },
  { name: 'Disneyland Resort', domain: 'disneyland.disney.go.com' },
  { name: 'John Wayne Airport', domain: 'ocair.com' },
  { name: 'UC Irvine', domain: 'uci.edu' },
  { name: 'The Irvine Company', domain: 'theirvinecompany.com' },
  { name: 'Spectrum Center', domain: 'hondacenter.com' },
  { name: 'Angel Stadium', domain: 'mlb.com' },
  { name: 'Honda Center', domain: 'hondacenter.com' },
  { name: 'The OC Fair & Event Center', domain: 'ocfair.com' },
  { name: 'Orange County Great Park', domain: 'ocgp.org' },
  { name: 'Newport Beach Pier', domain: 'newportbeachca.gov' },
  { name: 'Laguna Beach Art Museum', domain: 'lagunaartmuseum.org' },
  { name: 'Crystal Cove State Park', domain: 'parks.ca.gov' },
  { name: 'The Bowers Museum', domain: 'bowers.org' },
  { name: 'Discovery Cube Orange County', domain: 'discoverycube.org' },
  { name: 'Fashion Island Newport Beach', domain: 'shopfashionisland.com' },
  { name: 'Irvine Spectrum Center', domain: 'shopirvinespectrum.com' },
  { name: 'Mission San Juan Capistrano', domain: 'missionsjc.com' },
  { name: 'Balboa Island', domain: 'newportbeachca.gov' },
  { name: 'The Ritz-Carlton Laguna Niguel', domain: 'ritzcarlton.com' },
  { name: 'Dana Point Harbor', domain: 'danapointharbor.com' }
];

// Logo services that provide reliable logos
const logoServices = {
  clearbit: (domain) => `https://logo.clearbit.com/${domain}`,
  brandfetch: (domain) => `https://assets.brandfetch.io/${domain}/logo/`,
  logodev: (domain) => `https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ`,
  google: (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=256`
};

function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function downloadImage(url, filename) {
  return fetch(url)
    .then(response => {
      if (response.ok) {
        return response.blob();
      }
      throw new Error(`HTTP ${response.status}`);
    })
    .then(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      return true;
    });
}

async function downloadAllLogos() {
  console.log('🎯 Starting logo download process...');
  
  const results = [];
  
  for (const business of businesses) {
    console.log(`\n📥 Processing ${business.name}...`);
    
    const filename = `${sanitizeFilename(business.name)}.png`;
    let success = false;
    
    // Try each logo service
    for (const [serviceName, serviceUrl] of Object.entries(logoServices)) {
      if (success) break;
      
      try {
        const url = serviceUrl(business.domain);
        console.log(`  Trying ${serviceName}: ${url}`);
        
        await downloadImage(url, filename);
        console.log(`  ✅ Downloaded from ${serviceName}`);
        
        results.push({ name: business.name, status: 'success', service: serviceName });
        success = true;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`  ❌ Failed from ${serviceName}: ${error.message}`);
      }
    }
    
    if (!success) {
      console.log(`  ⚠️ Could not download logo for ${business.name}`);
      results.push({ name: business.name, status: 'failed' });
    }
  }
  
  // Summary
  console.log('\n📊 Download Summary:');
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  
  console.log(`Total businesses: ${businesses.length}`);
  console.log(`Successfully downloaded: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Success rate: ${((successful.length / businesses.length) * 100).toFixed(1)}%`);
  
  console.log('\n✅ Successful downloads:');
  successful.forEach(r => console.log(`  ${r.name} (${r.service})`));
  
  if (failed.length > 0) {
    console.log('\n❌ Failed downloads:');
    failed.forEach(r => console.log(`  ${r.name}`));
  }
  
  console.log('\n🎉 Logo download process completed!');
  console.log('Check your Downloads folder for the logo files.');
}

// Alternative: Download one logo at a time for testing
function downloadSingleLogo(businessName, domain) {
  console.log(`Downloading logo for ${businessName}...`);
  
  const filename = `${sanitizeFilename(businessName)}.png`;
  
  // Try Clearbit first (usually most reliable)
  const url = `https://logo.clearbit.com/${domain}`;
  
  downloadImage(url, filename)
    .then(() => {
      console.log(`✅ Downloaded ${businessName} logo`);
    })
    .catch(error => {
      console.log(`❌ Failed to download ${businessName}: ${error.message}`);
      
      // Try Google favicon as backup
      const fallbackUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
      return downloadImage(fallbackUrl, filename);
    })
    .then(() => {
      console.log(`✅ Downloaded ${businessName} logo (fallback)`);
    })
    .catch(error => {
      console.log(`❌ All sources failed for ${businessName}: ${error.message}`);
    });
}

// Instructions for use
console.log(`
🎯 BROWSER LOGO DOWNLOADER

Instructions:
1. Make sure you're on a webpage that allows downloads
2. Run one of these commands:

📥 Download all logos:
downloadAllLogos()

📥 Download single logo (example):
downloadSingleLogo('Tesla', 'tesla.com')

📥 Available businesses:
${businesses.map(b => `'${b.name}'`).join(', ')}

⚡ Ready to start! Run downloadAllLogos() to begin.
`);

// Make functions available globally
window.downloadAllLogos = downloadAllLogos;
window.downloadSingleLogo = downloadSingleLogo;
window.businesses = businesses;