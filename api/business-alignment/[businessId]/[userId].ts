import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDB } from '../../../db/connection';
import { businesses, businessAlignments, userAlignments } from '../../../db/schema';
import { eq } from 'drizzle-orm';

function calculateAlignmentScore(userValue: number, businessValue: number): number {
  // Simple correlation-based score
  // This can be enhanced with more sophisticated algorithms
  if (userValue === 0) return 0; // User doesn't care about this alignment
  
  // Normalize both values to 0-1 range
  const normalizedUser = Math.min(userValue, 100) / 100;
  const normalizedBusiness = Math.min(businessValue, 100) / 100;
  
  // Calculate the absolute difference
  const difference = Math.abs(normalizedUser - normalizedBusiness);
  
  // Return a score that is 1 when they match exactly and 0 when they are opposite
  return 1 - difference;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { businessId, userId } = req.query;
    
    if (!businessId || !userId || typeof businessId !== 'string' || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid businessId or userId' });
    }

    const db = getDB();
    
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    // Get user alignment
    const userAlignment = await db.select({
      liberal: userAlignments.liberal,
      conservative: userAlignments.conservative,
      libertarian: userAlignments.libertarian,
      green: userAlignments.green,
      centrist: userAlignments.centrist,
    })
    .from(userAlignments)
    .where(eq(userAlignments.userId, parseInt(userId)));
    
    if (!userAlignment.length) {
      return res.status(404).json({ error: 'User alignment not found' });
    }
    
    // Get business alignment
    const businessAlignment = await db.select({
      liberal: businessAlignments.liberal,
      conservative: businessAlignments.conservative,
      libertarian: businessAlignments.libertarian,
      green: businessAlignments.green,
      centrist: businessAlignments.centrist,
    })
    .from(businessAlignments)
    .where(eq(businessAlignments.businessId, parseInt(businessId)));
    
    if (!businessAlignment.length) {
      return res.status(404).json({ error: 'Business alignment not found' });
    }
    
    const user = userAlignment[0];
    const business = businessAlignment[0];
    
    // Calculate alignment score
    const alignmentScores = {
      liberal: calculateAlignmentScore(user.liberal, business.liberal),
      conservative: calculateAlignmentScore(user.conservative, business.conservative),
      libertarian: calculateAlignmentScore(user.libertarian, business.libertarian),
      green: calculateAlignmentScore(user.green, business.green),
      centrist: calculateAlignmentScore(user.centrist, business.centrist),
    };
    
    // Calculate overall alignment as a weighted average based on user's alignment values
    let totalAlignment = 0;
    let totalWeight = 0;
    
    Object.keys(alignmentScores).forEach(key => {
      const weight = user[key as keyof typeof user] || 0;
      totalAlignment += alignmentScores[key as keyof typeof alignmentScores] * weight;
      totalWeight += weight;
    });
    
    const overallAlignment = totalWeight > 0 ? totalAlignment / totalWeight : 0;
    
    return res.status(200).json({
      alignmentScores,
      overallAlignment: Math.round(overallAlignment * 100),
    });
  } catch (error) {
    console.error('Error calculating business alignment:', error);
    return res.status(500).json({ error: 'Failed to calculate business alignment' });
  }
}