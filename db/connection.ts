import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Create database connection only when environment variables are available
let dbInstance: any = null;

function initializeDB() {
  // Don't initialize DB in client-side builds
  if (typeof window !== 'undefined') {
    throw new Error('Database connection cannot be used on client side');
  }

  if (!dbInstance) {
    console.log('Database connection requested...');
    console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL ? 'SET' : 'NOT SET');
    console.log('TURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN ? 'SET' : 'NOT SET');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    
    // Check if we're using Turso or local SQLite
    if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
      console.log('Using Turso database...');
      // Use Turso database
      const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      dbInstance = drizzle(client, { schema });
      console.log('Turso database connection established');
    } else if (process.env.DATABASE_URL) {
      console.log('Using local SQLite database...');
      // Use local SQLite database
      const client = createClient({
        url: process.env.DATABASE_URL,
      });
      dbInstance = drizzle(client, { schema });
      console.log('Local SQLite database connection established');
    } else {
      console.error('No database configuration found in environment variables');
      throw new Error('No database configuration available');
    }
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