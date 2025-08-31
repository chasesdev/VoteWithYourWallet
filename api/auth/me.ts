import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyJWT, getSession, getUserById } from '../../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🔍 [AUTH/ME] Request started');
  console.log('🔍 [AUTH/ME] Method:', req.method);
  console.log('🔍 [AUTH/ME] Environment check - TURSO_DATABASE_URL:', !!process.env.TURSO_DATABASE_URL);
  console.log('🔍 [AUTH/ME] Environment check - TURSO_AUTH_TOKEN:', !!process.env.TURSO_AUTH_TOKEN);
  console.log('🔍 [AUTH/ME] Environment check - JWT_SECRET:', !!process.env.JWT_SECRET);

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔍 [AUTH/ME] OPTIONS request handled');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    console.log('🔍 [AUTH/ME] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 [AUTH/ME] Starting authentication check');
    
    // Get token from cookie
    const token = req.cookies['auth-token'];
    console.log('🔍 [AUTH/ME] Token present:', !!token);
    
    if (!token) {
      console.log('🔍 [AUTH/ME] No token provided - returning 401');
      return res.status(401).json({ error: 'No authentication token' });
    }

    console.log('🔍 [AUTH/ME] Verifying JWT token');
    // Verify JWT
    const payload = verifyJWT(token);
    console.log('🔍 [AUTH/ME] JWT verified, payload:', { userId: payload.userId, sessionId: payload.sessionId });
    
    if (!payload.userId || !payload.sessionId) {
      console.log('🔍 [AUTH/ME] Invalid token payload');
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    console.log('🔍 [AUTH/ME] Getting session for sessionId:', payload.sessionId);
    // Verify session is still valid
    const session = await getSession(payload.sessionId);
    console.log('🔍 [AUTH/ME] Session retrieved:', !!session);
    
    if (!session || session.userId !== payload.userId) {
      console.log('🔍 [AUTH/ME] Session invalid or user mismatch');
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    console.log('🔍 [AUTH/ME] Getting user by ID:', payload.userId);
    // Get user data
    const user = await getUserById(payload.userId);
    console.log('🔍 [AUTH/ME] User retrieved:', !!user);
    
    if (!user) {
      console.log('🔍 [AUTH/ME] User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('🔍 [AUTH/ME] Authentication successful');
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
    console.error('❌ [AUTH/ME] Auth check error:', error);
    console.error('❌ [AUTH/ME] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ [AUTH/ME] Error message:', error instanceof Error ? error.message : String(error));
    
    // Clear invalid token
    res.setHeader('Set-Cookie', `auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`);
    
    res.status(500).json({ 
      error: 'Authentication failed',
      debug: process.env.NODE_ENV !== 'production' ? {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      } : undefined
    });
  }
}