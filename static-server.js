const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the .next directory with appropriate headers
app.use('/_next', express.static(path.join(__dirname, '.next/static'), {
  maxAge: '1y',
  immutable: true
}));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '7d'
}));

// Serve the HTML files from the out directory if available
if (fs.existsSync(path.join(__dirname, 'out'))) {
  app.use(express.static(path.join(__dirname, 'out')));
} 

// For all other requests, serve the index.html
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(__dirname, 'out', 'index.html'))) {
    res.sendFile(path.join(__dirname, 'out', 'index.html'));
  } else if (fs.existsSync(path.join(__dirname, '.next/server/pages/index.html'))) {
    res.sendFile(path.join(__dirname, '.next/server/pages/index.html'));
  } else {
    res.status(404).send('Not found');
  }
});

app.listen(port, () => {
  console.log(`Static server running at http://localhost:${port}`);
}); 