import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🔍 [TEST-IMPORTS] Starting import tests');
  
  try {
    // Test 1: Basic import
    if (req.query.test === '1') {
      console.log('🔍 [TEST-IMPORTS] Test 1: Basic import');
      const authModule = await import('../../utils/auth');
      console.log('🔍 [TEST-IMPORTS] Auth module imported successfully');
      console.log('🔍 [TEST-IMPORTS] Available exports:', Object.keys(authModule));
      return res.status(200).json({ success: true, test: 1, exports: Object.keys(authModule) });
    }

    // Test 2: Import specific functions
    if (req.query.test === '2') {
      console.log('🔍 [TEST-IMPORTS] Test 2: Import specific functions');
      const { verifyJWT, getSession, getUserById } = await import('../../utils/auth');
      console.log('🔍 [TEST-IMPORTS] Specific functions imported successfully');
      return res.status(200).json({ 
        success: true, 
        test: 2, 
        functions: {
          verifyJWT: typeof verifyJWT,
          getSession: typeof getSession,
          getUserById: typeof getUserById
        }
      });
    }

    // Test 3: Call verifyJWT with invalid token (should throw AuthError)
    if (req.query.test === '3') {
      console.log('🔍 [TEST-IMPORTS] Test 3: Call verifyJWT');
      const { verifyJWT } = await import('../../utils/auth');
      try {
        verifyJWT('invalid-token');
        return res.status(200).json({ success: false, test: 3, message: 'Should have thrown error' });
      } catch (error) {
        console.log('🔍 [TEST-IMPORTS] verifyJWT threw error as expected:', error);
        return res.status(200).json({ success: true, test: 3, message: 'verifyJWT works correctly' });
      }
    }

    // Default: Show available tests
    return res.status(200).json({
      success: true,
      message: 'Auth import test endpoint',
      availableTests: [
        '?test=1 - Basic import test',
        '?test=2 - Import specific functions test',
        '?test=3 - Test verifyJWT function'
      ]
    });

  } catch (error) {
    console.error('❌ [TEST-IMPORTS] Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Import test failed',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
}