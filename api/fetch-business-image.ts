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

  const { query: businessName, category, type = 'business' } = req.query;

  if (!businessName) {
    return res.status(400).json({ error: 'Business name parameter is required' });
  }

  // Free image APIs with CORS support for business images
  const imageServices = [
    {
      name: 'unsplash',
      url: `https://api.unsplash.com/photos/random?query=${encodeURIComponent(businessName as string)} ${category || 'business'}&orientation=landscape&w=800&h=600`,
      headers: { 
        'User-Agent': 'VoteWithYourWallet/1.0',
        'Accept': 'application/json'
      },
      extractImage: true,
      free: true
    },
    {
      name: 'pixabay',
      url: `https://pixabay.com/api/?key=your_pixabay_key&q=${encodeURIComponent(businessName as string)}&image_type=photo&orientation=horizontal&category=business&per_page=3`,
      headers: { 'User-Agent': 'VoteWithYourWallet/1.0' },
      extractImage: true,
      requiresKey: true
    },
    {
      name: 'pexels',
      url: `https://api.pexels.com/v1/search?query=${encodeURIComponent(businessName as string)} ${category || 'business'}&per_page=1&orientation=landscape`,
      headers: { 
        'User-Agent': 'VoteWithYourWallet/1.0',
        'Authorization': 'your_pexels_key'
      },
      extractImage: true,
      requiresKey: true
    }
  ];

  // Generic business placeholder services (no API key required)
  const placeholderServices = [
    {
      name: 'picsum-business',
      url: `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`,
      headers: { 'User-Agent': 'VoteWithYourWallet/1.0' }
    },
    {
      name: 'placeholder-business',
      url: `https://via.placeholder.com/800x600/4a90e2/ffffff?text=${encodeURIComponent((businessName as string).substring(0, 20))}`,
      headers: { 'User-Agent': 'VoteWithYourWallet/1.0' }
    },
    {
      name: 'dummyimage-business',
      url: `https://dummyimage.com/800x600/cccccc/969696.png&text=${encodeURIComponent((businessName as string).substring(0, 15))}`,
      headers: { 'User-Agent': 'VoteWithYourWallet/1.0' }
    }
  ];

  console.log(`🔍 Fetching business image for: ${businessName} (category: ${category})`);

  // Try image APIs first (if we had API keys)
  for (const service of imageServices.filter(s => !s.requiresKey)) {
    try {
      console.log(`  🔗 Trying ${service.name}: ${service.url}`);
      
      const response = await fetch(service.url, {
        method: 'GET',
        headers: service.headers,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        if (service.extractImage) {
          try {
            const data = await response.json();
            let imageUrl: string | null = null;

            // Extract image URL based on service
            if (service.name === 'unsplash') {
              imageUrl = data.urls?.regular || data.urls?.small;
            } else if (service.name === 'pixabay') {
              imageUrl = data.hits?.[0]?.webformatURL;
            } else if (service.name === 'pexels') {
              imageUrl = data.photos?.[0]?.src?.large || data.photos?.[0]?.src?.medium;
            }

            if (imageUrl) {
              console.log(`  🔄 Fetching image from ${service.name}: ${imageUrl}`);
              const imageResponse = await fetch(imageUrl, {
                headers: { 'User-Agent': 'VoteWithYourWallet/1.0' },
                signal: AbortSignal.timeout(10000)
              });

              if (imageResponse.ok) {
                const buffer = await imageResponse.arrayBuffer();
                const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

                if (contentType.startsWith('image/') && buffer.byteLength > 100 && buffer.byteLength < 10000000) {
                  console.log(`  ✅ Success with ${service.name} (${buffer.byteLength} bytes)`);
                  
                  // Set response headers
                  res.setHeader('Content-Type', contentType);
                  res.setHeader('Content-Length', buffer.byteLength.toString());
                  res.setHeader('X-Image-Service', service.name);
                  res.setHeader('X-Image-Size', buffer.byteLength.toString());
                  res.setHeader('X-Business-Name', businessName as string);
                  res.setHeader('X-Image-Type', 'photo');
                  res.setHeader('X-Image-URL', imageUrl);
                  
                  // Cache for 4 hours
                  res.setHeader('Cache-Control', 'public, max-age=14400');
                  
                  return res.status(200).end(Buffer.from(buffer));
                }
              }
            }
          } catch (jsonError) {
            console.log(`  ❌ JSON parsing error from ${service.name}: ${jsonError.message}`);
          }
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

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Fall back to placeholder services
  console.log(`  🔄 Falling back to placeholder services for: ${businessName}`);
  
  for (const service of placeholderServices) {
    try {
      console.log(`  🔗 Trying placeholder ${service.name}: ${service.url}`);
      
      const response = await fetch(service.url, {
        method: 'GET',
        headers: service.headers,
        signal: AbortSignal.timeout(5000) // 5 second timeout for placeholders
      });

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/png';
        
        if (contentType.startsWith('image/') && buffer.byteLength > 100) {
          console.log(`  ✅ Success with placeholder ${service.name} (${buffer.byteLength} bytes)`);
          
          // Set response headers
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Length', buffer.byteLength.toString());
          res.setHeader('X-Image-Service', service.name);
          res.setHeader('X-Image-Size', buffer.byteLength.toString());
          res.setHeader('X-Business-Name', businessName as string);
          res.setHeader('X-Image-Type', 'placeholder');
          
          // Cache for 24 hours (placeholders are stable)
          res.setHeader('Cache-Control', 'public, max-age=86400');
          
          return res.status(200).end(Buffer.from(buffer));
        }
      }
    } catch (error) {
      console.log(`  ❌ Error from placeholder ${service.name}: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`  ❌ All services failed for business: ${businessName}`);
  
  // If all services fail, return a 404 with useful error information
  return res.status(404).json({ 
    error: 'No business image found',
    businessName,
    category,
    servicesAttempted: imageServices.length + placeholderServices.length,
    message: 'Unable to fetch business image from any available service'
  });
}