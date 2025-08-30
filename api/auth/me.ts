import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyJWT, getSession, getUserById } from '../../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from cookie
    const token = req.cookies['auth-token'];
    
    if (!token) {
      return res.status(401).json({ error: 'No authentication token' });
    }

    // Verify JWT
    const payload = await verifyJWT(token);
    
    if (!payload.userId || !payload.sessionId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Verify session is still valid
    const session = await getSession(payload.sessionId);
    
    if (!session || session.userId !== payload.userId) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    // Get user data
    const user = await getUserById(payload.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user data (without sensitive info)
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error('Auth check error:', error);
    
    // Clear invalid token
    res.setHeader('Set-Cookie', `auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`);
    
    res.status(401).json({ error: 'Authentication failed' });
  }
}