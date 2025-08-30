import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDB } from '../../../db/connection';
import { businesses, businessAlignments, donations } from '../../../db/schema';
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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid business ID' });
    }

    const db = getDB();
    
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const [businessData, alignmentData, donationsData] = await Promise.all([
      db.select()
        .from(businesses)
        .where(eq(businesses.id, parseInt(id))),
      
      db.select()
        .from(businessAlignments)
        .where(eq(businessAlignments.businessId, parseInt(id))),
      
      db.select()
        .from(donations)
        .where(eq(donations.businessId, parseInt(id)))
    ]);

    if (!businessData.length) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const business = businessData[0];
    const alignment = alignmentData[0] || {
      liberal: 0,
      conservative: 0,
      libertarian: 0,
      green: 0,
      centrist: 0,
    };

    return res.status(200).json({
      business,
      alignment,
      donations: donationsData,
    });
  } catch (error) {
    console.error('Error fetching business:', error);
    return res.status(500).json({ error: 'Failed to fetch business' });
  }
}