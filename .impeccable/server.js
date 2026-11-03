const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DIR = path.join(__dirname);

const server = http.createServer((req, res) => {
  let file = req.url === '/' ? '/decision-board.html' : req.url;
  let filePath = path.join(DIR, file);
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIR, 'decision-board.html');
  }

  const ext = path.extname(filePath);
  let contentType = 'text/html';
  if (ext === '.json') contentType = 'application/json';
  if (ext === '.css') contentType = 'text/css';
  if (ext === '.js') contentType = 'text/javascript';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading ' + filePath);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server listening on http://127.0.0.1:${PORT}`);
});
