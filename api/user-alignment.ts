import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDB } from '../db/connection';
import { userAlignments, users } from '../db/schema';
import { eq } from 'drizzle-orm';

interface UserAlignment {
  liberal: number;
  conservative: number;
  libertarian: number;
  green: number;
  centrist: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Get user alignment
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      const userIdNum = parseInt(userId as string);
      if (isNaN(userIdNum)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const db = getDB();
      const result = await db
        .select()
        .from(userAlignments)
        .where(eq(userAlignments.userId, userIdNum))
        .limit(1);

      const alignment = result.length > 0 ? {
        liberal: result[0].liberal,
        conservative: result[0].conservative,
        libertarian: result[0].libertarian,
        green: result[0].green,
        centrist: result[0].centrist
      } : null;
      
      return res.status(200).json({
        success: true,
        data: alignment,
      });
    } catch (error) {
      console.error('Error fetching user alignment:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch user alignment',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  if (req.method === 'POST') {
    // Set user alignment
    const { userId, alignment } = req.body;
    
    if (!userId || !alignment) {
      return res.status(400).json({ error: 'User ID and alignment data are required' });
    }

    try {
      // Validate alignment data
      const requiredFields = ['liberal', 'conservative', 'libertarian', 'green', 'centrist'];
      for (const field of requiredFields) {
        if (typeof alignment[field] !== 'number' || alignment[field] < 0 || alignment[field] > 100) {
          return res.status(400).json({ 
            error: `Invalid ${field} value. Must be a number between 0 and 100.` 
          });
        }
      }

      const userIdNum = parseInt(userId as string);
      if (isNaN(userIdNum)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const db = getDB();
      
      // Check if user exists (optional - skip if we want to allow any userId)
      const existingUser = await db.select().from(users).where(eq(users.id, userIdNum)).limit(1);
      if (existingUser.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Try to insert or update alignment data
      try {
        // Try insert first
        await db.insert(userAlignments).values({
          userId: userIdNum,
          liberal: alignment.liberal,
          conservative: alignment.conservative,
          libertarian: alignment.libertarian,
          green: alignment.green,
          centrist: alignment.centrist,
          createdAt: new Date()
        });
      } catch (insertError: any) {
        // If it's a unique constraint violation, update instead
        if (insertError.message && insertError.message.includes('UNIQUE constraint failed')) {
          await db.update(userAlignments)
            .set({
              liberal: alignment.liberal,
              conservative: alignment.conservative,
              libertarian: alignment.libertarian,
              green: alignment.green,
              centrist: alignment.centrist
            })
            .where(eq(userAlignments.userId, userIdNum));
        } else {
          throw insertError;
        }
      }

      return res.status(200).json({
        success: true,
        message: 'User alignment updated successfully',
        data: alignment,
      });
    } catch (error) {
      console.error('Error setting user alignment:', error);
      return res.status(500).json({ 
        error: 'Failed to update user alignment',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  if (req.method === 'PUT') {
    // Update user alignment (same as POST for this implementation)
    const modifiedReq = { ...req, method: 'POST' } as VercelRequest;
    return handler(modifiedReq, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}