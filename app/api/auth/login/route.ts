import { authenticateUser, createSession, createJWT, AuthError } from '../../../../utils/auth';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const { email, password }: LoginRequest = await request.json();

    // Validate required fields
    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Authenticate user
    const user = await authenticateUser(email, password);

    // Create session
    const sessionId = await createSession(user.id);

    // Create JWT token
    const token = await createJWT({
      userId: user.id,
      sessionId,
      email: user.email,
    });

    // Create response with user data and cookie
    const response = Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
      },
    });

    // Set cookie header
    response.headers.set('Set-Cookie', `auth-token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`);

    return response;

  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}