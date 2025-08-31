import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Create database connection only when environment variables are available
let dbInstance: any = null;

function initializeDB() {
  console.log('🔍 [DB] initializeDB called');
  
  // Don't initialize DB in client-side builds
  if (typeof window !== 'undefined') {
    console.error('❌ [DB] Attempted to initialize DB on client side');
    throw new Error('Database connection cannot be used on client side');
  }

  if (!dbInstance) {
    console.log('🔍 [DB] Creating new database connection...');
    console.log('🔍 [DB] TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL ? 'SET' : 'NOT SET');
    console.log('🔍 [DB] TURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN ? 'SET' : 'NOT SET');
    console.log('🔍 [DB] DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    
    // Check if we're using Turso or local SQLite
    if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
      console.log('🔍 [DB] Using Turso database...');
      try {
        // Use Turso database
        const client = createClient({
          url: process.env.TURSO_DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN,
        });
        dbInstance = drizzle(client, { schema });
        console.log('✅ [DB] Turso database connection established');
      } catch (error) {
        console.error('❌ [DB] Failed to create Turso connection:', error);
        throw error;
      }
    } else if (process.env.DATABASE_URL) {
      console.log('🔍 [DB] Using local SQLite database...');
      try {
        // Use local SQLite database
        const client = createClient({
          url: process.env.DATABASE_URL,
        });
        dbInstance = drizzle(client, { schema });
        console.log('✅ [DB] Local SQLite database connection established');
      } catch (error) {
        console.error('❌ [DB] Failed to create local DB connection:', error);
        throw error;
      }
    } else {
      console.error('❌ [DB] No database configuration found in environment variables');
      throw new Error('No database configuration available');
    }
  } else {
    console.log('🔍 [DB] Using existing database connection');
  }
  return dbInstance;
}

export function getDB() {
  return initializeDB();
}

// Safe export that only initializes on server side
export let db: any = null;
if (typeof window === 'undefined') {
  try {
    db = initializeDB();
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}