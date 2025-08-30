import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, verifyJWT } from '../../../../utils/auth';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;
    
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
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}