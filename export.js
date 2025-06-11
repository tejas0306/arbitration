const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Clean previous builds
console.log('Cleaning previous builds...');
try {
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next');
  }
  if (fs.existsSync('out')) {
    execSync('rm -rf out');
  }
} catch (error) {
  console.error('Error cleaning previous builds:', error);
  process.exit(1);
}

// Build the app
console.log('Building the app...');
try {
  execSync('npx next build', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed. Try building with force flag...');
  try {
    execSync('npx next build --force', { stdio: 'inherit' });
  } catch (innerError) {
    console.error('Build failed even with force flag:', innerError);
    process.exit(1);
  }
}

// Copy CSS from .next to out if needed
console.log('Ensuring CSS files are properly copied...');
try {
  // Create out/styles directory if it doesn't exist
  if (!fs.existsSync('out/styles')) {
    fs.mkdirSync('out/styles', { recursive: true });
  }
  
  // Copy global CSS file to the out directory
  if (fs.existsSync('styles/globals.css')) {
    fs.copyFileSync('styles/globals.css', 'out/styles/globals.css');
  }
  
  // Ensure _next directory has css files
  if (fs.existsSync('.next/static/css') && !fs.existsSync('out/_next/static/css')) {
    fs.mkdirSync('out/_next/static/css', { recursive: true });
    
    // Copy CSS files
    const cssFiles = fs.readdirSync('.next/static/css');
    cssFiles.forEach(file => {
      if (file.endsWith('.css')) {
        fs.copyFileSync(
          path.join('.next/static/css', file),
          path.join('out/_next/static/css', file)
        );
      }
    });
  }
} catch (error) {
  console.error('Error copying CSS files:', error);
}

console.log('Export completed successfully!');
console.log('To serve the exported app, run: node static-server.js'); 