import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, createSession, createJWT, AuthError } from '../../utils/auth';

interface LoginRequest {
  email: string;
  password: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password }: LoginRequest = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Authenticate user
    const user = await authenticateUser(email, password);

    // Create session
    const sessionId = await createSession(user.id);

    // Create JWT token
    const token = await createJWT({
      userId: user.id,
      sessionId,
      email: user.email,
    });

    // Set secure HTTP-only cookie
    res.setHeader('Set-Cookie', `auth-token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`);

    // Return user data (without sensitive info)
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof AuthError) {
      return res.status(401).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
}