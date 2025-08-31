import 'dotenv/config';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function fixUserSchema() {
  try {
    console.log('🔄 Fixing user schema...');

    // Check if the required columns exist by trying to select them
    try {
      await client.execute(`SELECT password, is_verified, verification_token FROM users LIMIT 1`);
      console.log('✅ User schema is already correct');
      return;
    } catch (error: any) {
      if (error.message.includes('no such column')) {
        console.log('🔧 Adding missing columns to users table...');
        
        // Add missing columns one by one with error handling
        const columnsToAdd = [
          'ALTER TABLE users ADD COLUMN password TEXT',
          'ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0',
          'ALTER TABLE users ADD COLUMN verification_token TEXT'
        ];

        for (const sql of columnsToAdd) {
          try {
            await client.execute(sql);
            console.log(`✅ Executed: ${sql}`);
          } catch (err: any) {
            if (err.message.includes('duplicate column')) {
              console.log(`⚠️ Column already exists: ${sql}`);
            } else {
              console.error(`❌ Failed to execute: ${sql}`, err);
            }
          }
        }
        
        console.log('✅ User schema updated successfully');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Failed to fix user schema:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

fixUserSchema();