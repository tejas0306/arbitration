import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Get the base directory (project root)
    const cwd = process.cwd();
    
    // Check for uploads directories
    const possibleUploadDirs = [
      path.join(cwd, 'uploads'),
      path.join(cwd, 'public', 'uploads'),
      path.join(cwd, 'tmp', 'uploads'),
      path.join(cwd, 'storage', 'uploads'),
    ];
    
    const uploadDirStatus = {};
    
    // Check which upload directories exist
    for (const dir of possibleUploadDirs) {
      try {
        const exists = fs.existsSync(dir);
        uploadDirStatus[dir] = {
          exists,
          files: exists ? fs.readdirSync(dir).slice(0, 10) : [], // Get first 10 files
          isDirectory: exists ? fs.statSync(dir).isDirectory() : false
        };
      } catch (err) {
        uploadDirStatus[dir] = { error: err.message };
      }
    }
    
    // Get any file paths with "agreementFile" in their name
    const findAgreementFiles = (startPath, maxDepth = 3, currentDepth = 0) => {
      if (!fs.existsSync(startPath) || currentDepth >= maxDepth) {
        return [];
      }
      
      const results = [];
      const files = fs.readdirSync(startPath);
      
      for (const file of files) {
        const filePath = path.join(startPath, file);
        try {
          const stat = fs.statSync(filePath);
          
          // Check if it's a directory and if so, recurse into it
          if (stat.isDirectory()) {
            if (currentDepth < maxDepth) {
              results.push(...findAgreementFiles(filePath, maxDepth, currentDepth + 1));
            }
          } 
          // Otherwise, check if the file name matches
          else if (file.includes('agreementFile') || file.includes('agreement')) {
            results.push({
              path: filePath,
              size: stat.size,
              type: path.extname(file),
              modified: stat.mtime
            });
          }
        } catch (err) {
          // Ignore permission errors, etc.
        }
      }
      
      return results;
    };
    
    // Directories to search
    const searchDirectories = [
      cwd,
      path.join(cwd, 'public'),
      path.join(cwd, 'uploads'),
      path.join(cwd, 'storage'),
    ];
    
    // Find agreement files in these directories
    const agreementFiles = {};
    for (const dir of searchDirectories) {
      try {
        agreementFiles[dir] = findAgreementFiles(dir, 2);
      } catch (err) {
        agreementFiles[dir] = { error: err.message };
      }
    }

    // Return diagnostic information
    return NextResponse.json({
      cwd,
      uploadDirStatus,
      agreementFiles,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error checking files', details: error.message },
      { status: 500 }
    );
  }
} 