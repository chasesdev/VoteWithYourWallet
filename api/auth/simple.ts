import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🔍 [AUTH-SIMPLE] Request started');
  
  try {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('🔍 [AUTH-SIMPLE] Basic checks passed');

    // Get token from cookie
    const token = req.cookies['auth-token'];
    
    if (!token) {
      console.log('🔍 [AUTH-SIMPLE] No token provided - returning 401');
      return res.status(401).json({ error: 'No authentication token' });
    }

    console.log('🔍 [AUTH-SIMPLE] Token present, length:', token.length);

    // Since we don't have a valid token to test with, just return a proper response
    return res.status(401).json({ 
      error: 'Invalid token', 
      debug: 'This endpoint is working - would normally validate the token'
    });

  } catch (error) {
    console.error('❌ [AUTH-SIMPLE] Error:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      debug: error instanceof Error ? error.message : String(error)
    });
  }
}