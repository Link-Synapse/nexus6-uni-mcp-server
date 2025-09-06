/* eslint-env node */
/**
 * Nexus6 UI Fallback Server (no external deps)
 * - Serves /ui and /health on PORT (default 3002)
 * - Static files under ./ui (relative to project root when extracted)
 * Usage:
 *   node .\scripts\dev-ui.cjs
 * Env:
 *   SERVER_UI_PORT or UI_PORT
 */

const http = require("node:http");
const fs   = require("node:fs");
const path = require("node:path");
const url  = require("node:url");

const PORT = process.env.SERVER_UI_PORT || process.env.UI_PORT || "3002";
const BIND = process.env.UI_BIND || "127.0.0.1";

const projectRoot = process.cwd();
const uiDir = path.resolve(projectRoot, "ui");

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", ...headers });
  res.end(body);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = ext === ".html" ? "text/html; charset=utf-8"
              : ext === ".js"   ? "application/javascript; charset=utf-8"
              : ext === ".css"  ? "text/css; charset=utf-8"
              : "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url || "/");
  const pathname = parsed.pathname || "/";
  if (pathname === "/health") {
    return send(res, 200, "OK");
  }
  if (pathname === "/ui" || pathname === "/ui/") {
    const indexPath = path.join(uiDir, "index.html");
    return serveFile(res, indexPath);
  }
  // allow serving static assets under /ui/*
  if (pathname.startsWith("/ui/")) {
    const rel = pathname.replace(/^\/ui\//, "");
    const fp = path.join(uiDir, rel);
    return serveFile(res, fp);
  }
  send(res, 404, "Unknown route");
});

server.listen(Number(PORT), BIND, () => {
  console.log(`[Nexus6] Fallback UI server listening on http://${BIND}:${PORT}/ui`);
  console.log(`[Nexus6] Serving UI files from: ${uiDir}`);
});