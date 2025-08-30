import { getDB } from '@/db/connection';
import { businesses, businessAlignments, userAlignments } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: { businessId: string, userId: string } }) {
  try {
    const { businessId, userId } = params;
    const db = getDB();
    
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
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
      return new Response(JSON.stringify({ error: 'User alignment not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
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
      return new Response(JSON.stringify({ error: 'Business alignment not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
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
    
    return new Response(JSON.stringify({
      alignmentScores,
      overallAlignment: Math.round(overallAlignment * 100),
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error calculating business alignment:', error);
    return new Response(JSON.stringify({ error: 'Failed to calculate business alignment' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

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