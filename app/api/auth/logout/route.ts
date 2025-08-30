import { deleteSession, verifyJWT } from '../../../../utils/auth';

export async function POST(request: Request) {
  try {
    // Get token from cookie
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader?.split(';').find(c => c.trim().startsWith('auth-token='))?.split('=')[1];
    
    if (token) {
      try {
        // Verify and decode token
        const payload = await verifyJWT(token);
        
        // Delete session from database
        if (payload.sessionId) {
          await deleteSession(payload.sessionId);
        }
      } catch (error) {
        // Token invalid, but we'll still clear the cookie
        console.log('Invalid token during logout:', error);
      }
    }

    // Create response
    const response = Response.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear auth cookie
    response.headers.set('Set-Cookie', 'auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}