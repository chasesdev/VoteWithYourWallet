#!/usr/bin/env node

/**
 * Test Signup API
 * 
 * This script tests the signup API endpoint
 */

import { config } from 'dotenv';

// Load environment variables
config();

async function testSignupAPI() {
  console.log('📝 Testing Signup API Endpoint...\n');
  
  try {
    const baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
    console.log(`Using base URL: ${baseUrl}`);
    
    // Test 1: Valid signup
    console.log('1️⃣ Testing valid signup...');
    const signupData = {
      name: 'Test User New',
      email: 'testnew@example.com',
      password: 'TestPassword123!'
    };
    
    try {
      const response = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData)
      });
      
      console.log(`Status: ${response.status}`);
      const result = await response.json();
      console.log('Response:', result);
    } catch (fetchError: any) {
      console.log('❌ Signup failed:', fetchError.message);
    }
    
    console.log('\n2️⃣ Testing duplicate email signup...');
    try {
      const response2 = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData) // Same email
      });
      
      console.log(`Status: ${response2.status}`);
      const result2 = await response2.json();
      console.log('Response:', result2);
    } catch (fetchError: any) {
      console.log('❌ Duplicate test failed:', fetchError.message);
    }
    
    console.log('\n3️⃣ Testing invalid email signup...');
    try {
      const response3 = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'invalid-email',
          password: 'TestPassword123!'
        })
      });
      
      console.log(`Status: ${response3.status}`);
      const result3 = await response3.json();
      console.log('Response:', result3);
    } catch (fetchError: any) {
      console.log('❌ Invalid email test failed:', fetchError.message);
    }
    
    console.log('\n✅ API endpoint testing completed!');
    
  } catch (error) {
    console.error('❌ API testing failed:', error);
    throw error;
  }
}

// Execute the test
if (require.main === module) {
  testSignupAPI()
    .then(() => {
      console.log('🎉 Signup API testing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Signup API testing failed:', error);
      process.exit(1);
    });
}

export { testSignupAPI };