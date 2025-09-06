// ESM version of the minimal Nexus6 UI/A2A server
import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT_UI = process.env.PORT_UI || 3002;

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(
  compression({
    filter: (req, res) => {
      // Avoid compressing Server-Sent Events to prevent buffering issues
      if (req.path === "/api/a2a/feed") return false;
      const accept = req.headers["accept"] || "";
      if (typeof accept === "string" && accept.includes("text/event-stream")) return false;
      return compression.filter(req, res);
    },
  })
);
app.use(
  "/ui",
  express.static(path.join(__dirname, "..", "ui"), {
    etag: true,
    lastModified: true,
    maxAge: "1h",
    setHeaders: (res, filePath) => {
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-store");
      } else if (/\.(js|css)$/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=3600");
      } else if (/\.(png|svg|ico|jpg|jpeg|webp)$/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  })
);

const LOG_PATH = path.join(__dirname, "..", "logs", "a2a.ndjson");
fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });

app.post("/api/log", async (req, res) => {
  const { agent = "Axlon", message = "" } = req.body || {};
  const line = `- ${new Date().toISOString()} — ${agent}: ${message}\n`;
  try {
    await fsp.appendFile(path.join(__dirname, "..", "STATE_LOG.md"), line, "utf8");
    res.type("text/plain").send("ok");
  } catch (e) {
    res.status(500).type("text/plain").send("error");
  }
});

app.post("/api/hash", async (req, res) => {
  const text = (req.body && req.body.text) || "";
  const sha = crypto.createHash("sha256").update(text, "utf8").digest("hex");
  res.type("text/plain").send(sha);
});

const clients = new Set();
app.get("/api/a2a/feed", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }
  res.write("\n");
  clients.add(res);
  const heartbeat = setInterval(() => {
    res.write(":heartbeat\n\n");
  }, 25000);
  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

app.post("/api/a2a/message", async (req, res) => {
  const payload = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    from: req.body?.from || "Axlon",
    to: req.body?.to || "Claude",
    project: req.body?.project || "nexus6",
    subject: req.body?.subject || "",
    body: req.body?.body || "",
    correlationId: req.body?.correlationId || null,
  };
  try {
    await fsp.appendFile(LOG_PATH, JSON.stringify(payload) + "\n", "utf8");
  } catch {}
  for (const c of clients) c.write(`data: ${JSON.stringify(payload)}\n\n`);
  res.json({ ok: true, id: payload.id });
});

app.post("/api/a2a/message", (req, res) => {
  const payload = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    from: req.body?.from || "Axlon",
    to: req.body?.to || "Claude",
    project: req.body?.project || "nexus6",
    subject: req.body?.subject || "",
    body: req.body?.body || "",
    correlationId: req.body?.correlationId || null,
  };
  fs.appendFileSync(LOG_PATH, JSON.stringify(payload) + "\n", "utf8");
  for (const c of clients) c.write(`data: ${JSON.stringify(payload)}\n\n`);
  res.json({ ok: true, id: payload.id });
});

const server = http.createServer(app);
server.listen(PORT_UI, () => {
  console.log(`[UI] http://localhost:${PORT_UI}/ui`);
  console.log(`[A2A] SSE: /api/a2a/feed`);
});
