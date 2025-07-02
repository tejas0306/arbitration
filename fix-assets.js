const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || 3002;

// Ensure the _next directory exists in the public folder
const publicNextDir = path.join(__dirname, 'public', '_next');
if (!fs.existsSync(publicNextDir)) {
  fs.mkdirSync(publicNextDir, { recursive: true });
}

// Copy CSS files from .next/static/css to public/_next
const nextCssDir = path.join(__dirname, '.next', 'static', 'css');
const publicCssDir = path.join(publicNextDir, 'css');

if (fs.existsSync(nextCssDir)) {
  if (!fs.existsSync(publicCssDir)) {
    fs.mkdirSync(publicCssDir, { recursive: true });
  }
  
  // Copy CSS files
  const cssFiles = fs.readdirSync(nextCssDir);
  cssFiles.forEach(file => {
    if (file.endsWith('.css')) {
      const sourcePath = path.join(nextCssDir, file);
      const destPath = path.join(publicCssDir, file);
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

// Copy JS files from .next/static/chunks to public/_next
const nextJsDir = path.join(__dirname, '.next', 'static', 'chunks');
const publicJsDir = path.join(publicNextDir, 'chunks');

if (fs.existsSync(nextJsDir)) {
  if (!fs.existsSync(publicJsDir)) {
    fs.mkdirSync(publicJsDir, { recursive: true });
  }
  
  // Copy JS files recursively
  function copyFilesRecursively(source, destination) {
    const files = fs.readdirSync(source);
    files.forEach(file => {
      const sourcePath = path.join(source, file);
      const destPath = path.join(destination, file);
      
      const stats = fs.statSync(sourcePath);
      if (stats.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyFilesRecursively(sourcePath, destPath);
      } else if (file.endsWith('.js')) {
        fs.copyFileSync(sourcePath, destPath);
      }
    });
  }
  
  copyFilesRecursively(nextJsDir, publicJsDir);
}

// Start a server to serve files properly
app.use(express.static(path.join(__dirname, 'public')));
app.use('/_next', express.static(path.join(__dirname, '.next/static')));

app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Asset Fix Server</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/_next/css/${cssFiles ? cssFiles[0] : ''}" />
      </head>
      <body>
        <h1>Fixed Assets Server</h1>
        <p>Your assets have been copied to the public directory and are now being served correctly.</p>
        <p>This is a temporary fix server. Use this approach to fix your 404 errors for CSS and JS files.</p>
        <p>When you're ready to return to your regular app, just stop this server and run your normal next dev or next start commands.</p>
      </body>
    </html>
  `);
});

app.listen(port, () => {
}); 