import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 Testing signup components...');
    
    // Test 1: Import auth utils
    if (req.query.test === '1') {
      const { createUser, validateEmail, validatePassword } = await import('../../utils/auth');
      return res.status(200).json({ 
        success: true, 
        message: 'Auth utils imported successfully',
        functions: {
          createUser: typeof createUser,
          validateEmail: typeof validateEmail,
          validatePassword: typeof validatePassword
        }
      });
    }

    // Test 2: Test validation
    if (req.query.test === '2') {
      const { validateEmail, validatePassword } = await import('../../utils/auth');
      const emailValid = validateEmail('test@example.com');
      const passwordValid = validatePassword('TestPassword123!');
      
      return res.status(200).json({ 
        success: true, 
        message: 'Validation tests completed',
        results: {
          email: emailValid,
          password: passwordValid
        }
      });
    }

    // Test 3: Test user creation (with catch)
    if (req.query.test === '3') {
      const { createUser } = await import('../../utils/auth');
      
      try {
        // Try to create a test user
        const testEmail = `test-${Date.now()}@example.com`;
        const user = await createUser(testEmail, 'TestPassword123!', 'Test User');
        
        return res.status(200).json({ 
          success: true, 
          message: 'User creation successful',
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        });
      } catch (error) {
        return res.status(200).json({ 
          success: false, 
          message: 'User creation failed',
          error: error instanceof Error ? error.message : String(error),
          errorName: error instanceof Error ? error.name : 'Unknown'
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Signup test endpoint',
      availableTests: [
        '?test=1 - Test auth utils import',
        '?test=2 - Test validation functions', 
        '?test=3 - Test user creation'
      ]
    });

  } catch (error) {
    console.error('Test signup error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}