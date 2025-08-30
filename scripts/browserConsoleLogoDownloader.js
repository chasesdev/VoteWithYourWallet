/**
 * Browser Console Logo Downloader for VoteWithYourWallet
 * 
 * Copy and paste this entire script into your browser console to download
 * logos for all businesses in your database that don't have local images.
 * 
 * Usage:
 * 1. Open browser console (F12 > Console)
 * 2. Paste this entire script
 * 3. Run: await downloadMissingLogos()
 * 
 * Features:
 * - Fetches businesses from your database API
 * - Checks for existing local logos
 * - Uses multiple logo services (Clearbit, Google, etc.)
 * - Respects rate limits
 * - Provides downloadable files
 */

class BusinessLogoDownloader {
  constructor() {
    // Your API base URL - adjust if needed
    this.apiBase = window.location.origin;
    
    // Enhanced configuration
    this.downloadedLogos = [];
    this.failedDownloads = [];
    this.skippedBusinesses = [];
    this.rateLimitDelay = 500; // 500ms between requests (faster with server API)
    this.maxRetries = 3; // Retry failed downloads
    this.retryDelay = 2000; // 2 seconds between retries
    
    // Statistics tracking
    this.stats = {
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      startTime: null,
      endTime: null
    };
  }

  // Fetch all businesses from your database with pagination support
  async fetchBusinesses() {
    console.log('📊 Fetching businesses from database...');
    
    try {
      let allBusinesses = [];
      let page = 1;
      let totalPages = 1;
      const limit = 100; // Fetch 100 at a time
      
      do {
        console.log(`  🔄 Fetching page ${page}/${totalPages}...`);
        
        const response = await fetch(`${this.apiBase}/api/businesses?page=${page}&limit=${limit}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch businesses: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Handle different API response structures
        let businessesArray = [];
        let paginationInfo = null;
        
        if (Array.isArray(data)) {
          // Direct array response
          businessesArray = data;
        } else if (data.businesses && Array.isArray(data.businesses)) {
          // Response with businesses property
          businessesArray = data.businesses;
          paginationInfo = data.pagination;
        } else if (data.data && Array.isArray(data.data)) {
          // Response with data property
          businessesArray = data.data;
          paginationInfo = data.pagination;
        } else {
          console.warn('⚠️ Unexpected API response structure:', data);
          break;
        }
        
        allBusinesses.push(...businessesArray);
        
        // Calculate total pages from pagination info
        if (paginationInfo && paginationInfo.total) {
          totalPages = Math.ceil(paginationInfo.total / limit);
        } else if (businessesArray.length < limit) {
          // If we got fewer businesses than requested, we're on the last page
          break;
        } else {
          // Increment page and try again (fallback)
          totalPages = page + 1;
        }
        
        page++;
        
        // Safety break to prevent infinite loops
        if (page > 50) {
          console.warn('⚠️ Stopped fetching after 50 pages to prevent infinite loop');
          break;
        }
        
      } while (page <= totalPages);
      
      console.log(`✅ Found ${allBusinesses.length} total businesses in database`);
      return allBusinesses;
      
    } catch (error) {
      console.error('❌ Error fetching businesses:', error);
      
      // Fallback: try single request without pagination
      console.log('🔄 Trying fallback single request...');
      try {
        const response = await fetch(`${this.apiBase}/api/businesses?limit=1000`);
        if (response.ok) {
          const data = await response.json();
          const businesses = data.businesses || data.data || data || [];
          console.log(`✅ Fallback successful: ${businesses.length} businesses`);
          return Array.isArray(businesses) ? businesses : [];
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
      
      return [];
    }
  }

  // Check which businesses don't have logos
  async checkForMissingLogos(businesses) {
    console.log('🔍 Checking for missing logos...');
    
    const businessesNeedingLogos = [];
    
    for (const business of businesses) {
      const needsLogo = await this.businessNeedsLogo(business);
      if (needsLogo) {
        businessesNeedingLogos.push(business);
      }
    }
    
    console.log(`📝 Found ${businessesNeedingLogos.length} businesses needing logos`);
    return businessesNeedingLogos;
  }

  // Check if a business needs a logo (doesn't have local image)
  async businessNeedsLogo(business) {
    if (!business.name) return false;
    
    // Check if logoUrl already exists
    if (business.logoUrl && business.logoUrl.includes('/images/businesses/')) {
      return false; // Already has local logo
    }
    
    // Try to check if local logo file exists
    const sanitizedName = this.sanitizeFilename(business.name);
    const possibleLogoPaths = [
      `/images/businesses/${sanitizedName}.png`,
      `/images/businesses/${sanitizedName}.svg`,
      `/images/businesses/${sanitizedName}/logo_1.png`,
      `/images/businesses/${sanitizedName}/logo_1.svg`
    ];
    
    // Check if any of these files exist
    for (const logoPath of possibleLogoPaths) {
      try {
        const response = await fetch(`${this.apiBase}${logoPath}`, { method: 'HEAD' });
        if (response.ok) {
          console.log(`✅ ${business.name} already has logo at ${logoPath}`);
          return false; // Logo exists
        }
      } catch (error) {
        // File doesn't exist, continue checking
      }
    }
    
    return true; // Needs logo
  }

  // Extract domain from business data
  extractDomain(business) {
    // Try website field first
    if (business.website) {
      try {
        const url = new URL(business.website.startsWith('http') ? business.website : `https://${business.website}`);
        return url.hostname.replace('www.', '');
      } catch (error) {
        // Invalid URL, continue
      }
    }
    
    // Try to guess domain from business name
    const name = business.name.toLowerCase();
    
    // Common business name to domain mappings
    const domainMappings = {
      'starbucks': 'starbucks.com',
      'mcdonalds': 'mcdonalds.com',
      'subway': 'subway.com',
      'walmart': 'walmart.com',
      'target': 'target.com',
      'apple': 'apple.com',
      'microsoft': 'microsoft.com',
      'google': 'google.com',
      'amazon': 'amazon.com',
      'tesla': 'tesla.com',
      'nike': 'nike.com',
      'coca cola': 'coca-cola.com',
      'pepsi': 'pepsi.com',
      'facebook': 'facebook.com',
      'twitter': 'twitter.com',
      'instagram': 'instagram.com'
    };
    
    // Check for exact matches
    for (const [key, domain] of Object.entries(domainMappings)) {
      if (name.includes(key)) {
        return domain;
      }
    }
    
    // Try to create domain from name
    const cleanName = name.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '');
    if (cleanName.length > 2) {
      return `${cleanName}.com`;
    }
    
    return null;
  }

  // Download logo using CORS-bypassing server API with retry logic
  async downloadBusinessLogo(business, retryCount = 0) {
    const domain = this.extractDomain(business);
    
    if (!domain) {
      console.log(`⚠️ Skipping ${business.name}: No domain found`);
      this.skippedBusinesses.push({ business: business.name, reason: 'No domain' });
      this.stats.skipped++;
      return null;
    }
    
    console.log(`🔽 Downloading logo for ${business.name} (${domain})`);
    
    try {
      // Use our server API to bypass CORS
      const apiUrl = `${this.apiBase}/api/fetch-logo`;
      const params = new URLSearchParams({
        domain: domain,
        businessName: business.name,
        website: business.website || ''
      });
      
      console.log(`  🔗 Using server API: ${apiUrl}?${params.toString().substring(0, 100)}...`);
      
      const response = await fetch(`${apiUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'image/*',
          'User-Agent': 'VoteWithYourWallet-Browser/1.0'
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const logoService = response.headers.get('X-Logo-Service') || 'unknown';
        const logoSize = response.headers.get('X-Logo-Size') || blob.size;
        
        // Validate it's actually an image
        if (blob.type.startsWith('image/') && blob.size > 100) {
          console.log(`  ✅ Success with ${logoService} (${logoSize} bytes)`);
          
          const logoData = {
            business: business,
            domain: domain,
            service: logoService,
            url: `${apiUrl}?${params}`,
            blob: blob,
            filename: `${this.sanitizeFilename(business.name)}.${this.getFileExtension(blob.type)}`,
            downloadTime: new Date().toISOString()
          };
          
          this.downloadedLogos.push(logoData);
          this.stats.successful++;
          return logoData;
        } else {
          console.log(`  ❌ Invalid image response (${blob.type}, ${blob.size} bytes)`);
          // Don't try to read response body again - we already consumed it as blob
        }
      } else if (response.status === 429) {
        // Rate limited - wait and retry
        console.log(`  ⏳ Rate limited, waiting ${this.retryDelay}ms...`);
        await this.delay(this.retryDelay);
        
        if (retryCount < this.maxRetries) {
          console.log(`  🔄 Retrying ${business.name} (${retryCount + 1}/${this.maxRetries})`);
          return await this.downloadBusinessLogo(business, retryCount + 1);
        }
      } else {
        // Only try to read response body for non-200 responses
        let errorData;
        try {
          const responseText = await response.text();
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            errorData = responseText;
          }
        } catch (e) {
          errorData = `Unable to read response body: ${e.message}`;
        }
        console.log(`  ❌ Server API failed: ${response.status} - ${JSON.stringify(errorData).substring(0, 200)}`);
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`  ⏰ Request timed out for ${business.name}`);
      } else {
        console.log(`  ❌ Error with server API: ${error.message}`);
      }
      
      // Retry on network errors
      if (retryCount < this.maxRetries && (error.name === 'AbortError' || error.message.includes('network'))) {
        console.log(`  🔄 Retrying ${business.name} due to ${error.name} (${retryCount + 1}/${this.maxRetries})`);
        await this.delay(this.retryDelay);
        return await this.downloadBusinessLogo(business, retryCount + 1);
      }
    }
    
    this.failedDownloads.push({ 
      business: business.name, 
      domain: domain, 
      reason: 'Server API failed after retries',
      retries: retryCount
    });
    
    this.stats.failed++;
    return null;
  }

  // Group businesses by state with proper state detection
  groupBusinessesByState(businesses) {
    const stateGroups = {};
    
    // US State abbreviations and names
    const US_STATES = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
      'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
      'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
      'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
      'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
      'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
      'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
      'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
    };
    
    const STATE_NAMES = Object.values(US_STATES);
    const STATE_ABBREVS = Object.keys(US_STATES);
    
    businesses.forEach(business => {
      let detectedState = 'Unknown';
      
      // Method 1: Check business.state property first
      if (business.state) {
        const stateValue = business.state.trim().toUpperCase();
        if (STATE_ABBREVS.includes(stateValue)) {
          detectedState = stateValue;
        } else if (STATE_NAMES.includes(business.state)) {
          // Convert full name to abbreviation
          detectedState = Object.keys(US_STATES).find(key => US_STATES[key] === business.state);
        }
      }
      
      // Method 2: Parse from address if state not found
      if (detectedState === 'Unknown' && business.address) {
        const addressParts = business.address.split(',');
        
        // Look at the last few parts of the address for state info
        for (let i = addressParts.length - 1; i >= Math.max(0, addressParts.length - 3); i--) {
          const part = addressParts[i]?.trim();
          if (!part) continue;
          
          // Check for state abbreviation (2 letters)
          const stateMatch = part.match(/\b([A-Z]{2})\b/);
          if (stateMatch && STATE_ABBREVS.includes(stateMatch[1])) {
            detectedState = stateMatch[1];
            break;
          }
          
          // Check for state name
          const foundState = STATE_NAMES.find(stateName => 
            part.toLowerCase().includes(stateName.toLowerCase())
          );
          if (foundState) {
            detectedState = Object.keys(US_STATES).find(key => US_STATES[key] === foundState);
            break;
          }
        }
      }
      
      // Method 3: Check business.city against known cities (basic fallback)
      if (detectedState === 'Unknown' && business.city) {
        const cityLower = business.city.toLowerCase();
        // Simple city-to-state mapping for common cities
        const cityStateMap = {
          'los angeles': 'CA', 'new york': 'NY', 'chicago': 'IL', 'houston': 'TX',
          'phoenix': 'AZ', 'philadelphia': 'PA', 'san antonio': 'TX', 'san diego': 'CA',
          'dallas': 'TX', 'san jose': 'CA', 'austin': 'TX', 'jacksonville': 'FL',
          'san francisco': 'CA', 'columbus': 'OH', 'charlotte': 'NC', 'fort worth': 'TX',
          'detroit': 'MI', 'el paso': 'TX', 'memphis': 'TN', 'seattle': 'WA',
          'denver': 'CO', 'washington': 'DC', 'boston': 'MA', 'nashville': 'TN',
          'baltimore': 'MD', 'oklahoma city': 'OK', 'portland': 'OR', 'las vegas': 'NV',
          'louisville': 'KY', 'milwaukee': 'WI', 'albuquerque': 'NM', 'tucson': 'AZ',
          'fresno': 'CA', 'sacramento': 'CA', 'mesa': 'AZ', 'kansas city': 'MO',
          'atlanta': 'GA', 'colorado springs': 'CO', 'omaha': 'NE', 'raleigh': 'NC',
          'miami': 'FL', 'oakland': 'CA', 'minneapolis': 'MN', 'tulsa': 'OK',
          'cleveland': 'OH', 'wichita': 'KS', 'arlington': 'TX', 'anaheim': 'CA',
          'irvine': 'CA', 'costa mesa': 'CA', 'newport beach': 'CA', 'huntington beach': 'CA',
          'wilmington': 'NC', 'southport': 'NC', 'wrightsville beach': 'NC'
        };
        
        if (cityStateMap[cityLower]) {
          detectedState = cityStateMap[cityLower];
        }
      }
      
      // Group by detected state
      if (!stateGroups[detectedState]) {
        stateGroups[detectedState] = [];
      }
      stateGroups[detectedState].push(business);
    });
    
    // Sort states by business count (largest first), but keep Unknown last
    const sortedStates = Object.keys(stateGroups).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      return stateGroups[b].length - stateGroups[a].length;
    });
    
    return { stateGroups, sortedStates };
  }

  // Download logos for a specific state
  async downloadLogosForState(stateName, businesses, stateIndex, totalStates) {
    console.log(`\n🏛️ ===============================`);
    console.log(`🏛️ STATE ${stateIndex + 1}/${totalStates}: ${stateName}`);
    console.log(`🏛️ Businesses to process: ${businesses.length}`);
    console.log(`🏛️ ===============================\n`);
    
    const stateStats = {
      state: stateName,
      total: businesses.length,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      startTime: new Date()
    };
    
    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i];
      stateStats.processed++;
      this.stats.processed++;
      
      // Show state-level progress
      console.log(`\n🏛️ [${stateName}] Business ${i + 1}/${businesses.length} - ${business.name}`);
      console.log(`📊 State Progress: ${Math.round(stateStats.processed / stateStats.total * 100)}%`);
      console.log(`🌍 Overall Progress: ${this.stats.processed}/${this.stats.total} (${Math.round(this.stats.processed / this.stats.total * 100)}%)`);
      
      const result = await this.downloadBusinessLogo(business);
      
      if (result) {
        stateStats.successful++;
      } else {
        // Check if it was failed or skipped
        const wasSkipped = this.skippedBusinesses.some(s => s.business === business.name);
        if (wasSkipped) {
          stateStats.skipped++;
        } else {
          stateStats.failed++;
        }
      }
      
      // Rate limiting between businesses
      if (i < businesses.length - 1) {
        await this.delay(this.rateLimitDelay);
      }
      
      // Show intermediate results every 10 businesses within state
      if ((i + 1) % 10 === 0) {
        console.log(`\n📊 [${stateName}] Intermediate: ${stateStats.processed}/${stateStats.total}`);
        console.log(`   ✅ Downloaded: ${stateStats.successful} | ❌ Failed: ${stateStats.failed} | ⚠️ Skipped: ${stateStats.skipped}`);
      }
    }
    
    stateStats.endTime = new Date();
    const stateDuration = (stateStats.endTime - stateStats.startTime) / 1000;
    
    // Show state completion summary
    console.log(`\n🎉 STATE COMPLETED: ${stateName}`);
    console.log(`📊 Results: ${stateStats.successful}/${stateStats.total} successful (${Math.round(stateStats.successful/stateStats.total*100)}%)`);
    console.log(`⏰ Duration: ${Math.round(stateDuration)} seconds`);
    console.log(`📈 State Success Rate: ${Math.round(stateStats.successful/(stateStats.successful + stateStats.failed)*100)}%`);
    
    return stateStats;
  }

  // Download logos state by state, business by business
  async downloadAllMissingLogos(businesses) {
    console.log(`🚀 Starting STATE-BY-STATE logo download for ${businesses.length} businesses...`);
    console.log(`📋 Processing will be organized by state, one business at a time.`);
    
    // Group businesses by state
    const { stateGroups, sortedStates } = this.groupBusinessesByState(businesses);
    
    console.log(`\n🗺️ STATES TO PROCESS:`);
    sortedStates.forEach((state, index) => {
      console.log(`${index + 1}. ${state}: ${stateGroups[state].length} businesses`);
    });
    
    // Initialize overall statistics
    this.stats.total = businesses.length;
    this.stats.startTime = new Date();
    this.stats.stateResults = [];
    
    // Process each state
    for (let stateIndex = 0; stateIndex < sortedStates.length; stateIndex++) {
      const stateName = sortedStates[stateIndex];
      const stateBusinesses = stateGroups[stateName];
      
      console.log(`\n⏸️ About to process state: ${stateName} (${stateBusinesses.length} businesses)`);
      console.log(`⏸️ Press Enter to continue or type 'skip' to skip this state...`);
      
      // In a real browser environment, you'd want to pause here for user input
      // For now, we'll add a small delay and continue
      await this.delay(1000);
      
      const stateResult = await this.downloadLogosForState(
        stateName, 
        stateBusinesses, 
        stateIndex, 
        sortedStates.length
      );
      
      this.stats.stateResults.push(stateResult);
      
      // Pause between states (longer delay)
      if (stateIndex < sortedStates.length - 1) {
        console.log(`\n⏸️ Pausing 3 seconds before next state...`);
        await this.delay(3000);
      }
    }
    
    this.stats.endTime = new Date();
    console.log('\n🎉 ALL STATES COMPLETED!');
    this.showStateByStateResults();
  }

  // Show enhanced results with statistics
  showEnhancedResults() {
    const duration = this.stats.endTime - this.stats.startTime;
    const durationMinutes = Math.round(duration / 60000 * 10) / 10;
    const avgTimePerBusiness = Math.round(duration / this.stats.total);
    
    console.log('\n🎯 FINAL RESULTS:');
    console.log('='.repeat(50));
    console.log(`📊 Total Businesses: ${this.stats.total}`);
    console.log(`✅ Successfully Downloaded: ${this.stats.successful} (${Math.round(this.stats.successful/this.stats.total*100)}%)`);
    console.log(`❌ Failed: ${this.stats.failed} (${Math.round(this.stats.failed/this.stats.total*100)}%)`);
    console.log(`⚠️ Skipped: ${this.stats.skipped} (${Math.round(this.stats.skipped/this.stats.total*100)}%)`);
    console.log(`⏰ Total Time: ${durationMinutes} minutes`);
    console.log(`📈 Avg Time per Business: ${avgTimePerBusiness}ms`);
    
    if (this.downloadedLogos.length > 0) {
      console.log('\n💾 DOWNLOADED LOGOS:');
      
      // Group by service
      const serviceGroups = {};
      this.downloadedLogos.forEach(logo => {
        if (!serviceGroups[logo.service]) {
          serviceGroups[logo.service] = [];
        }
        serviceGroups[logo.service].push(logo);
      });
      
      Object.entries(serviceGroups).forEach(([service, logos]) => {
        console.log(`📡 ${service}: ${logos.length} logos`);
        logos.slice(0, 5).forEach((logo, index) => {
          console.log(`   ${index + 1}. ${logo.business.name} - ${logo.filename}`);
        });
        if (logos.length > 5) {
          console.log(`   ... and ${logos.length - 5} more`);
        }
      });
      
      console.log('\n🎯 NEXT STEPS:');
      console.log('1. Run: await downloader.saveAllLogos() - to trigger browser downloads');
      console.log('2. Run: downloader.getDownloadUrls() - to get download URLs');
      console.log('3. Run: await downloader.uploadToServer() - to save to your server');
      console.log('4. Run: downloader.generateReport() - to get detailed CSV report');
    }
    
    if (this.failedDownloads.length > 0) {
      console.log('\n❌ FAILED DOWNLOADS:');
      this.failedDownloads.slice(0, 10).forEach((failed, index) => {
        console.log(`${index + 1}. ${failed.business} (${failed.domain}) - ${failed.reason}`);
      });
      if (this.failedDownloads.length > 10) {
        console.log(`... and ${this.failedDownloads.length - 10} more failures`);
      }
      console.log('Run: downloader.showFailedDownloads() - to see all failures');
    }
    
    if (this.skippedBusinesses.length > 0) {
      console.log('\n⚠️ SKIPPED BUSINESSES:');
      this.skippedBusinesses.slice(0, 5).forEach((skipped, index) => {
        console.log(`${index + 1}. ${skipped.business} - ${skipped.reason}`);
      });
      if (this.skippedBusinesses.length > 5) {
        console.log(`... and ${this.skippedBusinesses.length - 5} more skipped`);
      }
    }
  }

  // Show state-by-state results
  showStateByStateResults() {
    const duration = this.stats.endTime - this.stats.startTime;
    const durationMinutes = Math.round(duration / 60000 * 10) / 10;
    
    console.log(`\n🎯 STATE-BY-STATE FINAL RESULTS:`);
    console.log('='.repeat(60));
    console.log(`🌍 Total Businesses: ${this.stats.total}`);
    console.log(`✅ Successfully Downloaded: ${this.stats.successful} (${Math.round(this.stats.successful/this.stats.total*100)}%)`);
    console.log(`❌ Failed: ${this.stats.failed} (${Math.round(this.stats.failed/this.stats.total*100)}%)`);
    console.log(`⚠️ Skipped: ${this.stats.skipped} (${Math.round(this.stats.skipped/this.stats.total*100)}%)`);
    console.log(`⏰ Total Time: ${durationMinutes} minutes`);
    
    if (this.stats.stateResults && this.stats.stateResults.length > 0) {
      console.log(`\n📊 RESULTS BY STATE:`);
      console.log('-'.repeat(60));
      
      this.stats.stateResults
        .sort((a, b) => b.successful - a.successful) // Sort by success count
        .forEach((stateResult, index) => {
          const successRate = Math.round(stateResult.successful / stateResult.total * 100);
          const duration = (stateResult.endTime - stateResult.startTime) / 1000;
          
          console.log(`${index + 1}. 🏛️ ${stateResult.state}: ${stateResult.successful}/${stateResult.total} (${successRate}%) in ${Math.round(duration)}s`);
        });
    }
    
    if (this.downloadedLogos.length > 0) {
      console.log('\n💾 DOWNLOADED LOGOS BY SERVICE:');
      
      // Group by service
      const serviceGroups = {};
      this.downloadedLogos.forEach(logo => {
        if (!serviceGroups[logo.service]) {
          serviceGroups[logo.service] = [];
        }
        serviceGroups[logo.service].push(logo);
      });
      
      Object.entries(serviceGroups).forEach(([service, logos]) => {
        console.log(`📡 ${service}: ${logos.length} logos`);
      });
      
      console.log('\n🎯 NEXT STEPS:');
      console.log('1. Run: await downloader.saveAllLogos() - to download all logos');
      console.log('2. Run: downloader.generateReport() - to get detailed CSV report');
      console.log('3. Run: await downloader.uploadToServer() - to upload to server');
      console.log('4. Run: downloader.showStateDetails("CA") - to see specific state results');
    }
    
    if (this.failedDownloads.length > 0) {
      console.log(`\n❌ FAILED DOWNLOADS: ${this.failedDownloads.length} total`);
      console.log('Run: downloader.showFailedDownloads() - to see all failures');
      console.log('Run: await downloader.retryFailedDownloads() - to retry failed ones');
    }
  }

  // Legacy function for backward compatibility
  showResults() {
    if (this.stats.stateResults && this.stats.stateResults.length > 0) {
      this.showStateByStateResults();
    } else {
      this.showEnhancedResults();
    }
  }

  // Trigger browser downloads for all logos
  async saveAllLogos() {
    console.log('💾 Triggering browser downloads...');
    
    for (const logo of this.downloadedLogos) {
      const url = URL.createObjectURL(logo.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = logo.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      await this.delay(100); // Small delay between downloads
    }
    
    console.log(`✅ Triggered ${this.downloadedLogos.length} downloads`);
  }

  // Get download URLs for logos
  getDownloadUrls() {
    console.log('🔗 Creating download URLs...');
    
    const urls = this.downloadedLogos.map(logo => ({
      business: logo.business.name,
      filename: logo.filename,
      url: URL.createObjectURL(logo.blob)
    }));
    
    console.table(urls);
    return urls;
  }

  // Upload logos to your server (requires API endpoint)
  async uploadToServer() {
    console.log('📤 Uploading logos to server...');
    
    if (!this.downloadedLogos.length) {
      console.log('❌ No logos to upload');
      return;
    }
    
    let uploaded = 0;
    
    for (const logo of this.downloadedLogos) {
      try {
        const formData = new FormData();
        formData.append('logo', logo.blob, logo.filename);
        formData.append('businessId', logo.business.id);
        formData.append('businessName', logo.business.name);
        
        const response = await fetch(`${this.apiBase}/api/upload-logo`, {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          uploaded++;
          console.log(`✅ Uploaded ${logo.business.name}`);
        } else {
          console.log(`❌ Failed to upload ${logo.business.name}: ${response.statusText}`);
        }
        
      } catch (error) {
        console.log(`❌ Error uploading ${logo.business.name}: ${error.message}`);
      }
      
      await this.delay(500);
    }
    
    console.log(`🎉 Uploaded ${uploaded}/${this.downloadedLogos.length} logos to server`);
  }

  // Utility functions
  sanitizeFilename(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  getFileExtension(mimeType) {
    const mimeToExt = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg', 
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'image/webp': 'webp',
      'image/x-icon': 'ico',
      'image/vnd.microsoft.icon': 'ico'
    };
    
    return mimeToExt[mimeType] || 'png';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility: Show detailed failed downloads
  showFailedDownloads() {
    console.log('\n❌ ALL FAILED DOWNLOADS:');
    this.failedDownloads.forEach((failed, index) => {
      console.log(`${index + 1}. ${failed.business}`);
      console.log(`   Domain: ${failed.domain}`);
      console.log(`   Reason: ${failed.reason}`);
      console.log(`   Retries: ${failed.retries || 0}`);
      console.log('---');
    });
  }

  // Utility: Generate CSV report
  generateReport() {
    const csvData = [];
    
    // Headers
    csvData.push(['Business Name', 'Domain', 'Status', 'Service', 'Filename', 'Download Time', 'Reason']);
    
    // Downloaded logos
    this.downloadedLogos.forEach(logo => {
      csvData.push([
        logo.business.name,
        logo.domain,
        'Success',
        logo.service,
        logo.filename,
        logo.downloadTime,
        ''
      ]);
    });
    
    // Failed downloads
    this.failedDownloads.forEach(failed => {
      csvData.push([
        failed.business,
        failed.domain || '',
        'Failed',
        '',
        '',
        '',
        failed.reason
      ]);
    });
    
    // Skipped businesses
    this.skippedBusinesses.forEach(skipped => {
      csvData.push([
        skipped.business,
        '',
        'Skipped',
        '',
        '',
        '',
        skipped.reason
      ]);
    });
    
    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
    
    // Create downloadable file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logo_download_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📄 CSV report downloaded!');
    return csvData;
  }

  // Utility: Retry failed downloads
  async retryFailedDownloads() {
    if (this.failedDownloads.length === 0) {
      console.log('✅ No failed downloads to retry');
      return;
    }
    
    console.log(`🔄 Retrying ${this.failedDownloads.length} failed downloads...`);
    
    const businessesToRetry = this.failedDownloads.map(failed => ({
      name: failed.business,
      domain: failed.domain
    }));
    
    // Clear failed downloads for fresh retry
    this.failedDownloads = [];
    
    for (const business of businessesToRetry) {
      console.log(`🔄 Retrying ${business.name}...`);
      await this.downloadBusinessLogo(business);
      await this.delay(this.rateLimitDelay);
    }
    
    console.log('🎉 Retry completed!');
    this.showResults();
  }

  // Utility: Show details for a specific state
  showStateDetails(stateName) {
    if (!this.stats.stateResults) {
      console.log('❌ No state results available. Run downloadAllMissingLogos() first.');
      return;
    }
    
    const stateResult = this.stats.stateResults.find(sr => sr.state === stateName);
    
    if (!stateResult) {
      console.log(`❌ State "${stateName}" not found. Available states:`);
      this.stats.stateResults.forEach(sr => console.log(`  - ${sr.state}`));
      return;
    }
    
    console.log(`\n🏛️ DETAILED RESULTS FOR ${stateName}:`);
    console.log('='.repeat(40));
    console.log(`📊 Total Businesses: ${stateResult.total}`);
    console.log(`✅ Downloaded: ${stateResult.successful}`);
    console.log(`❌ Failed: ${stateResult.failed}`);
    console.log(`⚠️ Skipped: ${stateResult.skipped}`);
    console.log(`📈 Success Rate: ${Math.round(stateResult.successful/stateResult.total*100)}%`);
    console.log(`⏰ Duration: ${Math.round((stateResult.endTime - stateResult.startTime)/1000)}s`);
    
    // Show logos downloaded for this state
    const stateLogos = this.downloadedLogos.filter(logo => 
      logo.business.state === stateName || 
      logo.business.address?.includes(stateName)
    );
    
    if (stateLogos.length > 0) {
      console.log(`\n💾 DOWNLOADED LOGOS (${stateLogos.length}):`);
      stateLogos.forEach((logo, index) => {
        console.log(`${index + 1}. ${logo.business.name} (${logo.service})`);
      });
    }
    
    // Show failed downloads for this state
    const stateFailed = this.failedDownloads.filter(failed => 
      failed.business.includes(stateName) || // Simple check, could be improved
      failed.domain?.includes(stateName)
    );
    
    if (stateFailed.length > 0) {
      console.log(`\n❌ FAILED DOWNLOADS (${stateFailed.length}):`);
      stateFailed.forEach((failed, index) => {
        console.log(`${index + 1}. ${failed.business} - ${failed.reason}`);
      });
    }
  }

  // Utility: Process only specific state
  async downloadLogosForSpecificState(stateName) {
    console.log(`🎯 Fetching businesses for state: ${stateName}`);
    
    // Fetch all businesses first
    const allBusinesses = await this.fetchBusinesses();
    const businessesNeedingLogos = await this.checkForMissingLogos(allBusinesses);
    
    // Group by state and find the specific state
    const { stateGroups } = this.groupBusinessesByState(businessesNeedingLogos);
    
    if (!stateGroups[stateName]) {
      console.log(`❌ No businesses found for state: ${stateName}`);
      console.log('Available states:', Object.keys(stateGroups));
      return;
    }
    
    const stateBusinesses = stateGroups[stateName];
    console.log(`Found ${stateBusinesses.length} businesses needing logos in ${stateName}`);
    
    // Initialize stats
    this.stats.total = stateBusinesses.length;
    this.stats.startTime = new Date();
    this.stats.stateResults = [];
    
    // Process just this state
    const stateResult = await this.downloadLogosForState(stateName, stateBusinesses, 0, 1);
    this.stats.stateResults.push(stateResult);
    this.stats.endTime = new Date();
    
    console.log('\n🎉 STATE PROCESSING COMPLETED!');
    this.showStateByStateResults();
  }
}

// Global functions for easy console use
let downloader = null;

async function downloadMissingLogos(limit = 200) {
  console.log(`🎨 VoteWithYourWallet Logo Downloader Starting (${limit} businesses max)...`);
  
  try {
    // Initialize downloader
    downloader = new BusinessLogoDownloader();
    
    // Fetch all businesses
    const allBusinesses = await downloader.fetchBusinesses();
    
    if (allBusinesses.length === 0) {
      console.log('❌ No businesses found. Check your API endpoint.');
      return;
    }
    
    console.log(`📊 Total businesses in database: ${allBusinesses.length}`);
    
    // Check which ones need logos (limit the checking process too)
    console.log(`🔍 Checking first ${Math.min(limit * 2, allBusinesses.length)} businesses for missing logos...`);
    const businessesToCheck = allBusinesses.slice(0, limit * 2); // Check double the limit to ensure we find enough
    const businessesNeedingLogos = await downloader.checkForMissingLogos(businessesToCheck);
    
    if (businessesNeedingLogos.length === 0) {
      console.log('🎉 No businesses need logos in the checked batch!');
      console.log('💡 Try increasing the limit or all businesses already have logos.');
      return;
    }
    
    // Limit to requested number
    const businessesToProcess = businessesNeedingLogos.slice(0, limit);
    
    console.log(`📋 Found ${businessesNeedingLogos.length} businesses needing logos`);
    console.log(`🎯 Processing ${businessesToProcess.length} businesses (limited to ${limit})`);
    
    if (businessesNeedingLogos.length > limit) {
      console.log(`⏳ Remaining ${businessesNeedingLogos.length - limit} businesses will be processed in next run`);
    }
    
    // Download logos for the limited set
    await downloader.downloadAllMissingLogos(businessesToProcess);
    
  } catch (error) {
    console.error('❌ Error in logo download process:', error);
  }
}

// Quick test function
async function testLogoDownload(businessName = 'Starbucks') {
  console.log(`🧪 Testing logo download for: ${businessName}`);
  
  downloader = new BusinessLogoDownloader();
  
  const testBusiness = {
    id: 1,
    name: businessName,
    website: businessName.toLowerCase() + '.com'
  };
  
  const result = await downloader.downloadBusinessLogo(testBusiness);
  
  if (result) {
    console.log('✅ Test successful! Logo downloaded.');
    console.log('Run: await downloader.saveAllLogos() to save it');
  } else {
    console.log('❌ Test failed. Check console for errors.');
  }
}

// Process specific state only
async function downloadLogosForState(stateName) {
  console.log(`🏛️ Processing logos for state: ${stateName}`);
  
  if (!downloader) {
    downloader = new BusinessLogoDownloader();
  }
  
  await downloader.downloadLogosForSpecificState(stateName);
}

// Show states available (limited check)
async function showAvailableStates(limit = 400) {
  console.log(`🗺️ Checking available states (checking first ${limit} businesses)...`);
  
  if (!downloader) {
    downloader = new BusinessLogoDownloader();
  }
  
  const allBusinesses = await downloader.fetchBusinesses();
  console.log(`📊 Total businesses in database: ${allBusinesses.length}`);
  
  // Check a limited set of businesses to avoid overwhelming the system
  const businessesToCheck = allBusinesses.slice(0, limit);
  console.log(`🔍 Checking first ${businessesToCheck.length} businesses for missing logos...`);
  
  const businessesNeedingLogos = await downloader.checkForMissingLogos(businessesToCheck);
  const { stateGroups } = downloader.groupBusinessesByState(businessesNeedingLogos);
  
  console.log(`\n🗺️ STATES WITH BUSINESSES NEEDING LOGOS:`);
  console.log(`(Based on first ${businessesToCheck.length} businesses checked)`);
  console.log('-'.repeat(50));
  
  const sortedStates = Object.entries(stateGroups)
    .sort((a, b) => b[1].length - a[1].length) // Sort by business count
    .filter(([state]) => state !== 'Unknown'); // Show real states first
  
  let totalNeeded = 0;
  sortedStates.forEach(([state, businesses], index) => {
    console.log(`${index + 1}. ${state}: ${businesses.length} businesses needing logos`);
    totalNeeded += businesses.length;
  });
  
  // Show Unknown last if it exists
  if (stateGroups['Unknown']) {
    console.log(`${sortedStates.length + 1}. Unknown: ${stateGroups['Unknown'].length} businesses needing logos`);
    totalNeeded += stateGroups['Unknown'].length;
  }
  
  console.log('-'.repeat(50));
  console.log(`📊 Total businesses needing logos: ${totalNeeded}`);
  
  if (allBusinesses.length > limit) {
    console.log(`⚠️ Note: Only checked first ${limit} businesses. There may be more.`);
  }
  
  console.log('\n💡 Usage:');
  console.log('- await downloadMissingLogos(200) - Process 200 businesses max');
  console.log('- await downloadLogosForState("CA") - Process specific state only');
  console.log('- await downloadMissingLogos(50) - Process only 50 businesses');
}

// Export for global use
window.downloadMissingLogos = downloadMissingLogos;
window.testLogoDownload = testLogoDownload;
window.downloadLogosForState = downloadLogosForState;
window.showAvailableStates = showAvailableStates;
window.BusinessLogoDownloader = BusinessLogoDownloader;

console.log(`
🎨 VoteWithYourWallet State-by-State Logo Downloader v2.1 Loaded!

✅ CORS Issues Fixed - Uses server-side proxy
✅ Rate Limiting Implemented - Respects service limits  
✅ Retry Logic Added - Auto-retries failed downloads
✅ State-by-State Processing - Organized by state, business by business
✅ Limited Batches - Process only 200 businesses at a time (manageable!)
✅ Enhanced Progress Tracking - State and overall progress

📋 Main Commands (200 businesses max per run):
  await downloadMissingLogos()           - Process 200 businesses, state by state
  await downloadMissingLogos(100)        - Process 100 businesses max
  await downloadLogosForState("CA")      - Process specific state only
  await showAvailableStates()            - See which states have businesses needing logos
  await testLogoDownload('Nike')         - Test with single business
  
🏛️ State-Specific Operations:
  downloader.showStateDetails("CA")      - Detailed results for specific state
  downloader.showStateByStateResults()   - Summary of all state results
  
📊 Progress & Results:
  downloader.generateReport()            - Download CSV report with state info
  downloader.showFailedDownloads()       - Show all failures
  await downloader.retryFailedDownloads() - Retry failed ones

💾 Save & Upload:
  await downloader.saveAllLogos()        - Save all to browser downloads
  await downloader.uploadToServer()      - Upload to your server

🚀 Ready to start! 
   - Run: await showAvailableStates() to see what's available
   - Run: await downloadMissingLogos() to process 200 businesses
   - Run: await downloadMissingLogos(50) to process just 50 businesses
   - Run multiple times to process all your businesses in batches!
`);
