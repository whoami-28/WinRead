const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const QRCode = require('qrcode');

/**
 * Generate a real, 100% camera-scannable SVG QR Code
 */
async function generateQrSvg(text) {
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#ececf0',
        light: '#121215'
      }
    });
  } catch (err) {
    return `<svg viewBox="0 0 100 100"><text x="10" y="50" fill="red">QR Error</text></svg>`;
  }
}

/**
 * Get non-internal local IPv4 addresses
 */
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }

  if (addresses.length === 0) {
    addresses.push('127.0.0.1');
  }
  return addresses;
}

class SyncServer {
  constructor(db, options = {}) {
    this.db = db;
    this.port = options.port || 8765;
    this.httpServer = null;
    this.wss = null;
    this.activePort = this.port;
    this.onEventCallback = null;
  }

  setEventListener(cb) {
    this.onEventCallback = cb;
  }

  emitEvent(eventName, payload) {
    if (this.onEventCallback) {
      this.onEventCallback(eventName, payload);
    }
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.httpServer = http.createServer((req, res) => this.handleHttp(req, res));

      this.httpServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          // Port taken, try next port
          this.port++;
          this.httpServer.listen(this.port);
        } else {
          reject(err);
        }
      });

      this.httpServer.listen(this.port, () => {
        this.activePort = this.httpServer.address().port;
        this.wss = new WebSocketServer({ server: this.httpServer });

        this.wss.on('connection', (ws) => {
          this.emitEvent('sync:connected', { clientsCount: this.wss.clients.size });

          ws.on('message', (message) => {
            try {
              const data = JSON.parse(message.toString());
              this.handleWsMessage(ws, data);
            } catch (err) {
              ws.send(JSON.stringify({ type: 'error', error: err.message }));
            }
          });

          ws.on('close', () => {
            this.emitEvent('sync:disconnected', { clientsCount: this.wss.clients.size });
          });
        });

        resolve({
          port: this.activePort,
          ips: getLocalIpAddresses()
        });
      });
    });
  }

  async getInfo() {
    const ips = getLocalIpAddresses();
    const primaryUrl = `http://${ips[0]}:${this.activePort}`;
    const qrSvg = await generateQrSvg(primaryUrl);
    return {
      serverName: 'WinRead Sync Server',
      version: '1.0.0',
      port: this.activePort,
      ips,
      primaryUrl,
      qrSvg
    };
  }

  async handleHttp(req, res) {
    // CORS headers for local LAN access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://localhost:${this.activePort}`);
    const pathname = parsedUrl.pathname;

    try {
      if (pathname === '/api/info') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.getInfo()));
        return;
      }

      if (pathname === '/api/library') {
        const library = this.db.getLibrary();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ books: library }));
        return;
      }

      if (pathname === '/api/sync' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const payload = JSON.parse(body);
            this.emitEvent('sync:started', { source: req.socket.remoteAddress });

            // Apply incoming payload with Last-Write-Wins
            const result = this.db.applyLwwSyncBundle(payload);

            // Fetch server changes to send back to client
            const serverChanges = this.db.getSyncBundle(payload.sinceTimestamp || 0);

            this.emitEvent('sync:updated', { appliedCount: result.appliedCount });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              appliedCount: result.appliedCount,
              serverBundle: serverChanges
            }));
          } catch (err) {
            this.emitEvent('sync:error', { error: err.message });
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      // Range Chunk Streaming: /api/books/:id/stream
      const streamMatch = pathname.match(/^\/api\/books\/([^\/]+)\/stream$/);
      if (streamMatch) {
        const bookId = streamMatch[1];
        const book = this.db.getBook(bookId);

        if (!book || !book.path || !fs.existsSync(book.path)) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Book file not found on desktop' }));
          return;
        }

        const stat = fs.statSync(book.path);
        const fileSize = stat.size;
        const range = req.headers.range;

        res.setHeader('Accept-Ranges', 'bytes');

        if (!range) {
          // Serve whole file or first chunk
          res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'application/octet-stream'
          });
          fs.createReadStream(book.path).pipe(res);
          return;
        }

        // Parse Range: bytes=start-end
        const parts = range.replace(/bytes=/, '').split('-');
        let start = parseInt(parts[0], 10);
        let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (isNaN(start)) {
          // Range: bytes=-length (suffix)
          start = fileSize - parseInt(parts[1], 10);
          end = fileSize - 1;
        }

        if (start >= fileSize || end >= fileSize || start > end) {
          res.writeHead(416, { 'Content-Range': `bytes */${fileSize}` });
          res.end();
          return;
        }

        const chunkSize = end - start + 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Content-Length': chunkSize,
          'Content-Type': 'application/octet-stream'
        });

        const fileStream = fs.createReadStream(book.path, { start, end });
        fileStream.pipe(res);
        return;
      }

      // Companion Web UI for mobile browser pairing
      if (pathname === '/companion' || pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(this.getCompanionHtml());
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  }

  handleWsMessage(ws, data) {
    if (data.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
    } else if (data.type === 'sync') {
      const result = this.db.applyLwwSyncBundle(data.bundle);
      const changes = this.db.getSyncBundle(data.sinceTimestamp || 0);
      ws.send(JSON.stringify({
        type: 'sync:response',
        appliedCount: result.appliedCount,
        serverBundle: changes
      }));
      this.emitEvent('sync:updated', { appliedCount: result.appliedCount });
    }
  }

  broadcast(type, payload) {
    if (!this.wss) return;
    const msg = JSON.stringify({ type, payload });
    for (const client of this.wss.clients) {
      if (client.readyState === 1) {
        client.send(msg);
      }
    }
  }

  getCompanionHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WinRead Mobile Companion</title>
  <style>
    :root {
      --bg: #0d0d0f;
      --card: #16161a;
      --border: #23242a;
      --text: #e2e2e7;
      --muted: #8e8e98;
      --accent: #d8a050;
    }
    body {
      margin: 0;
      padding: 16px;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    h1 { font-size: 1.25rem; margin: 0; font-weight: 600; letter-spacing: -0.02em; }
    .badge {
      font-size: 0.75rem;
      padding: 4px 8px;
      background: #1c261e;
      color: #52c41a;
      border-radius: 12px;
      border: 1px solid #274929;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      margin-top: 16px;
    }
    .book-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--border);
    }
    .book-item:last-child { border-bottom: none; }
    .title { font-weight: 500; font-size: 0.95rem; }
    .author { font-size: 0.8rem; color: var(--muted); margin-top: 2px; }
    .progress { font-size: 0.85rem; color: var(--accent); font-weight: 600; }
    button {
      width: 100%;
      background: #25262c;
      color: var(--text);
      border: 1px solid var(--border);
      padding: 12px;
      border-radius: 8px;
      margin-top: 16px;
      font-weight: 600;
      cursor: pointer;
    }
    button:active { background: #32333b; }
  </style>
</head>
<body>
  <div class="header">
    <h1>WinRead Companion</h1>
    <span class="badge">Connected</span>
  </div>
  <div class="card">
    <div style="font-size: 0.85rem; color: var(--muted);">Connected to Desktop Library</div>
    <div id="booksList" style="margin-top: 12px;">Loading books...</div>
    <button onclick="fetchLibrary()">Refresh Library</button>
  </div>
  <script>
    async function fetchLibrary() {
      try {
        const res = await fetch('/api/library');
        const data = await res.json();
        const list = document.getElementById('booksList');
        if (!data.books || data.books.length === 0) {
          list.innerHTML = '<div style="color:var(--muted);padding:8px 0;">No books open on desktop.</div>';
          return;
        }
        list.innerHTML = data.books.map(b => \`
          <div class="book-item">
            <div>
              <div class="title">\${b.title}</div>
              <div class="author">\${b.author || 'Unknown'} · \${b.reading_status}</div>
            </div>
            <div class="progress">\${Math.round(b.progress_percent)}%</div>
          </div>
        \`).join('');
      } catch (err) {
        document.getElementById('booksList').innerHTML = '<div style="color:#ff6b6b">Error: ' + err.message + '</div>';
      }
    }
    fetchLibrary();
  </script>
</body>
</html>`;
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = null;
    }
  }
}

module.exports = { SyncServer, getLocalIpAddresses, generateQrSvg };
