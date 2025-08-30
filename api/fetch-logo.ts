import type { VercelRequest, VercelResponse } from '@vercel/node';

interface LogoService {
  name: string;
  url: (domain: string) => string;
  rateLimit: number; // requests per minute
  priority: number; // lower = higher priority
}

// Rate limiting storage (in production, use Redis or database)
const rateLimitStorage = new Map<string, { count: number; resetTime: number }>();

// Enhanced logo services with rate limiting info
const LOGO_SERVICES: LogoService[] = [
  {
    name: 'clearbit',
    url: (domain) => `https://logo.clearbit.com/${domain}`,
    rateLimit: 600, // 600 requests per minute
    priority: 1
  },
  {
    name: 'logodev',
    url: (domain) => `https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ`,
    rateLimit: 1000, // 1000 requests per minute  
    priority: 2
  },
  {
    name: 'google_favicon_256',
    url: (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
    rateLimit: 1000, // Conservative estimate
    priority: 3
  },
  {
    name: 'brandfetch',
    url: (domain) => `https://logo.brandfetch.com/${domain}`,
    rateLimit: 100, // Conservative estimate
    priority: 4
  },
  {
    name: 'google_favicon_128',
    url: (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    rateLimit: 1000, // Conservative estimate
    priority: 5
  },
  {
    name: 'duckduckgo_favicon',
    url: (domain) => `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    rateLimit: 500, // Conservative estimate
    priority: 6
  }
];

// Rate limiting check
function isRateLimited(serviceName: string, rateLimit: number): boolean {
  const key = `logo_service_${serviceName}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  const record = rateLimitStorage.get(key);
  
  if (!record || now > record.resetTime) {
    // Reset or initialize
    rateLimitStorage.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (record.count >= rateLimit) {
    return true; // Rate limited
  }
  
  // Increment count
  record.count++;
  rateLimitStorage.set(key, record);
  return false;
}

// Clean old rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStorage.entries()) {
    if (now > record.resetTime) {
      rateLimitStorage.delete(key);
    }
  }
}, 60000); // Clean every minute

// Fetch logo from a specific service
async function fetchLogoFromService(domain: string, service: LogoService): Promise<{ 
  success: boolean; 
  data?: Buffer; 
  contentType?: string; 
  error?: string; 
  size?: number;
}> {
  // Check rate limiting
  if (isRateLimited(service.name, service.rateLimit)) {
    return { 
      success: false, 
      error: `Rate limited for service ${service.name}. Try again later.` 
    };
  }
  
  try {
    const logoUrl = service.url(domain);
    
    const response = await fetch(logoUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'VoteWithYourWallet-LogoFetcher/1.0',
        'Accept': 'image/*',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText}` 
      };
    }
    
    const contentType = response.headers.get('content-type') || '';
    
    // Validate that it's actually an image
    if (!contentType.startsWith('image/')) {
      return { 
        success: false, 
        error: `Invalid content type: ${contentType}` 
      };
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Validate minimum size (avoid tiny placeholder images)
    if (buffer.length < 100) {
      return { 
        success: false, 
        error: `Image too small: ${buffer.length} bytes` 
      };
    }
    
    return {
      success: true,
      data: buffer,
      contentType,
      size: buffer.length
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Common domain mappings for business names
const DOMAIN_MAPPINGS: Record<string, string> = {
  'starbucks': 'starbucks.com',
  'mcdonalds': 'mcdonalds.com',
  'mcdonald\'s': 'mcdonalds.com',
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
  'coca-cola': 'coca-cola.com',
  'pepsi': 'pepsi.com',
  'facebook': 'facebook.com',
  'meta': 'meta.com',
  'twitter': 'twitter.com',
  'instagram': 'instagram.com',
  'netflix': 'netflix.com',
  'spotify': 'spotify.com',
  'uber': 'uber.com',
  'lyft': 'lyft.com',
  'airbnb': 'airbnb.com',
  'zoom': 'zoom.us',
  'slack': 'slack.com',
  'discord': 'discord.com',
  'pinterest': 'pinterest.com',
  'linkedin': 'linkedin.com',
  'reddit': 'reddit.com',
  'youtube': 'youtube.com',
  'twitch': 'twitch.tv'
};

// Extract domain from business name or website
function extractDomain(businessName: string, website?: string): string | null {
  // Try website field first
  if (website) {
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname.replace('www.', '');
    } catch (error) {
      // Invalid URL, continue with business name
    }
  }
  
  // Try common mappings
  const lowerName = businessName.toLowerCase().trim();
  
  // Direct mapping lookup
  for (const [key, domain] of Object.entries(DOMAIN_MAPPINGS)) {
    if (lowerName.includes(key)) {
      return domain;
    }
  }
  
  // Try to create domain from business name
  const cleanName = lowerName
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .replace(/(inc|corp|corporation|llc|ltd|co|company)$/, ''); // Remove business suffixes
  
  if (cleanName.length > 2 && cleanName.length < 20) {
    return `${cleanName}.com`;
  }
  
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    let domain: string | null = null;
    let businessName: string | undefined;
    let website: string | undefined;
    let serviceFilter: string | undefined;
    
    // Handle both GET and POST requests
    if (req.method === 'GET') {
      domain = req.query.domain as string;
      businessName = req.query.businessName as string;
      website = req.query.website as string;
      serviceFilter = req.query.service as string;
    } else {
      domain = req.body.domain;
      businessName = req.body.businessName;
      website = req.body.website;
      serviceFilter = req.body.service;
    }
    
    // Extract domain if not provided
    if (!domain && businessName) {
      domain = extractDomain(businessName, website);
    }
    
    if (!domain) {
      return res.status(400).json({ 
        error: 'Domain is required or could not be extracted from business name' 
      });
    }
    
    // Clean and validate domain
    domain = domain.toLowerCase().replace(/^www\./, '').trim();
    
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
      return res.status(400).json({ 
        error: 'Invalid domain format' 
      });
    }
    
    // Filter services if specified
    let services = LOGO_SERVICES;
    if (serviceFilter) {
      services = services.filter(s => s.name === serviceFilter);
      if (services.length === 0) {
        return res.status(400).json({ 
          error: `Unknown service: ${serviceFilter}. Available: ${LOGO_SERVICES.map(s => s.name).join(', ')}` 
        });
      }
    }
    
    // Sort by priority (lower number = higher priority)
    services = services.sort((a, b) => a.priority - b.priority);
    
    console.log(`🔍 Fetching logo for domain: ${domain}`);
    
    // Try each service in priority order
    const results = [];
    
    for (const service of services) {
      console.log(`  📡 Trying ${service.name}...`);
      
      const result = await fetchLogoFromService(domain, service);
      results.push({ service: service.name, ...result });
      
      if (result.success && result.data) {
        console.log(`  ✅ Success with ${service.name} (${result.size} bytes)`);
        
        // Return the logo data
        res.setHeader('Content-Type', result.contentType || 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        res.setHeader('X-Logo-Service', service.name);
        res.setHeader('X-Logo-Domain', domain);
        res.setHeader('X-Logo-Size', result.size?.toString() || '0');
        
        return res.send(result.data);
      }
      
      console.log(`  ❌ Failed with ${service.name}: ${result.error}`);
      
      // Small delay between services to be respectful
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // All services failed
    console.log(`❌ All services failed for domain: ${domain}`);
    
    return res.status(404).json({
      error: 'Logo not found',
      domain,
      attempts: results
    });
    
  } catch (error) {
    console.error('❌ Error in fetch-logo API:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}