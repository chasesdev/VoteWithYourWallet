import { createClient } from '@libsql/client';
import { config } from 'dotenv';

// Load environment variables
config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function runMigration() {
  try {
    console.log('Starting migration...');
    
    // Read the migration SQL file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../db/migrations/0002_enhanced_business_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL.split(';').filter((stmt: string) => stmt.trim());
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await client.execute(statement);
          console.log(`Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          console.error('Statement:', statement);
        }
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    client.close();
  }
}

runMigration();