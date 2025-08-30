import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.TURSO_DATABASE_URL!;

// Create postgres client with web-compatible configuration
const client = postgres(connectionString, {
  // Web-specific configuration
  fetch: (url, options) => {
    // Handle web-specific fetch options
    return fetch(url, options);
  },
  // Disable WebSocket connections for web builds
  websocket: false,
});

// Create drizzle client
export const db = drizzle(client, { schema });