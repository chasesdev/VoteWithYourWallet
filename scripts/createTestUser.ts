#!/usr/bin/env node

/**
 * Create Test User
 * 
 * This script creates a test user to understand the actual database schema
 */

import { config } from 'dotenv';
import { getDB } from '../db/connection';
import { users } from '../db/schema';

// Load environment variables
config();

async function createTestUser() {
  console.log('👤 Creating Test User...\n');
  
  try {
    const db = getDB();

    console.log('1️⃣ Attempting to create user with minimal fields...');
    try {
      await db.insert(users).values({
        email: 'test-basic@example.com',
        name: 'Test Basic User'
      });
      console.log('✅ Success with email + name only');
    } catch (error: any) {
      console.log('❌ Failed:', error.message);
      
      console.log('\n2️⃣ Attempting to create user with password field...');
      try {
        await db.insert(users).values({
          email: 'test-password@example.com',
          password: 'test_hash',
          name: 'Test Password User'
        });
        console.log('✅ Success with email + password + name');
      } catch (error2: any) {
        console.log('❌ Failed:', error2.message);
        
        console.log('\n3️⃣ Attempting to create user with all fields...');
        try {
          await db.insert(users).values({
            email: 'test-full@example.com',
            password: 'test_hash',
            name: 'Test Full User',
            isVerified: false
          });
          console.log('✅ Success with all fields');
        } catch (error3: any) {
          console.log('❌ Failed:', error3.message);
          console.log('❌ All user creation attempts failed');
          return false;
        }
      }
    }
    
    // Check what users exist now
    console.log('\n📋 Current users in database:');
    const allUsers = await db.select().from(users);
    console.log(allUsers);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test user creation failed:', error);
    return false;
  }
}

// Execute the test
if (require.main === module) {
  createTestUser()
    .then((success) => {
      if (success) {
        console.log('🎉 Test user creation completed');
      } else {
        console.log('💥 Test user creation failed');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { createTestUser };