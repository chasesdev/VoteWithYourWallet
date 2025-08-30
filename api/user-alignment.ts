import type { VercelRequest, VercelResponse } from '@vercel/node';

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
      // For now, return a mock alignment or null if not set
      // In a real app, this would fetch from the database
      const mockAlignment: UserAlignment = {
        liberal: 0,
        conservative: 0,
        libertarian: 0,
        green: 0,
        centrist: 0,
      };

      return res.status(200).json({
        success: true,
        data: mockAlignment,
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

      // For now, just return success
      // In a real app, this would save to the database
      console.log('Setting user alignment:', { userId, alignment });

      return res.status(200).json({
        success: true,
        message: 'User alignment updated successfully',
        data: alignment,
      });
    } catch (error) {
      console.error('Error setting user alignment:', error);
      return res.status(500).json({ error: 'Failed to update user alignment' });
    }
  }

  if (req.method === 'PUT') {
    // Update user alignment (same as POST for this implementation)
    return handler({ ...req, method: 'POST' }, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}