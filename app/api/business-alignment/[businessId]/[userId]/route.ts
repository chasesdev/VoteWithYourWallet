import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../db/connection';
import { businessAlignments, userAlignments } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string; userId: string } }
) {
  try {
    const businessId = parseInt(params.businessId);
    const userId = parseInt(params.userId);

    if (isNaN(businessId) || isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid businessId or userId' }, { status: 400 });
    }

    // Get business alignment
    const [businessAlignment] = await db
      .select()
      .from(businessAlignments)
      .where(eq(businessAlignments.businessId, businessId))
      .limit(1);

    // Get user alignment
    const [userAlignment] = await db
      .select()
      .from(userAlignments)
      .where(eq(userAlignments.userId, userId))
      .limit(1);

    // Calculate alignment match if both exist
    let matchPercentage = 0;
    if (businessAlignment && userAlignment) {
      // Simple alignment matching algorithm
      const businessValues = [
        businessAlignment.liberal || 0,
        businessAlignment.conservative || 0,
        businessAlignment.libertarian || 0,
        businessAlignment.green || 0,
        businessAlignment.centrist || 0,
      ];
      
      const userValues = [
        userAlignment.liberal || 0,
        userAlignment.conservative || 0,
        userAlignment.libertarian || 0,
        userAlignment.green || 0,
        userAlignment.centrist || 0,
      ];

      // Calculate similarity (inverse of distance)
      let totalDifference = 0;
      for (let i = 0; i < businessValues.length; i++) {
        totalDifference += Math.abs(businessValues[i] - userValues[i]);
      }
      
      // Convert to percentage (lower difference = higher match)
      matchPercentage = Math.max(0, 100 - (totalDifference / 10));
    }

    return NextResponse.json({
      businessAlignment: businessAlignment || {
        liberal: 0,
        conservative: 0,
        libertarian: 0,
        green: 0,
        centrist: 0,
      },
      userAlignment: userAlignment || {
        liberal: 0,
        conservative: 0,
        libertarian: 0,
        green: 0,
        centrist: 0,
      },
      matchPercentage: Math.round(matchPercentage),
    });

  } catch (error) {
    console.error('Error fetching alignment comparison:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch alignment comparison',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}