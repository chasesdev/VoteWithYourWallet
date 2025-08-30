import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDB } from '../../../db/connection';
import { reviews, users } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const businessId = parseInt(id as string);

  if (isNaN(businessId)) {
    return res.status(400).json({ success: false, error: 'Invalid business ID' });
  }

  try {
    const db = getDB();
    
    if (!db) {
      return res.status(500).json({ success: false, error: 'Database connection not available' });
    }

    if (req.method === 'GET') {
      // Get reviews for the business with user information
      const businessReviews = await db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          user: {
            id: users.id,
            name: users.name,
          },
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.businessId, businessId))
        .orderBy(desc(reviews.createdAt))
        .limit(20);

      return res.status(200).json({
        success: true,
        data: businessReviews,
      });
    }

    if (req.method === 'POST') {
      const { rating, comment, userId } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, error: 'Valid rating is required' });
      }

      if (!comment || comment.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Comment is required' });
      }

      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
      }

      // Create the review
      const newReview = await db
        .insert(reviews)
        .values({
          businessId,
          userId,
          rating,
          comment: comment.trim(),
          createdAt: new Date(),
        })
        .returning();

      // Get the created review with user information
      const createdReview = await db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          user: {
            id: users.id,
            name: users.name,
          },
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.id, newReview[0].id))
        .limit(1);

      return res.status(201).json({
        success: true,
        data: createdReview[0],
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error with reviews:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({ success: false, error: 'Failed to process request', details: errorMessage });
  }
}