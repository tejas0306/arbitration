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
    console.log(`Direct file access request: ${filename}`);

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename parameter is required' },
        { status: 400 }
      );
    }

    // Sanitize the filename to prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);
    
    // The actual path where files are stored
    const actualFilePath = path.join(process.cwd(), 'backend', 'uploads', 'arbitration', sanitizedFilename);
    console.log(`Looking for file at: ${actualFilePath}`);

    // Check if the file exists
    if (!fs.existsSync(actualFilePath)) {
      console.error(`File not found: ${actualFilePath}`);
      return NextResponse.json(
        { error: 'File not found', filename: sanitizedFilename },
        { status: 404 }
      );
    }

    console.log(`File found: ${actualFilePath}`);

    // Read the file
    const fileBuffer = fs.readFileSync(actualFilePath);
    
    // Determine MIME type based on file extension
    const ext = path.extname(actualFilePath).toLowerCase();
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
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `inline; filename="${sanitizedFilename}"`);
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Return the file
    return new NextResponse(fileBuffer, {
      headers,
    });
  } catch (error: any) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Error serving file', details: error.message },
      { status: 500 }
    );
  }
} 