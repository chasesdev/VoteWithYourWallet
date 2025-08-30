import { db } from '../../../db/connection';
import { businesses, businessAlignments } from '../../../db/schema';
import { eq, or, ilike, desc, and } from 'drizzle-orm';

interface BusinessWithAlignment {
  id: number;
  name: string;
  description: string | null;
  category: string;
  website: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  createdAt: Date;
  alignment: {
    liberal: number | null;
    conservative: number | null;
    libertarian: number | null;
    green: number | null;
    centrist: number | null;
  } | null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build the query conditions
    let whereConditions: any[] = [];
    
    if (q) {
      whereConditions.push(
        or(
          ilike(businesses.name, `%${q}%`),
          ilike(businesses.description, `%${q}%`)
        )
      );
    }
    
    if (category && category !== 'All') {
      whereConditions.push(eq(businesses.category, category));
    }

    // Get businesses with their alignment data
    const businessesQuery = db
      .select({
        id: businesses.id,
        name: businesses.name,
        description: businesses.description,
        category: businesses.category,
        website: businesses.website,
        address: businesses.address,
        latitude: businesses.latitude,
        longitude: businesses.longitude,
        imageUrl: businesses.imageUrl,
        createdAt: businesses.createdAt,
        alignment: {
          liberal: businessAlignments.liberal,
          conservative: businessAlignments.conservative,
          libertarian: businessAlignments.libertarian,
          green: businessAlignments.green,
          centrist: businessAlignments.centrist,
        },
      })
      .from(businesses)
      .leftJoin(businessAlignments, eq(businesses.id, businessAlignments.businessId));

    // Apply where conditions if any
    if (whereConditions.length > 0) {
      businessesQuery.where(and(...whereConditions));
    }

    // Get total count for pagination
    const totalCountQuery = db
      .select({ count: businesses.id })
      .from(businesses)
      .leftJoin(businessAlignments, eq(businesses.id, businessAlignments.businessId));

    if (whereConditions.length > 0) {
      totalCountQuery.where(and(...whereConditions));
    }

    const totalCountResult = await totalCountQuery;
    const totalCount = totalCountResult.length;

    // Apply pagination and ordering
    const paginatedBusinesses = await businessesQuery
      .orderBy(desc(businesses.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    // Transform the data to match the expected format
    const transformedBusinesses = (paginatedBusinesses as BusinessWithAlignment[]).map((business: BusinessWithAlignment) => ({
      ...business,
      alignment: business.alignment || {
        liberal: 0,
        conservative: 0,
        libertarian: 0,
        green: 0,
        centrist: 0,
      },
    }));

    return Response.json({
      businesses: transformedBusinesses,
      pagination: {
        page,
        limit,
        total: totalCount,
      }
    });

  } catch (error) {
    console.error('Error fetching businesses:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return Response.json({ 
      error: 'Failed to fetch businesses', 
      details: errorMessage 
    }, { status: 500 });
  }
}