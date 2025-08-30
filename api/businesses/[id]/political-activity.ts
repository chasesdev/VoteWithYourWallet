import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDB } from '../../../db/connection';
import { politicalActivity } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Business ID is required' });
    }
    
    const businessId = parseInt(id as string);
    if (isNaN(businessId)) {
      return res.status(400).json({ error: 'Invalid business ID' });
    }

    const db = getDB();
    
    // Fetch political activity for the business
    const activities = await db
      .select({
        id: politicalActivity.id,
        date: politicalActivity.date,
        type: politicalActivity.type,
        title: politicalActivity.title,
        description: politicalActivity.description,
        amount: politicalActivity.amount,
        recipient: politicalActivity.recipient,
        impact: politicalActivity.impact,
        sourceUrl: politicalActivity.sourceUrl,
        sourceType: politicalActivity.sourceType,
        confidence: politicalActivity.confidence,
        isVerified: politicalActivity.isVerified,
        tags: politicalActivity.tags,
        metadata: politicalActivity.metadata,
        createdAt: politicalActivity.createdAt,
      })
      .from(politicalActivity)
      .where(eq(politicalActivity.businessId, businessId))
      .orderBy(desc(politicalActivity.date));

    // Transform the data to match the expected frontend format
    const transformedActivities = activities.map((activity: any) => ({
      id: activity.id,
      date: activity.date,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      amount: activity.amount,
      recipient: activity.recipient,
      impact: activity.impact,
      sourceUrl: activity.sourceUrl,
      sourceType: activity.sourceType || null,
      confidence: activity.confidence,
      isVerified: activity.isVerified,
      tags: activity.tags ? JSON.parse(activity.tags) : [],
      metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
    }));

    return res.status(200).json({
      activities: transformedActivities,
      totalCount: activities.length,
    });
  } catch (error) {
    console.error('Error fetching political activity:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({ 
      error: 'Failed to fetch political activity', 
      details: errorMessage 
    });
  }
}