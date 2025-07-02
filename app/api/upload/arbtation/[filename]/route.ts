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
    
    // Check potential file locations
    const potentialPaths = [
      // Check in backend/upload/arbtation
      path.join(process.cwd(), 'backend', 'upload', 'arbtation', sanitizedFilename),
      // Check in local uploads directory
      path.join(process.cwd(), 'uploads', sanitizedFilename),
      // Check in public/uploads
      path.join(process.cwd(), 'public', 'uploads', sanitizedFilename),
    ];


    // Find the first path that exists
    let filePath = null;
    for (const potentialPath of potentialPaths) {
      try {
        if (fs.existsSync(potentialPath)) {
          filePath = potentialPath;
          break;
        }
      } catch (err) {
      }
    }

    // If file not found in any of the potential locations
    if (!filePath) {
      
      // If this is an agreement file, try to locate it using a more flexible approach
      if (filename.includes('agreementFile-')) {
        const filesDir = path.join(process.cwd(), 'backend', 'upload', 'arbtation');
        try {
          // Check if the directory exists first
          if (fs.existsSync(filesDir)) {
            const allFiles = fs.readdirSync(filesDir);
            // Find any file that has a similar pattern
            const matchingFile = allFiles.find(file => file.includes('agreementFile-'));
            if (matchingFile) {
              filePath = path.join(filesDir, matchingFile);
            }
          }
        } catch (err) {
        }
      }

      // If still no file found, return 404
      if (!filePath) {
        return NextResponse.json(
          { error: 'File not found', filename: sanitizedFilename },
          { status: 404 }
        );
      }
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
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `inline; filename="${sanitizedFilename}"`);

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