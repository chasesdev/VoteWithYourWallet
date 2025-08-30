import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDB } from '../../db/connection';
import { businesses, businessAlignments } from '../../db/schema';
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getDB();
    
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const { q = '', category = '', page = '1', limit = '10' } = req.query;
    const query = q as string;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Build the query conditions
    let whereConditions: any[] = [];
    
    if (query) {
      whereConditions.push(
        or(
          ilike(businesses.name, `%${query}%`),
          ilike(businesses.description, `%${query}%`)
        )
      );
    }
    
    if (category && category !== 'All') {
      whereConditions.push(eq(businesses.category, category as string));
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
      .limit(limitNum)
      .offset((pageNum - 1) * limitNum);

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

    return res.status(200).json({
      businesses: transformedBusinesses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
      }
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({ error: 'Failed to fetch businesses', details: errorMessage });
  }
}