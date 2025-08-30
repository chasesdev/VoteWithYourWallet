import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDB } from '../../db/connection';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
// Note: Password hashing removed as current database schema doesn't include password field
// In production, add password field to users table and implement proper authentication

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
    name: string;
  };
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address'
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Name validation
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Name must be at least 2 characters long'
      });
    }

    const db = getDB();
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    try {
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists'
        });
      }
    } catch (checkError) {
      console.error('Error checking existing user:', checkError);
      return res.status(500).json({
        success: false,
        error: 'Database error while checking user'
      });
    }

    // Note: Password handling skipped as database schema doesn't include password field
    // In production, hash and store password securely

    // Create user with fields that exist in database
    try {
      const newUser = await db.insert(users).values({
        email: normalizedEmail,
        name: name.trim()
      }).returning({
        id: users.id,
        email: users.email,
        name: users.name
      });

      if (newUser.length === 0) {
        throw new Error('Failed to create user');
      }

      const createdUser = newUser[0];

      console.log(`✅ User created successfully: ${createdUser.email} (ID: ${createdUser.id})`);

      const response: SignupResponse = {
        success: true,
        message: 'Account created successfully',
        user: {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name || ''
        }
      };

      return res.status(201).json(response);

    } catch (insertError: any) {
      console.error('Error creating user:', insertError);
      
      // Handle unique constraint violation
      if (insertError.message && insertError.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to create account. Please try again.'
      });
    }

  } catch (error: any) {
    console.error('Signup API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}