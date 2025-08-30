#!/usr/bin/env node

/**
 * Test User Alignment API
 * 
 * This script tests the user alignment API endpoints
 */

import { config } from 'dotenv';

// Load environment variables
config();

async function testUserAlignmentAPI() {
  console.log('🔗 Testing User Alignment API Endpoints...\n');
  
  try {
    const baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
    console.log(`Using base URL: ${baseUrl}`);
    
    // Test 1: POST - Save user alignment
    console.log('1️⃣ Testing POST /api/user-alignment (Save user alignment)...');
    const alignmentData = {
      userId: 1,
      alignment: {
        liberal: 8.5,
        conservative: 1.5,
        libertarian: 3.0,
        green: 9.0,
        centrist: 2.0
      }
    };
    
    try {
      const postResponse = await fetch(`${baseUrl}/api/user-alignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alignmentData)
      });
      
      console.log(`Status: ${postResponse.status}`);
      const postResult = await postResponse.json();
      console.log('Response:', postResult);
    } catch (postError: any) {
      console.log('❌ POST failed:', postError.message);
    }
    
    console.log('\n2️⃣ Testing GET /api/user-alignment (Retrieve user alignment)...');
    
    try {
      const getResponse = await fetch(`${baseUrl}/api/user-alignment?userId=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log(`Status: ${getResponse.status}`);
      const getResult = await getResponse.json();
      console.log('Response:', getResult);
    } catch (getError: any) {
      console.log('❌ GET failed:', getError.message);
    }
    
    console.log('\n✅ API endpoint testing completed!');
    
  } catch (error) {
    console.error('❌ API testing failed:', error);
    throw error;
  }
}

// Execute the test
if (require.main === module) {
  testUserAlignmentAPI()
    .then(() => {
      console.log('🎉 API testing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 API testing failed:', error);
      process.exit(1);
    });
}

export { testUserAlignmentAPI };