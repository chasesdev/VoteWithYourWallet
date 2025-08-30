import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDB } from '../../../db/connection';
import { businessReviews, users } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';

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
    
    if (!id) {
      return res.status(400).json({ error: 'Business ID is required' });
    }
    
    try {
      const businessId = parseInt(id as string);
      if (isNaN(businessId)) {
        return res.status(400).json({ error: 'Invalid business ID' });
      }

      const db = getDB();
      
      // Fetch reviews with user information
      const reviews = await db
        .select({
          id: businessReviews.id,
          userId: businessReviews.userId,
          rating: businessReviews.rating,
          comment: businessReviews.comment,
          helpfulCount: businessReviews.helpfulCount,
          createdAt: businessReviews.createdAt,
          userName: users.name,
        })
        .from(businessReviews)
        .leftJoin(users, eq(businessReviews.userId, users.id))
        .where(eq(businessReviews.businessId, businessId))
        .orderBy(desc(businessReviews.createdAt));

      // Calculate statistics
      const totalCount = reviews.length;
      let averageRating = 0;
      const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      
      if (totalCount > 0) {
        const ratingSum = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        averageRating = Math.round((ratingSum / totalCount) * 10) / 10;
        
        reviews.forEach(review => {
          const rating = review.rating as keyof typeof ratingCounts;
          if (rating >= 1 && rating <= 5) {
            ratingCounts[rating]++;
          }
        });
      }

      // Format reviews for frontend
      const formattedReviews = reviews.map(review => ({
        id: review.id,
        userId: review.userId,
        userName: review.userName || "Anonymous",
        userAvatar: null,
        rating: review.rating,
        comment: review.comment || "",
        date: review.createdAt ? review.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        helpful: review.helpfulCount || 0,
        alignmentMatch: null, // Would need additional calculation
        media: []
      }));

      return res.status(200).json({
        reviews: formattedReviews,
        totalCount,
        averageRating,
        ratingDistribution: ratingCounts
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }

  if (req.method === 'POST') {
    const { id } = req.query;
    const { rating, comment, userId } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    if (!userId || !rating) {
      return res.status(400).json({ error: 'User ID and rating are required' });
    }

    try {
      const businessId = parseInt(id as string);
      const userIdNum = parseInt(userId);
      
      if (isNaN(businessId) || isNaN(userIdNum)) {
        return res.status(400).json({ error: 'Invalid business ID or user ID' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      const db = getDB();
      
      // Insert new review
      const result = await db.insert(businessReviews).values({
        businessId,
        userId: userIdNum,
        rating,
        comment: comment || null,
        helpfulCount: 0,
      }).returning();

      // Fetch the user name for the response
      const user = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, userIdNum))
        .limit(1);

      const newReview = {
        id: result[0].id,
        userId: userIdNum,
        userName: user[0]?.name || "Anonymous",
        userAvatar: null,
        rating,
        comment: comment || "",
        date: new Date().toISOString().split('T')[0],
        helpful: 0,
        alignmentMatch: null,
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