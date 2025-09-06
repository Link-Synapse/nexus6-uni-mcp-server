/**
 * Nexus6 MCP Server — Phase 1 Architect Features
 * - Memory subsystem (file-backed KV with TTL)
 * - Role prompts loader (Axlon & Claude)
 * - Doc orchestration endpoints (list/pull/push)
 * - A2A SSE feed + UI static server
 *
 * Ports:
 *   MCP (future stdio/ws): 3001 (placeholder)
 *   UI/REST:               3002
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import fse from "fs-extra";
import crypto from "crypto";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

import { AirtableAdapter } from "../adapters/airtable.js";
import { GitHubAdapter } from "../adapters/github.js";
import { Memory } from "./memory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT_UI = process.env.N6_UI_PORT ? Number(process.env.N6_UI_PORT) : 3002;
// Placeholder for future MCP stdio/ws server on 3001

// Resolve project dirs
const ROOT = path.resolve(__dirname, "..");
const UI_DIR = path.resolve(ROOT, "ui");
const LOG_DIR = path.resolve(ROOT, "logs");
const PROJECTS_DIR = path.resolve(ROOT, "projects");
const PROMPTS_DIR = path.resolve(ROOT, "prompts");
const STATE_LOG = path.resolve(ROOT, "STATE_LOG.md");

fse.ensureDirSync(LOG_DIR);
fse.ensureDirSync(PROJECTS_DIR);

// Load configs
const airtableCfgPath = path.resolve(ROOT, "config", "airtable.json");
const githubCfgPath = path.resolve(ROOT, "config", "github.json");
const projectsCfgPath = path.resolve(ROOT, "config", "projects.json");

const airtableCfg = fse.pathExistsSync(airtableCfgPath) ? JSON.parse(fs.readFileSync(airtableCfgPath, "utf-8")) : {};
const githubCfg = fse.pathExistsSync(githubCfgPath) ? JSON.parse(fs.readFileSync(githubCfgPath, "utf-8")) : {};
const projectsCfg = fse.pathExistsSync(projectsCfgPath) ? JSON.parse(fs.readFileSync(projectsCfgPath, "utf-8")) : { projects: [] };

// Init adapters
const airtable = new AirtableAdapter(airtableCfg);
const github = new GitHubAdapter(githubCfg);

// Init memory
const memoryPath = path.resolve(LOG_DIR, "memory.json");
const memory = new Memory(memoryPath);

// SSE (A2A feed)
const sseClients = new Map(); // id -> res

function sseBroadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients.values()) {
    res.write(payload);
  }
}

// Express app
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Static UI
app.use("/ui", express.static(UI_DIR));

// Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now(), ui: PORT_UI });
});

// SSE feed
app.get("/api/a2a/feed", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  const id = nanoid();
  sseClients.set(id, res);
  req.on("close", () => sseClients.delete(id));
  res.write(`event: hello\ndata: ${JSON.stringify({ id, ts: Date.now() })}\n\n`);
});

// ----- Role Prompts -----
function readPrompt(name) {
  const fp = path.resolve(PROMPTS_DIR, `${name}.md`);
  if (!fse.pathExistsSync(fp)) return null;
  return fs.readFileSync(fp, "utf-8");
}

app.get("/api/prompts/:role", (req, res) => {
  const txt = readPrompt(req.params.role);
  if (!txt) return res.status(404).json({ error: "prompt_not_found" });
  res.type("text/markdown").send(txt);
});

// ----- Memory API -----
// POST /api/memory/set  { namespace, key, value, ttlSeconds? }
app.post("/api/memory/set", (req, res) => {
  const { namespace, key, value, ttlSeconds } = req.body || {};
  if (!namespace || !key) return res.status(400).json({ error: "missing_namespace_or_key" });
  memory.set(namespace, key, value, ttlSeconds ? Number(ttlSeconds) : undefined);
  sseBroadcast("memory.set", { namespace, key });
  res.json({ ok: true });
});

// GET /api/memory/get?namespace=&key=
app.get("/api/memory/get", (req, res) => {
  const { namespace, key } = req.query || {};
  if (!namespace || !key) return res.status(400).json({ error: "missing_namespace_or_key" });
  const value = memory.get(String(namespace), String(key));
  res.json({ value });
});

// GET /api/memory/list?namespace=
app.get("/api/memory/list", (req, res) => {
  const { namespace } = req.query || {};
  if (!namespace) return res.status(400).json({ error: "missing_namespace" });
  res.json({ keys: memory.list(String(namespace)) });
});

// ----- STATE_LOG append -----
// POST /api/log { agent, message, project? }
app.post("/api/log", (req, res) => {
  const { agent, message, project } = req.body || {};
  if (!agent || !message) return res.status(400).json({ error: "missing_agent_or_message" });
  const line = `- ${dayjs().format("YYYY-MM-DD HH:mm:ss")} | ${agent}${project ? "@" + project : ""} | ${message}`;
  fse.ensureFileSync(STATE_LOG);
  let content = "";
  if (fse.pathExistsSync(STATE_LOG)) content = fs.readFileSync(STATE_LOG, "utf-8");
  if (!content.includes("# STATE_LOG")) {
    content = "# STATE_LOG.md (append-only)\n\n" + content;
  }
  fs.writeFileSync(STATE_LOG, content + (content.endsWith("\n") ? "" : "\n") + line + "\n", "utf-8");
  sseBroadcast("state_log.append", { agent, project, message });
  res.json({ ok: true });
});

// ----- Doc Orchestration -----
// List GitHub repo docs
app.get("/api/repo/docs", async (_req, res) => {
  try {
    const docs = await github.listRepoDocs();
    res.json({ docs });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Read one GitHub doc by slug
app.get("/api/repo/doc", async (req, res) => {
  try {
    const slug = String(req.query.slug || "");
    if (!slug) return res.status(400).json({ error: "missing_slug" });
    const doc = await github.readRepoDoc(slug);
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Push an Airtable Doc (approved) into GitHub docs directory
// body: { project, slug }
app.post("/api/repo/push", async (req, res) => {
  try {
    const { project, slug } = req.body || {};
    if (!project || !slug) return res.status(400).json({ error: "missing_project_or_slug" });
    const doc = await airtable.readDoc(project, slug);
    if (!doc) return res.status(404).json({ error: "doc_not_found" });
    if (String(doc.status || "").toLowerCase() !== "approved") {
      return res.status(400).json({ error: "status_not_approved" });
    }
    const commit = await github.pushDoc(slug, `# ${doc.name}\n\n${doc.content}\n`);
    sseBroadcast("repo.push", { project, slug, sha: commit.sha });
    res.json(commit);
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// List Airtable docs (optional filter by project)
app.get("/api/airtable/docs", async (req, res) => {
  try {
    const project = req.query.project ? String(req.query.project) : undefined;
    const docs = await airtable.listDocs(project);
    res.json({ docs });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Read Airtable doc
app.get("/api/airtable/doc", async (req, res) => {
  try {
    const { project, slug } = req.query || {};
    if (!project || !slug) return res.status(400).json({ error: "missing_project_or_slug" });
    const doc = await airtable.readDoc(String(project), String(slug));
    if (!doc) return res.status(404).json({ error: "doc_not_found" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Start server
app.listen(PORT_UI, () => {
  console.log(`[Nexus6] UI+REST on http://localhost:${PORT_UI}/ui`);
  console.log(`[Nexus6] REST base http://localhost:${PORT_UI}/api`);
});
