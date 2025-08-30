import { createClient } from '@libsql/client';
import { config } from 'dotenv';

// Load environment variables
config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function fixMigration() {
  try {
    console.log('Fixing migration issues...');
    
    // Add the updated_at column to businesses table without default
    await client.execute(`
      ALTER TABLE businesses ADD COLUMN updated_at INTEGER
    `);
    console.log('Added updated_at column to businesses table');
    
    // Add the last_updated column to business_alignments table without default
    await client.execute(`
      ALTER TABLE business_alignments ADD COLUMN last_updated INTEGER
    `);
    console.log('Added last_updated column to business_alignments table');
    
    // Update existing records to set the timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    await client.execute({
      sql: `UPDATE businesses SET updated_at = ? WHERE updated_at IS NULL`,
      args: [timestamp]
    });
    console.log('Updated businesses records with timestamp');
    
    await client.execute({
      sql: `UPDATE business_alignments SET last_updated = ? WHERE last_updated IS NULL`,
      args: [timestamp]
    });
    console.log('Updated business_alignments records with timestamp');
    
    console.log('Migration fixes completed successfully!');
  } catch (error) {
    console.error('Migration fix failed:', error);
  } finally {
    client.close();
  }
}

fixMigration();