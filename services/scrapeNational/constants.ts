// Tier execution configurations for national business scraping
export const TIER_EXECUTION_ORDER = [
  {
    tier: 1,
    name: 'Tier 1',
    states: ['California', 'Texas', 'Florida', 'New York', 'Pennsylvania'],
    target: 500,
    description: 'Top 5 States (500 businesses minimum each)'
  },
  {
    tier: 2,
    name: 'Tier 2',
    states: ['Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'],
    target: 200,
    description: 'Top 6-10 States (200 businesses minimum each)'
  },
  {
    tier: 3,
    name: 'Tier 3',
    states: [
      'New Jersey', 'Virginia', 'Washington', 'Arizona', 'Tennessee',
      'Massachusetts', 'Indiana', 'Missouri', 'Maryland', 'Wisconsin',
      'Colorado', 'Minnesota', 'South Carolina', 'Alabama', 'Louisiana'
    ],
    target: 100,
    description: 'Top 11-25 States (100 businesses minimum each)'
  },
  {
    tier: 4,
    name: 'Tier 4',
    states: [
      'Kentucky', 'Oregon', 'Oklahoma', 'Connecticut', 'Utah', 'Iowa',
      'Nevada', 'Arkansas', 'Kansas', 'New Mexico', 'Nebraska', 'Idaho',
      'West Virginia', 'Hawaii', 'New Hampshire', 'Maine', 'Rhode Island',
      'Montana', 'Delaware', 'South Dakota', 'North Dakota', 'Alaska',
      'Vermont', 'Wyoming'
    ],
    target: 50,
    description: 'Remaining 25 States (50 businesses minimum each)'
  }
];

// Default scraping configuration
export const DEFAULT_SCRAPING_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  batchSize: 10,
  rateLimitDelay: 2000,
  maxConcurrent: 5
};

// Scraping timeouts and delays
export const SCRAPING_DELAYS = {
  betweenBatches: 1000,
  betweenTiers: 10000,
  requestTimeout: 10000
};

// Search engine configurations
export const SEARCH_ENGINES = {
  google: {
    name: 'Google',
    baseUrl: 'https://www.google.com/search',
    searchParam: 'q'
  },
  bing: {
    name: 'Bing',
    baseUrl: 'https://www.bing.com/search',
    searchParam: 'q'
  },
  yahoo: {
    name: 'Yahoo',
    baseUrl: 'https://search.yahoo.com/search',
    searchParam: 'p'
  }
};

// Business directory configurations
export const BUSINESS_DIRECTORIES = {
  yellowpages: {
    name: 'Yellow Pages',
    baseUrl: 'https://www.yellowpages.com/search',
    searchParam: 'search_terms',
    locationParam: 'geo_location_terms'
  },
  yelp: {
    name: 'Yelp',
    baseUrl: 'https://www.yelp.com/search',
    searchParam: 'find_desc',
    locationParam: 'find_loc'
  },
  manta: {
    name: 'Manta',
    baseUrl: 'https://www.manta.com/search',
    searchParam: 'q',
    locationParam: 'loc'
  }
};

// Data quality thresholds
export const DATA_QUALITY_THRESHOLDS = {
  minimum: 50,
  good: 75,
  excellent: 90
};

// Business search limits
export const SEARCH_LIMITS = {
  resultsPerSearch: 5,
  maxBusinessesPerState: 1000,
  maxRetries: 3
};

// User agent strings for rotation
export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
];

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred while scraping',
  PARSING_ERROR: 'Error parsing HTML content',
  RATE_LIMIT_ERROR: 'Rate limit exceeded, please wait before retrying',
  TIMEOUT_ERROR: 'Request timed out',
  UNKNOWN_ERROR: 'Unknown error occurred during scraping'
};