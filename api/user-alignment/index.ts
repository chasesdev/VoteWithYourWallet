import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDB } from '../../db/connection';
import { userAlignments } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '../../utils/middleware';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { liberal = 0, conservative = 0, libertarian = 0, green = 0, centrist = 0 } = req.body;

    // User is guaranteed to exist from auth middleware
    const userId = req.user!.id;

    const db = getDB();
    
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }
    
    // Check if alignment already exists for this user
    const existingAlignment = await db.select().from(userAlignments).where(eq(userAlignments.userId, userId));
    
    if (existingAlignment.length) {
      // Update existing alignment
      await db
        .update(userAlignments)
        .set({
          liberal,
          conservative,
          libertarian,
          green,
          centrist,
          updatedAt: new Date(),
        })
        .where(eq(userAlignments.userId, userId));
    } else {
      // Create new alignment
      await db.insert(userAlignments).values({
        userId,
        liberal,
        conservative,
        libertarian,
        green,
        centrist,
      });
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'User alignment updated successfully',
    });
  } catch (error) {
    console.error('Error updating user alignment:', error);
    return res.status(500).json({ error: 'Failed to update user alignment' });
  }
}

export default withAuth(handler);