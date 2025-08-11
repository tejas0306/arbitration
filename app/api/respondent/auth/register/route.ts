import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, confirmPassword, fullName, phone, address, caseId, token } = await request.json();

    if (!email || !password || !confirmPassword || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Email, password, confirm password, and full name are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Proxy to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/respondent/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, confirmPassword, fullName, phone, address, caseId, token }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Set session cookie if registration successful
    if (data.success) {
      const nextResponse = NextResponse.json(data);
      if (data.sessionToken) {
        nextResponse.cookies.set('respondent-session', data.sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 // 24 hours
        });
      }
      return nextResponse;
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Respondent registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 