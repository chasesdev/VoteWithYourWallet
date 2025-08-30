import { NextApiRequest, NextApiResponse } from 'next';
import { verifyJWT, getSession, getUserById, User } from './auth';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: User;
  session?: {
    userId: number;
    sessionId: string;
    expiresAt: Date;
  };
}

export type AuthenticatedApiHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void> | void;

/**
 * Middleware to authenticate API requests
 * Adds user and session data to the request object if authentication is valid
 */
export function withAuth(handler: AuthenticatedApiHandler) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Get token from cookie
      const token = req.cookies['auth-token'];
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify JWT
      const payload = await verifyJWT(token);
      
      if (!payload.userId || !payload.sessionId) {
        return res.status(401).json({ error: 'Invalid authentication token' });
      }

      // Verify session is still valid
      const session = await getSession(payload.sessionId);
      
      if (!session || session.userId !== payload.userId) {
        // Clear invalid token
        res.setHeader('Set-Cookie', `auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`);
        return res.status(401).json({ error: 'Session expired' });
      }

      // Get user data
      const user = await getUserById(payload.userId);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Add user and session to request
      req.user = user;
      req.session = session;

      // Call the handler
      return handler(req, res);

    } catch (error) {
      console.error('Auth middleware error:', error);
      
      // Clear invalid token
      res.setHeader('Set-Cookie', `auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`);
      
      return res.status(401).json({ error: 'Authentication failed' });
    }
  };
}

/**
 * Middleware for optional authentication
 * Adds user data to request if authenticated, but doesn't block unauthenticated requests
 */
export function withOptionalAuth(handler: AuthenticatedApiHandler) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Get token from cookie
      const token = req.cookies['auth-token'];
      
      if (token) {
        try {
          // Verify JWT
          const payload = await verifyJWT(token);
          
          if (payload.userId && payload.sessionId) {
            // Verify session
            const session = await getSession(payload.sessionId);
            
            if (session && session.userId === payload.userId) {
              // Get user data
              const user = await getUserById(payload.userId);
              
              if (user) {
                req.user = user;
                req.session = session;
              }
            }
          }
        } catch (error) {
          // Invalid token - clear it but don't block request
          res.setHeader('Set-Cookie', `auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`);
        }
      }

      // Call handler regardless of auth status
      return handler(req, res);

    } catch (error) {
      console.error('Optional auth middleware error:', error);
      // Continue to handler even if auth check fails
      return handler(req, res);
    }
  };
}