import { createUser, createSession, createJWT, AuthError, validateEmail, validatePassword } from '../../../../utils/auth';

interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export async function POST(request: Request) {
  try {
    const { email, password, name }: SignupRequest = await request.json();

    // Validate required fields
    if (!email || !password || !name) {
      return Response.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return Response.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return Response.json({ 
        error: 'Password requirements not met',
        details: passwordValidation.errors 
      }, { status: 400 });
    }

    // Validate name length
    if (name.trim().length < 2) {
      return Response.json({ error: 'Name must be at least 2 characters long' }, { status: 400 });
    }

    // Create user
    const user = await createUser(email, password, name.trim());

    // Create session
    const sessionId = await createSession(user.id);

    // Create JWT token
    const token = await createJWT({
      userId: user.id,
      sessionId,
      email: user.email,
    });

    // Create response with user data
    const response = Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
      },
    }, { status: 201 });

    // Set cookie header
    response.headers.set('Set-Cookie', `auth-token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`);

    return response;

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof AuthError) {
      if (error.code === 'USER_EXISTS') {
        return Response.json({ error: 'An account with this email already exists' }, { status: 409 });
      }
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}