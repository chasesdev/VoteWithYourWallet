import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock reviews data for now
const mockReviews = [
  {
    id: 1,
    userId: 1,
    userName: "Sarah M.",
    userAvatar: null,
    rating: 5,
    comment: "Love shopping here! Their commitment to environmental causes aligns perfectly with my values.",
    date: "2024-08-15",
    helpful: 12,
    alignmentMatch: 95,
    media: []
  },
  {
    id: 2,
    userId: 2,
    userName: "Mike R.",
    userAvatar: null,
    rating: 4,
    comment: "Great products and customer service. I appreciate their transparency about political donations.",
    date: "2024-08-10",
    helpful: 8,
    alignmentMatch: 87,
    media: []
  },
  {
    id: 3,
    userId: 3,
    userName: "Emily K.",
    userAvatar: null,
    rating: 5,
    comment: "Finally found a business that matches my political values! Will definitely shop here again.",
    date: "2024-08-05",
    helpful: 15,
    alignmentMatch: 92,
    media: []
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { id } = req.query;
    
    try {
      // For now, return mock data for any business ID
      return res.status(200).json({
        reviews: mockReviews,
        totalCount: mockReviews.length,
        averageRating: 4.7,
        ratingDistribution: {
          5: 15,
          4: 8,
          3: 2,
          2: 1,
          1: 0
        }
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }

  if (req.method === 'POST') {
    const { id } = req.query;
    const { rating, comment, userId } = req.body;

    try {
      // Mock response for review submission
      const newReview = {
        id: Date.now(),
        userId,
        userName: "Anonymous User",
        userAvatar: null,
        rating,
        comment,
        date: new Date().toISOString().split('T')[0],
        helpful: 0,
        alignmentMatch: Math.floor(Math.random() * 20) + 80, // Random match 80-100%
        media: []
      };

      return res.status(201).json({
        success: true,
        review: newReview
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      return res.status(500).json({ error: 'Failed to submit review' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}