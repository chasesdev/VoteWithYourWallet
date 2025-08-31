import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createUser, createSession, createJWT, validateEmail, validatePassword } from '../../utils/auth';

interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

interface SignupResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    email: string;
    name: string | null;
    isVerified: boolean;
  };
  token?: string;
  error?: string;
}

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
    const { name, email, password }: SignupRequest = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }

    // Email validation
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address'
      });
    }

    // Password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.errors[0] // Return first error
      });
    }

    // Name validation
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Name must be at least 2 characters long'
      });
    }

    // Create user using auth utilities
    const user = await createUser(email, password, name.trim());
    
    // Create session for auto-signin
    const sessionId = await createSession(user.id);
    
    // Create JWT token
    const token = createJWT({
      userId: user.id,
      sessionId: sessionId,
      email: user.email
    });

    // Set auth cookie
    res.setHeader('Set-Cookie', 
      `auth-token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
    );

    console.log(`✅ User created and signed in: ${user.email} (ID: ${user.id})`);

    const response: SignupResponse = {
      success: true,
      message: 'Account created successfully! You are now signed in.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified
      },
      token: token
    };

    return res.status(201).json(response);

  } catch (error: any) {
    console.error('Signup API error:', error);
    
    // Handle specific auth errors
    if (error.name === 'AuthError') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}