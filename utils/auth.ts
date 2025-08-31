import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/connection';
import { users, sessions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export interface User {
  id: number;
  email: string;
  name: string | null;
  isVerified: boolean;
  createdAt: Date;
}

export interface SessionData {
  userId: number;
  sessionId: string;
  expiresAt: Date;
}

export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// JWT token management
export function createJWT(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '7d',
    algorithm: 'HS256'
  });
}

export function verifyJWT(token: string): any {
  console.log('🔍 [AUTH] verifyJWT called');
  console.log('🔍 [AUTH] Token length:', token.length);
  console.log('🔍 [AUTH] JWT_SECRET available:', !!JWT_SECRET);
  
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    console.log('🔍 [AUTH] JWT verification successful');
    return payload;
  } catch (error) {
    console.error('❌ [AUTH] JWT verification failed:', error);
    throw new AuthError('Invalid token', 'INVALID_TOKEN');
  }
}

// Session management
export async function createSession(userId: number): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  return sessionId;
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('🔍 [AUTH] getSession called with sessionId:', sessionId);
  console.log('🔍 [AUTH] Database connection available:', !!db);
  
  try {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.id, sessionId),
        // Check if session hasn't expired
      ))
      .limit(1);

    console.log('🔍 [AUTH] Session query result:', !!session);
    
    if (!session) {
      console.log('🔍 [AUTH] No session found');
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      console.log('🔍 [AUTH] Session expired, deleting');
      await deleteSession(sessionId);
      return null;
    }

    console.log('🔍 [AUTH] Session valid, returning data');
    return {
      userId: session.userId,
      sessionId: session.id,
      expiresAt: session.expiresAt,
    };
  } catch (error) {
    console.error('❌ [AUTH] getSession error:', error);
    throw error;
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function deleteUserSessions(userId: number): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

// User management
export async function createUser(email: string, password: string, name?: string): Promise<User> {
  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existingUser) {
    throw new AuthError('User already exists', 'USER_EXISTS');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Generate verification token
  const verificationToken = generateVerificationToken();

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || null,
      verificationToken,
      isVerified: false,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
    });

  return newUser;
}

export async function authenticateUser(email: string, password: string): Promise<User> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
}

export async function getUserById(id: number): Promise<User | null> {
  console.log('🔍 [AUTH] getUserById called with id:', id);
  
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    console.log('🔍 [AUTH] User query result:', !!user);
    return user || null;
  } catch (error) {
    console.error('❌ [AUTH] getUserById error:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return user || null;
}

// Utility functions
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(36))
    .join('');
  return `${timestamp}_${randomBytes}`;
}

function generateVerificationToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Validation functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}