
/* Minimal Nexus6 unified MCP server (Node.js) */
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const crypto = require('crypto');
const cors = require('cors');

const PORT_UI = process.env.PORT_UI || 3002;
const PORT_MCP = process.env.PORT_MCP || 3001;
const app = express();
app.use(cors());
app.use(express.json());
app.use('/ui', express.static(path.join(__dirname, '..', 'ui')));

const LOG_PATH = path.join(__dirname, '..', 'logs', 'a2a.ndjson');
fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });

// Append-only state log (file-level)
app.post('/api/log', (req, res) => {
  const { agent = 'Axlon', message = '' } = req.body || {};
  const line = `- ${new Date().toISOString()} — ${agent}: ${message}\n`;
  fs.appendFileSync(path.join(__dirname, '..', 'STATE_LOG.md'), line, 'utf8');
  res.type('text/plain').send('ok');
});

// Simple hashing endpoint
app.post('/api/hash', async (req, res) => {
  const text = (req.body && req.body.text) || '';
  const sha = crypto.createHash('sha256').update(text, 'utf8').digest('hex');
  res.type('text/plain').send(sha);
});

// A2A feed (SSE) and message post
const clients = new Set();
app.get('/api/a2a/feed', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

app.post('/api/a2a/message', (req, res) => {
  const payload = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    from: req.body?.from || 'Axlon',
    to: req.body?.to || 'Claude',
    project: req.body?.project || 'nexus6',
    subject: req.body?.subject || '',
    body: req.body?.body || '',
    correlationId: req.body?.correlationId || null
  };
  fs.appendFileSync(LOG_PATH, JSON.stringify(payload) + '\n', 'utf8');
  for (const c of clients) c.write(`data: ${JSON.stringify(payload)}\n\n`);
  res.json({ ok: true, id: payload.id });
});

// MCP WS placeholder (bind only; actual MCP handlers to be added later)
const ws = require('ws');
const wss = new ws.Server({ port: PORT_MCP });
wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'hello', ok: true, server: 'nexus6-uni-mcp' }));
  socket.on('message', (data) => {
    // echo + stub
    socket.send(JSON.stringify({ type: 'echo', data: data.toString() }));
  });
});

// Start HTTP (UI + API)
const server = http.createServer(app);
server.listen(PORT_UI, () => {
  console.log(`[UI] http://localhost:${PORT_UI}/ui`);
  console.log(`[A2A] SSE feed: /api/a2a/feed`);
});
console.log(`[MCP] WebSocket listening on ws://localhost:${PORT_MCP}`);
