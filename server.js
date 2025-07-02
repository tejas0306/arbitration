const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();

  // Serve static files with long cache duration
  server.use('/_next', express.static(path.join(__dirname, '.next'), {
    maxAge: '30d',
    immutable: true
  }));

  // Serve public files
  server.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '7d'
  }));

  // Handle all other requests with Next.js
  server.all('*', (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, (err) => {
    if (err) throw err;
  });
}).catch(err => {
  process.exit(1);
}); 