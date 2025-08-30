import { NextApiRequest, NextApiResponse } from 'next';
import { createUser, createSession, createJWT, AuthError, validateEmail, validatePassword } from '../../utils/auth';

interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name }: SignupRequest = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password requirements not met',
        details: passwordValidation.errors 
      });
    }

    // Validate name length
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    // Create user
    const user = await createUser(email, password, name.trim());

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
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof AuthError) {
      if (error.code === 'USER_EXISTS') {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
}