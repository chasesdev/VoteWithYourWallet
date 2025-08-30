import { getDB } from '@/db/connection';
import { businesses, businessAlignments, donations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const db = getDB();
    
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
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
      return new Response(JSON.stringify({ error: 'Business not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const business = businessData[0];
    const alignment = alignmentData[0] || {
      liberal: 0,
      conservative: 0,
      libertarian: 0,
      green: 0,
      centrist: 0,
    };

    return new Response(JSON.stringify({
      business,
      alignment,
      donations: donationsData,
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching business:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch business' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}