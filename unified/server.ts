/**
 * unified/server.ts — Main entry with real UI mount (TypeScript, ESM-safe)
 * - Serves /ui and /health with Express
 * - ESM-compatible __dirname using import.meta.url
 * - Honors SERVER_UI_PORT / UI_PORT and UI_BIND
 */
import "dotenv/config";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createUiServer(opts: { bind?: string; port?: number; sseHandler?: express.RequestHandler } = {}) {
  const bind = opts.bind || process.env.UI_BIND || "127.0.0.1";
  const port = Number(opts.port ?? process.env.SERVER_UI_PORT ?? process.env.UI_PORT ?? 3002);

  const app = express();
  app.disable("x-powered-by");

  // Health endpoint
  app.get("/health", (_req, res) => res.status(200).send("OK"));

  // Optional SSE placeholder
  if (opts.sseHandler) {
    app.get("/api/a2a/feed", opts.sseHandler);
  }

  // Resolve UI dir robustly for both ts-node and compiled dist
  let uiDir: string = "";
  const tryPaths = [
    path.resolve(__dirname, "..", "ui"),          // when running ts-node from project root
    path.resolve(__dirname, "..", "..", "ui"),    // when running compiled from dist/
    path.resolve(process.cwd(), "ui"),            // fallback to CWD/ui
  ];
  for (const p of tryPaths) {
    if (fs.existsSync(path.join(p, "index.html"))) {
      uiDir = p;
      break;
    }
  }
  if (!uiDir) uiDir = path.resolve(process.cwd(), "ui");

  app.get("/ui", (_req, res) => {
    const indexPath = path.join(uiDir, "index.html");
    if (!fs.existsSync(indexPath)) {
      return res.status(500).send("ui/index.html not found");
    }
    res.sendFile(indexPath);
  });
  app.use("/ui", express.static(uiDir, { fallthrough: true, index: false }));

  const server = http.createServer(app);
  server.listen(port, bind, () => {
    console.log(`[Nexus6] UI listening on http://${bind}:${port}/ui`);
    console.log(`[Nexus6] UI dir: ${uiDir}`);
  });

  return { app, server, port, bind };
}

// === MCP stdio bootstrap (existing/main implementation placeholder) ===
console.log("[Nexus6] MCP stdio server should initialize here on MAIN...");

// Optional SSE placeholder; wire real handler later
const sseHandler: express.RequestHandler | undefined = undefined;

// Start UI server
createUiServer({ sseHandler });

process.on("SIGINT", () => {
  console.log("Shutting down...");
  process.exit(0);
});