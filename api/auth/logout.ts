import { NextApiRequest, NextApiResponse } from 'next';
import { deleteSession, verifyJWT } from '../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from cookie
    const token = req.cookies['auth-token'];
    
    if (token) {
      try {
        // Verify and decode token
        const payload = await verifyJWT(token);
        
        // Delete session from database
        if (payload.sessionId) {
          await deleteSession(payload.sessionId);
        }
      } catch (error) {
        // Token invalid, but we'll still clear the cookie
        console.log('Invalid token during logout:', error);
      }
    }

    // Clear auth cookie
    res.setHeader('Set-Cookie', `auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}