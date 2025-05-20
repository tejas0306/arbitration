import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the remaining path after /upload/arbtation/
    const path = request.nextUrl.pathname;
    const relativePath = path.replace(/^\/upload\/arbtation/, '');
    
    console.log(`Redirecting legacy request from ${path}`);

    // Redirect to the new correct path
    const baseUrl = request.nextUrl.origin;
    const correctUrl = `${baseUrl}/api/uploads/arbitration${relativePath}`;
    
    console.log(`Redirecting to correct URL: ${correctUrl}`);
    return NextResponse.redirect(correctUrl);
  } catch (error: any) {
    console.error('Error redirecting:', error);
    return NextResponse.json(
      { error: 'Error redirecting', details: error.message },
      { status: 500 }
    );
  }
} 