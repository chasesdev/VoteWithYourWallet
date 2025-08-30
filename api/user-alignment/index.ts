import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDB } from '../../db/connection';
import { users, userAlignments } from '../../db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const { userId, liberal = 0, conservative = 0, libertarian = 0, green = 0, centrist = 0 } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = getDB();
    
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    // Check if user exists (in a real app, you might want to create the user if not exists)
    const userExists = await db.select().from(users).where(eq(users.id, userId));
    
    if (!userExists.length) {
      return res.status(404).json({ error: 'User not found' });
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