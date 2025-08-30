import type { VercelRequest, VercelResponse } from '@vercel/node';
import PoliticalAlignmentService from '../services/politicalAlignmentService';

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

      const alignment = await PoliticalAlignmentService.getInstance().getUserPersonalAlignment(userIdNum);
      
      return res.status(200).json({
        success: true,
        data: alignment.data || null,
      });
    } catch (error) {
      console.error('Error fetching user alignment:', error);
      return res.status(500).json({ error: 'Failed to fetch user alignment' });
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

      const result = await PoliticalAlignmentService.getInstance().saveUserPersonalAlignment(userIdNum, alignment);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'User alignment updated successfully',
          data: alignment,
        });
      } else {
        return res.status(500).json({ error: result.error || 'Failed to update user alignment' });
      }
    } catch (error) {
      console.error('Error setting user alignment:', error);
      return res.status(500).json({ error: 'Failed to update user alignment' });
    }
  }

  if (req.method === 'PUT') {
    // Update user alignment (same as POST for this implementation)
    const modifiedReq = { ...req, method: 'POST' } as VercelRequest;
    return handler(modifiedReq, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}