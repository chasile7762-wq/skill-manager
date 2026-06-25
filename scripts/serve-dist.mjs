import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { createServer } from 'node:http';

const initialPort = Number(process.env.PORT || 4173);
const distRoot = join(process.cwd(), 'dist');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function resolvePath(urlPath) {
  const safePath = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const target = join(distRoot, safePath === '/' ? 'index.html' : safePath);
  if (existsSync(target) && statSync(target).isFile()) {
    return target;
  }
  return join(distRoot, 'index.html');
}

function startServer(port) {
  const server = createServer((request, response) => {
    const filePath = resolvePath(request.url || '/');
    const extension = extname(filePath).toLowerCase();
    response.writeHead(200, {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    createReadStream(filePath).pipe(response);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      startServer(port + 1);
      return;
    }

    throw error;
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`Static preview ready: http://127.0.0.1:${port}/`);
  });
}

startServer(initialPort);
