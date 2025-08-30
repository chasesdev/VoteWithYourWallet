import { verifyJWT, getSession, getUserById } from '../../../../utils/auth';

export async function GET(request: Request) {
  try {
    // Get token from cookie
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader?.split(';').find(c => c.trim().startsWith('auth-token='))?.split('=')[1];
    
    if (!token) {
      return Response.json({ error: 'No authentication token' }, { status: 401 });
    }

    // Verify JWT
    const payload = await verifyJWT(token);
    
    if (!payload.userId || !payload.sessionId) {
      return Response.json({ error: 'Invalid token payload' }, { status: 401 });
    }

    // Verify session is still valid
    const session = await getSession(payload.sessionId);
    
    if (!session || session.userId !== payload.userId) {
      return Response.json({ error: 'Session expired or invalid' }, { status: 401 });
    }

    // Get user data
    const user = await getUserById(payload.userId);
    
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user data (without sensitive info)
    return Response.json({
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
    const response = Response.json({ error: 'Authentication failed' }, { status: 401 });
    
    // Clear invalid token
    response.headers.set('Set-Cookie', 'auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');
    
    return response;
  }
}