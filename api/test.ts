import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🔍 [TEST] Test endpoint called');
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 [TEST] Checking environment variables');
    
    // Test environment variables
    const hasDbUrl = !!process.env.TURSO_DATABASE_URL;
    const hasDbToken = !!process.env.TURSO_AUTH_TOKEN;
    const hasJwtSecret = !!process.env.JWT_SECRET;
    
    console.log('🔍 [TEST] Environment check:', { hasDbUrl, hasDbToken, hasJwtSecret });
    
    // Test database connection
    let dbConnectionTest = 'not tested';
    try {
      const { getDB } = await import('../db/connection');
      const db = getDB();
      dbConnectionTest = 'success';
      console.log('🔍 [TEST] Database connection test: success');
    } catch (dbError) {
      dbConnectionTest = `failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`;
      console.error('❌ [TEST] Database connection test failed:', dbError);
    }
    
    res.status(200).json({
      success: true,
      environment: {
        hasDbUrl,
        hasDbToken,
        hasJwtSecret,
        nodeEnv: process.env.NODE_ENV
      },
      tests: {
        dbConnection: dbConnectionTest
      },
      message: 'API endpoint is working'
    });
  } catch (error) {
    console.error('❌ [TEST] Test endpoint error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}