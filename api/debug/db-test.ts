import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    console.log('🔍 Testing database connection...');
    console.log('Environment variables:');
    console.log('- TURSO_DATABASE_URL:', !!process.env.TURSO_DATABASE_URL);
    console.log('- TURSO_AUTH_TOKEN:', !!process.env.TURSO_AUTH_TOKEN);
    console.log('- DATABASE_URL:', !!process.env.DATABASE_URL);
    console.log('- JWT_SECRET:', !!process.env.JWT_SECRET);
    
    // Test database import
    const { db } = await import('../../db/connection');
    console.log('✅ Database module imported');
    console.log('DB instance:', !!db);
    
    if (db) {
      // Try a simple query
      const { users } = await import('../../db/schema');
      const result = await db.select().from(users).limit(1);
      console.log('✅ Database query successful');
      
      return res.status(200).json({
        success: true,
        message: 'Database connection successful',
        hasUsers: result.length > 0,
        environment: {
          hasTursoUrl: !!process.env.TURSO_DATABASE_URL,
          hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasJwtSecret: !!process.env.JWT_SECRET
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Database instance is null'
      });
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack'
    });
  }
}