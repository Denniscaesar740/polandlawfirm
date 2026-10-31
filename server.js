import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf'
};

const server = http.createServer((req, res) => {
  const rawPath = req.url.split('?')[0];
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch (e) {
    decodedPath = rawPath;
  }

  let safePath = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(ROOT, safePath);

  function serveDirect(file) {
    const ext = path.extname(file).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(file);
    stream.pipe(res);
  }

  function serveFile(targetFile) {
    fs.stat(targetFile, (err, stats) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }

      if (stats.isDirectory()) {
        const indexFile = path.join(targetFile, 'index.html');
        fs.stat(indexFile, (indexErr, indexStats) => {
          if (!indexErr && indexStats.isFile()) {
            serveDirect(indexFile);
          } else {
            const dirHtml = targetFile.replace(/[\/\\]$/, '') + '.html';
            fs.stat(dirHtml, (dirHtmlErr, dirHtmlStats) => {
              if (!dirHtmlErr && dirHtmlStats.isFile()) {
                serveDirect(dirHtml);
              } else {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 Not Found');
              }
            });
          }
        });
        return;
      }

      serveDirect(targetFile);
    });
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      serveDirect(filePath);
    } else if (!err && stats.isDirectory()) {
      serveFile(filePath);
    } else {
      const htmlPath = filePath + '.html';
      fs.stat(htmlPath, (htmlErr, htmlStats) => {
        if (!htmlErr && htmlStats.isFile()) {
          serveDirect(htmlPath);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found');
        }
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
