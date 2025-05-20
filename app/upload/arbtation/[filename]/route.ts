import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // Get the filename from the route parameter
    const filename = params.filename;
    console.log(`Redirecting legacy request from /upload/arbtation/${filename}`);

    // Redirect to the new correct path
    const baseUrl = request.nextUrl.origin;
    const correctUrl = `${baseUrl}/api/uploads/arbitration/${filename}`;
    
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