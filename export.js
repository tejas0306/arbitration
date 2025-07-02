const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Clean previous builds
try {
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next');
  }
  if (fs.existsSync('out')) {
    execSync('rm -rf out');
  }
} catch (error) {
  process.exit(1);
}

// Build the app
try {
  execSync('npx next build', { stdio: 'inherit' });
} catch (error) {
  try {
    execSync('npx next build --force', { stdio: 'inherit' });
  } catch (innerError) {
    process.exit(1);
  }
}

// Copy CSS from .next to out if needed
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
}

