import { getDB } from '@/db/connection';
import { users, userAlignments } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, liberal = 0, conservative = 0, libertarian = 0, green = 0, centrist = 0 } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const db = getDB();
    
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Check if user exists (in a real app, you might want to create the user if not exists)
    const userExists = await db.select().from(users).where(eq(users.id, userId));
    
    if (!userExists.length) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Check if alignment already exists for this user
    const existingAlignment = await db.select().from(userAlignments).where(eq(userAlignments.userId, userId));
    
    if (existingAlignment.length) {
      // Update existing alignment
      await db
        .update(userAlignments)
        .set({
          liberal,
          conservative,
          libertarian,
          green,
          centrist,
        })
        .where(eq(userAlignments.userId, userId));
    } else {
      // Create new alignment
      await db.insert(userAlignments).values({
        userId,
        liberal,
        conservative,
        libertarian,
        green,
        centrist,
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'User alignment updated successfully',
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error updating user alignment:', error);
    return new Response(JSON.stringify({ error: 'Failed to update user alignment' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}