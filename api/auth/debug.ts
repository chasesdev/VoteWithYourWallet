import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🔍 [AUTH-DEBUG] Handler started');
  
  try {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    console.log('🔍 [AUTH-DEBUG] CORS headers set');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      console.log('🔍 [AUTH-DEBUG] OPTIONS request');
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      console.log('🔍 [AUTH-DEBUG] Invalid method:', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('🔍 [AUTH-DEBUG] Method is GET, proceeding');

    // Test step 1: Basic response
    if (req.query.step === '1') {
      console.log('🔍 [AUTH-DEBUG] Step 1 - basic response test');
      return res.status(200).json({ success: true, step: 1, message: 'Basic response works' });
    }

    // Test step 2: Import auth utils
    if (req.query.step === '2') {
      console.log('🔍 [AUTH-DEBUG] Step 2 - testing auth imports');
      try {
        const { verifyJWT, getSession, getUserById } = await import('../../utils/auth');
        console.log('🔍 [AUTH-DEBUG] Auth imports successful');
        return res.status(200).json({ success: true, step: 2, message: 'Auth imports work' });
      } catch (error) {
        console.error('❌ [AUTH-DEBUG] Auth import failed:', error);
        return res.status(500).json({ 
          success: false, 
          step: 2, 
          error: 'Auth import failed',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Test step 3: Token extraction
    if (req.query.step === '3') {
      console.log('🔍 [AUTH-DEBUG] Step 3 - testing token extraction');
      const token = req.cookies['auth-token'];
      console.log('🔍 [AUTH-DEBUG] Token present:', !!token);
      console.log('🔍 [AUTH-DEBUG] Token length:', token ? token.length : 0);
      
      if (!token) {
        console.log('🔍 [AUTH-DEBUG] No token - returning 401');
        return res.status(401).json({ success: false, step: 3, message: 'No token provided' });
      }
      
      return res.status(200).json({ success: true, step: 3, message: 'Token extracted successfully' });
    }

    // Test step 4: JWT verification
    if (req.query.step === '4') {
      console.log('🔍 [AUTH-DEBUG] Step 4 - testing JWT verification');
      const { verifyJWT } = await import('../../utils/auth');
      const token = req.cookies['auth-token'] || 'test-invalid-token';
      
      try {
        const payload = verifyJWT(token);
        console.log('🔍 [AUTH-DEBUG] JWT verification successful');
        return res.status(200).json({ success: true, step: 4, message: 'JWT verified', payload });
      } catch (error) {
        console.log('🔍 [AUTH-DEBUG] JWT verification failed as expected');
        return res.status(401).json({ success: false, step: 4, message: 'JWT verification failed (expected)' });
      }
    }

    // Default: Return all available steps
    return res.status(200).json({ 
      success: true, 
      message: 'Auth debug endpoint - add ?step=1,2,3,or 4 to test specific functionality',
      availableSteps: [
        '?step=1 - Basic response test',
        '?step=2 - Auth imports test', 
        '?step=3 - Token extraction test',
        '?step=4 - JWT verification test'
      ]
    });

  } catch (error) {
    console.error('❌ [AUTH-DEBUG] Unexpected error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Unexpected error in debug endpoint',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
}