import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domain, businessName, website } = req.query;

  if (!domain) {
    return res.status(400).json({ error: 'Domain parameter is required' });
  }

  // Logo services to try in order of preference
  const logoServices = [
    {
      name: 'clearbit',
      url: `https://logo.clearbit.com/${domain}`,
      headers: { 'User-Agent': 'VoteWithYourWallet/1.0' }
    },
    {
      name: 'logodev',
      url: `https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ`,
      headers: { 'User-Agent': 'VoteWithYourWallet/1.0' }
    },
    {
      name: 'google-favicon-256',
      url: `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
      headers: { 'User-Agent': 'VoteWithYourWallet/1.0' }
    },
    {
      name: 'google-favicon-128',
      url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      headers: { 'User-Agent': 'VoteWithYourWallet/1.0' }
    }
  ];

  console.log(`🔍 Fetching logo for domain: ${domain} (business: ${businessName})`);

  for (const service of logoServices) {
    try {
      console.log(`  🔗 Trying ${service.name}: ${service.url}`);
      
      const response = await fetch(service.url, {
        method: 'GET',
        headers: service.headers,
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/png';
        
        // Validate that it's actually an image and has reasonable size
        if (contentType.startsWith('image/') && buffer.byteLength > 100 && buffer.byteLength < 5000000) { // 100 bytes to 5MB
          console.log(`  ✅ Success with ${service.name} (${buffer.byteLength} bytes, ${contentType})`);
          
          // Set response headers
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Length', buffer.byteLength.toString());
          res.setHeader('X-Logo-Service', service.name);
          res.setHeader('X-Logo-Size', buffer.byteLength.toString());
          res.setHeader('X-Logo-Domain', domain as string);
          
          if (businessName) {
            res.setHeader('X-Business-Name', businessName as string);
          }
          
          // Cache for 1 hour
          res.setHeader('Cache-Control', 'public, max-age=3600');
          
          // Return the image buffer
          return res.status(200).end(Buffer.from(buffer));
        } else {
          console.log(`  ❌ Invalid image from ${service.name}: ${contentType}, ${buffer.byteLength} bytes`);
        }
      } else {
        console.log(`  ❌ HTTP ${response.status} from ${service.name}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`  ⏰ Timeout from ${service.name}`);
      } else {
        console.log(`  ❌ Error from ${service.name}: ${error.message}`);
      }
    }

    // Small delay between services to be respectful
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`  ❌ All services failed for domain: ${domain}`);
  
  // If all services fail, return a 404 with useful error information
  return res.status(404).json({ 
    error: 'No logo found',
    domain,
    businessName,
    servicesAttempted: logoServices.length,
    message: 'Unable to fetch logo from any available service'
  });
}