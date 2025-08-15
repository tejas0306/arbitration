import { NextRequest, NextResponse } from 'next/server';

// Helper function to get auth token from request
async function getAuthToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Helper function to get API URL
function getApiUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${baseUrl}/${path}`;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🔍 UPDATE-WITH-FILES API ROUTE CALLED');
  console.log('🔍 Params:', params);
  console.log('🔍 Method:', request.method);
  console.log('🔍 URL:', request.url);
  
  try {
    // Get authentication token
    const token = await getAuthToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse form data
    const formData = await request.formData();
    
    // Forward the request to the backend API
    const apiUrl = getApiUrl(`api/arbitration/cases/${params.id}/update-with-files`);
    
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type header as it will be set automatically with the boundary
      },
      body: formData,
    });
    
    // Read the response
    const responseData = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.message || 'Failed to update case' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 