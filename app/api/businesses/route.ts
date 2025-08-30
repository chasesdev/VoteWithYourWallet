import { db } from '@/db/connection';
import { businesses, businessAlignments } from '@/db/schema';
import { eq, ilike, or, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let whereClause = undefined;
    
    if (query || category) {
      whereClause = or(
        query ? ilike(businesses.name, `%${query}%`) : undefined,
        query ? ilike(businesses.description, `%${query}%`) : undefined,
        category ? eq(businesses.category, category) : undefined
      );
    }

    const [businessesData, alignmentsData] = await Promise.all([
      db.select({
        id: businesses.id,
        name: businesses.name,
        description: businesses.description,
        category: businesses.category,
        website: businesses.website,
        address: businesses.address,
        latitude: businesses.latitude,
        longitude: businesses.longitude,
        imageUrl: businesses.imageUrl,
      })
      .from(businesses)
      .where(whereClause)
      .orderBy(desc(businesses.createdAt))
      .limit(limit)
      .offset(offset),
      
      db.select()
      .from(businessAlignments)
    ]);

    const businessesWithAlignments = businessesData.map(business => {
      const alignment = alignmentsData.find(a => a.businessId === business.id);
      return {
        ...business,
        alignment: alignment || {
          liberal: 0,
          conservative: 0,
          libertarian: 0,
          green: 0,
          centrist: 0,
        }
      };
    });

    return new Response(JSON.stringify({
      businesses: businessesWithAlignments,
      pagination: {
        page,
        limit,
        total: businessesData.length,
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch businesses' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}