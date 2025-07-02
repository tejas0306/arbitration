import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // Get the filename from the route parameter
    const filename = params.filename;

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename parameter is required' },
        { status: 400 }
      );
    }

    // Sanitize the filename to prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);
    
    // Check multiple potential file locations
    const potentialPaths = [
      // Current working directory + backend/uploads/arbitration
      path.join(process.cwd(), 'backend', 'uploads', 'arbitration', sanitizedFilename),
      // Parent directory + arbitration/backend/uploads/arbitration
      path.join(process.cwd(), '..', 'arbitration', 'backend', 'uploads', 'arbitration', sanitizedFilename),
      // Current directory + arbitration/backend/uploads/arbitration (if already in parent)
      path.join(process.cwd(), 'arbitration', 'backend', 'uploads', 'arbitration', sanitizedFilename),
      // Direct uploads path
      path.join(process.cwd(), 'uploads', 'arbitration', sanitizedFilename),
    ];


    // Find the first path that exists
    let actualFilePath = null;
    for (const potentialPath of potentialPaths) {
      if (fs.existsSync(potentialPath)) {
        actualFilePath = potentialPath;
        break;
      }
    }

    // Check if the file exists
    if (!actualFilePath) {
      return NextResponse.json(
        { error: 'File not found', filename: sanitizedFilename, searchedPaths: potentialPaths },
        { status: 404 }
      );
    }


    // Read the file
    const fileBuffer = fs.readFileSync(actualFilePath);
    
    // Determine MIME type based on file extension
    const ext = path.extname(actualFilePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
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
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `inline; filename="${sanitizedFilename}"`);
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Return the file
    return new NextResponse(fileBuffer, {
      headers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error serving file', details: error.message },
      { status: 500 }
    );
  }
} 