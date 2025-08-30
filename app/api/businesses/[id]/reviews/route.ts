import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../db/connection';
import { reviews, users, businesses } from '../../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';

interface ReviewRating {
  rating: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = parseInt(params.id);
    
    if (isNaN(businessId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid business ID' },
        { status: 400 }
      );
    }

    // Get reviews for the business with user information
    const businessReviews = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        userName: users.name,
        userAvatar: users.avatar,
        rating: reviews.rating,
        comment: reviews.comment,
        date: reviews.createdAt,
        helpful: reviews.helpful,
        alignmentMatch: reviews.alignmentMatch,
        media: reviews.media,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.businessId, businessId))
      .orderBy(desc(reviews.createdAt))
      .limit(50);

    return NextResponse.json({
      success: true,
      data: businessReviews,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = parseInt(params.id);
    const body = await request.json();
    
    if (isNaN(businessId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid business ID' },
        { status: 400 }
      );
    }

    const { userId, rating, comment, media } = body;

    // Validate required fields
    if (!userId || !rating || !comment) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if business exists
    const businessExists = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (businessExists.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    // Calculate alignment match if user alignment is provided
    let alignmentMatch = null;
    if (body.userAlignment) {
      // This would be calculated based on business alignment and user alignment
      // For now, we'll use a placeholder calculation
      alignmentMatch = Math.floor(Math.random() * 100);
    }

    // Create the review
    const newReview = await db
      .insert(reviews)
      .values({
        businessId,
        userId,
        rating,
        comment,
        media: media || [],
        alignmentMatch,
        helpful: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    // Update business rating (average)
    const allReviews = await db
      .select({ rating: reviews.rating })
      .from(reviews)
      .where(eq(reviews.businessId, businessId));

    const avgRating = allReviews.reduce((sum: number, review: ReviewRating) => sum + review.rating, 0) / allReviews.length;
    
    await db
      .update(businesses)
      .set({
        rating: parseFloat(avgRating.toFixed(1)),
        reviewCount: allReviews.length,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(businesses.id, businessId));

    return NextResponse.json({
      success: true,
      data: newReview[0],
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
}