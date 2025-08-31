import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateUser, createSession, createJWT, validateEmail } from '../../utils/auth';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
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
    const { email, password }: LoginRequest = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Email validation
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address'
      });
    }

    // Authenticate user
    const user = await authenticateUser(email, password);
    
    // Create session
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

    console.log(`✅ User logged in successfully: ${user.email} (ID: ${user.id})`);

    const response: LoginResponse = {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified
      },
      token: token
    };

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('Login API error:', error);
    
    // Handle specific auth errors
    if (error.name === 'AuthError') {
      return res.status(401).json({
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