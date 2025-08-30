import { db } from '../../../db/connection';
import { userAlignments } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { verifyJWT, getSession, getUserById } from '../../../utils/auth';

async function getAuthenticatedUser(request: Request) {
  try {
    // Get token from cookie
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader?.split(';').find(c => c.trim().startsWith('auth-token='))?.split('=')[1];
    
    if (!token) {
      return null;
    }

    // Verify JWT
    const payload = await verifyJWT(token);
    
    if (!payload.userId || !payload.sessionId) {
      return null;
    }

    // Verify session is still valid
    const session = await getSession(payload.sessionId);
    
    if (!session || session.userId !== payload.userId) {
      return null;
    }

    // Get user data
    const user = await getUserById(payload.userId);
    
    if (!user) {
      return null;
    }

    return { user, session };
  } catch (error) {
    console.error('Auth helper error:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // Authenticate user
    const auth = await getAuthenticatedUser(request);
    
    if (!auth) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { user } = auth;
    const { liberal = 0, conservative = 0, libertarian = 0, green = 0, centrist = 0 } = await request.json();
    
    // Check if alignment already exists for this user
    const existingAlignment = await db.select().from(userAlignments).where(eq(userAlignments.userId, user.id));
    
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
          updatedAt: new Date(),
        })
        .where(eq(userAlignments.userId, user.id));
    } else {
      // Create new alignment
      await db.insert(userAlignments).values({
        userId: user.id,
        liberal,
        conservative,
        libertarian,
        green,
        centrist,
      });
    }
    
    return Response.json({ 
      success: true,
      message: 'User alignment updated successfully',
    });

  } catch (error) {
    console.error('Error updating user alignment:', error);
    return Response.json({ error: 'Failed to update user alignment' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // Authenticate user
    const auth = await getAuthenticatedUser(request);
    
    if (!auth) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { user } = auth;
    
    // Get user alignment
    const [alignment] = await db
      .select()
      .from(userAlignments)
      .where(eq(userAlignments.userId, user.id))
      .limit(1);
    
    if (!alignment) {
      return Response.json({
        alignment: {
          liberal: 0,
          conservative: 0,
          libertarian: 0,
          green: 0,
          centrist: 0,
        }
      });
    }
    
    return Response.json({ alignment });

  } catch (error) {
    console.error('Error fetching user alignment:', error);
    return Response.json({ error: 'Failed to fetch user alignment' }, { status: 500 });
  }
}