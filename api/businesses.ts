import { VercelRequest, VercelResponse } from '@vercel/node';
import { businesses, businessAlignments } from '../db/schema';
import { eq, ilike, or, desc } from 'drizzle-orm';
import { getDB } from '../db/connection';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { q: query = '', category = '', page: pageParam = '1', limit: limitParam = '10' } = req.query;
    const pageNumber = parseInt(pageParam as string);
    const limitNumber = parseInt(limitParam as string);
    const offset = (pageNumber - 1) * limitNumber;

    const db = getDB();
    let businessesWithAlignments: any[] = [];

    if (db) {
      let whereClause = undefined;
      
      if (query || category) {
        whereClause = or(
          query ? ilike(businesses.name, `%${query}%`) : undefined,
          query ? ilike(businesses.description, `%${query}%`) : undefined,
          category ? eq(businesses.category, category as string) : undefined
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
        .limit(limitNumber)
        .offset(offset),
        
        db.select()
        .from(businessAlignments)
      ]);

      businessesWithAlignments = businessesData.map((business: any) => {
        const alignment = alignmentsData.find((a: any) => a.businessId === business.id);
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
    }

    // If no data in database, return mock data as fallback
    const mockBusinesses = [
      {
        id: 1,
        name: "Patagonia",
        description: "Outdoor clothing company focused on environmental responsibility",
        category: "Retail",
        website: "https://patagonia.com",
        address: "Ventura, CA",
        latitude: 34.2746,
        longitude: -119.2290,
        imageUrl: null,
        alignment: {
          liberal: 8,
          conservative: 2,
          libertarian: 3,
          green: 9,
          centrist: 4,
        }
      },
      {
        id: 2,
        name: "Chick-fil-A",
        description: "Fast food restaurant chain specializing in chicken",
        category: "Food",
        website: "https://chick-fil-a.com",
        address: "Atlanta, GA",
        latitude: 33.7490,
        longitude: -84.3880,
        imageUrl: null,
        alignment: {
          liberal: 2,
          conservative: 8,
          libertarian: 4,
          green: 3,
          centrist: 5,
        }
      },
      {
        id: 3,
        name: "Ben & Jerry's",
        description: "Ice cream company known for social activism",
        category: "Food",
        website: "https://benjerry.com",
        address: "Burlington, VT",
        latitude: 44.4759,
        longitude: -73.2121,
        imageUrl: null,
        alignment: {
          liberal: 9,
          conservative: 1,
          libertarian: 2,
          green: 8,
          centrist: 3,
        }
      },
      {
        id: 4,
        name: "Tesla",
        description: "Electric vehicle and clean energy company",
        category: "Technology",
        website: "https://tesla.com",
        address: "Austin, TX",
        latitude: 30.2672,
        longitude: -97.7431,
        imageUrl: null,
        alignment: {
          liberal: 6,
          conservative: 4,
          libertarian: 7,
          green: 9,
          centrist: 5,
        }
      },
      {
        id: 5,
        name: "Walmart",
        description: "Multinational retail corporation",
        category: "Retail",
        website: "https://walmart.com",
        address: "Bentonville, AR",
        latitude: 36.3729,
        longitude: -94.2088,
        imageUrl: null,
        alignment: {
          liberal: 3,
          conservative: 6,
          libertarian: 5,
          green: 2,
          centrist: 7,
        }
      }
    ];

    // Use database data if available, otherwise fallback to mock data
    let finalBusinesses;
    let totalCount;

    if (db && businessesWithAlignments.length > 0) {
      finalBusinesses = businessesWithAlignments;
      // For real implementation, you'd want to do a separate count query
      totalCount = businessesWithAlignments.length;
    } else {
      // Fallback to mock data if database is empty
      let filteredMockBusinesses = mockBusinesses;
      
      if (query) {
        filteredMockBusinesses = mockBusinesses.filter(business => 
          business.name.toLowerCase().includes((query as string).toLowerCase()) ||
          business.description.toLowerCase().includes((query as string).toLowerCase())
        );
      }
      
      if (category) {
        filteredMockBusinesses = filteredMockBusinesses.filter(business => 
          business.category.toLowerCase() === (category as string).toLowerCase()
        );
      }

      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = startIndex + limitNumber;
      finalBusinesses = filteredMockBusinesses.slice(startIndex, endIndex);
      totalCount = filteredMockBusinesses.length;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    return res.status(200).json({
      businesses: finalBusinesses,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: totalCount,
      }
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch businesses', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}