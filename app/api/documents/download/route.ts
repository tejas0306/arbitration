import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get the filename from the query parameter
    const searchParams = request.nextUrl.searchParams;
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename parameter is required' },
        { status: 400 }
      );
    }


    // Sanitize the filename to prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);
    
    // Check for different potential file locations
    const potentialPaths = [
      // Backend upload directory with original filename
      path.join(process.cwd(), 'backend', 'upload', 'arbtation', sanitizedFilename),
      // Backend upload directory with any path structure
      filename.includes('/upload/arbtation')
        ? path.join(process.cwd(), 'backend', filename.split('/upload/arbtation/')[1])
        : null,
      // Direct in uploads folder
      path.join(process.cwd(), 'uploads', sanitizedFilename),
      // In public/uploads
      path.join(process.cwd(), 'public', 'uploads', sanitizedFilename),
      // With original path structure if it includes "uploads"
      filename.includes('uploads') 
        ? path.join(process.cwd(), filename.startsWith('/') ? filename.substring(1) : filename)
        : null,
    ].filter(Boolean);


    // If the path includes the full filename with ID
    if (filename.includes('agreementFile-')) {
      // Add a more specific path with the exact filename
      const agreementPath = path.join(process.cwd(), 'backend', 'upload', 'arbtation', filename);
      potentialPaths.unshift(agreementPath);
    }

    // Find the first path that exists
    let filePath = null;
    for (const potentialPath of potentialPaths) {
      try {
        if (potentialPath && fs.existsSync(potentialPath)) {
          filePath = potentialPath;
          break;
        }
      } catch (err) {
      }
    }

    // If file not found in any of the potential locations
    if (!filePath) {
      
      // For the frontend, redirect to a proxy URL that fetches from the backend
      const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const proxyUrl = `${backendApiUrl}/api/upload/arbtation/${sanitizedFilename}`;
      
      // Return a redirect to the backend URL
      return NextResponse.redirect(proxyUrl);
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determine MIME type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream'; // Default
    
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.doc') contentType = 'application/msword';
    else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === '.xls') contentType = 'application/vnd.ms-excel';
    else if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (ext === '.txt') contentType = 'text/plain';

    // Create headers with Content-Disposition to suggest a filename to the browser
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Content-Disposition', `inline; filename="${sanitizedFilename}"`);

    // Return the file
    return new NextResponse(fileBuffer, {
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error serving file', details: error.message },
      { status: 500 }
    );
  }
} 