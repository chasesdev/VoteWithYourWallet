import { getDB } from '@/db/connection';
import { reviews, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDB();
    
    if (!db) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database connection not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const businessId = parseInt(params.id);

    if (isNaN(businessId)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid business ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    return new Response(
      JSON.stringify({
        success: true,
        data: businessReviews,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching reviews:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch reviews', details: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDB();
    
    if (!db) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database connection not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const businessId = parseInt(params.id);

    if (isNaN(businessId)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid business ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { rating, comment, userId } = body;

    if (!rating || rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid rating is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!comment || comment.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Comment is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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

    return new Response(
      JSON.stringify({
        success: true,
        data: createdReview[0],
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating review:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create review', details: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
