import { NextRequest, NextResponse } from 'next/server';
import { createUser, createSession, createJWT, AuthError, validateEmail, validatePassword } from '../../../../utils/auth';

interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name }: SignupRequest = await request.json();

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ 
        error: 'Password requirements not met',
        details: passwordValidation.errors 
      }, { status: 400 });
    }

    // Validate name length
    if (name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters long' }, { status: 400 });
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
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
      },
    }, { status: 201 });

    // Set secure HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof AuthError) {
      if (error.code === 'USER_EXISTS') {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}