/**
 * Zero-dependency Node.js static web server for development.
 * Serves the Billing and Inventory management Single Page Application (SPA).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);

  // Normalize URL path and resolve file location
  let filePath = req.url === '/' ? '/index.html' : req.url;
  
  // Strip query parameters or hashes if present
  filePath = filePath.split('?')[0].split('#')[0];
  
  const absolutePath = path.join(__dirname, filePath);

  // Check if target is inside working directory to prevent directory traversal vulnerability
  if (!absolutePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain');
    res.end('403 Forbidden: Access outside workspace directory is prohibited.');
    return;
  }

  // Check if file exists
  fs.access(absolutePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(`
        <div style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h2 style="color: #ef4444;">404 Not Found</h2>
          <p>The requested file could not be found: <code>${filePath}</code></p>
          <a href="/" style="color: #6366f1; text-decoration: none; font-weight: bold;">Return to Home Terminal</a>
        </div>
      `);
      return;
    }

    // Read and serve file
    fs.readFile(absolutePath, (readErr, content) => {
      if (readErr) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`500 Internal Server Error: Failed to read file. ${readErr.message}`);
        return;
      }

      // Determine correct mime type
      const ext = path.extname(absolutePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`
===================================================================
🚀 NEXUS RETAIL - DEVELOPMENT WEB SERVER STARTED SUCCESSFUL!
===================================================================
🔌 Server local listening on address:
   👉 http://localhost:${PORT}

💻 To access the billing and inventory terminal, copy-paste
   the address above directly into your web browser!

⚙️  Press [Ctrl + C] in the terminal window to stop the server.
===================================================================
  `);
});
