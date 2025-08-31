import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyJWT, getSession, deleteSession } from '../../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    // Get token from cookie
    const token = req.cookies['auth-token'];
    
    if (token) {
      try {
        // Verify JWT and get session info
        const payload = verifyJWT(token);
        
        if (payload.sessionId) {
          // Delete the session from database
          await deleteSession(payload.sessionId);
          console.log(`✅ Session deleted: ${payload.sessionId}`);
        }
      } catch (error) {
        // Token invalid, but that's OK for logout
        console.log('Token invalid during logout (expected)');
      }
    }

    // Clear auth cookie
    res.setHeader('Set-Cookie', 
      'auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
    );

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error: any) {
    console.error('Logout API error:', error);
    
    // Even if there's an error, clear the cookie
    res.setHeader('Set-Cookie', 
      'auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
    );
    
    return res.status(200).json({
      success: true,
      message: 'Logout completed'
    });
  }
}