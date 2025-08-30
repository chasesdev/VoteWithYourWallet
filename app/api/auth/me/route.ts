import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, getSession, getUserById } from '../../../../utils/auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    // Verify JWT
    const payload = await verifyJWT(token);
    
    if (!payload.userId || !payload.sessionId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }

    // Verify session is still valid
    const session = await getSession(payload.sessionId);
    
    if (!session || session.userId !== payload.userId) {
      return NextResponse.json({ error: 'Session expired or invalid' }, { status: 401 });
    }

    // Get user data
    const user = await getUserById(payload.userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user data (without sensitive info)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error('Auth check error:', error);
    
    // Create response with error
    const response = NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    
    // Clear invalid token
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  }
}