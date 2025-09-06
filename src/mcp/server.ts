// src/mcp/server.ts
// Nexus6 stdio MCP server — uses MCP SDK `Server`, params-first handlers, STDERR logging, Zod validation, retry/backoff.
// Handlers return ONLY { content: [...] } and throw on errors. Never write to STDOUT manually.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ───────────────────────────────────────────────────────────────────────────────
// Config (validated)
// ───────────────────────────────────────────────────────────────────────────────
interface Config {
  airtable: { apiKey: string; defaultBaseId?: string };
  github: { token: string; owner: string; repo: string; defaultBranch: string };
  server: { name: string; version: string };
}

function loadConfig(): Config {
  const req = ["AIRTABLE_API_KEY", "GITHUB_TOKEN"] as const;
  const missing = req.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing required env: ${missing.join(", ")}`);
  return {
    airtable: {
      apiKey: process.env.AIRTABLE_API_KEY!,
      defaultBaseId: process.env.AIRTABLE_BASE_ID
    },
    github: {
      token: process.env.GITHUB_TOKEN!,
      owner: process.env.GITHUB_OWNER || "Link-Synapse",
      repo: process.env.GITHUB_REPO || "nexus6-uni-mcp-server",
      defaultBranch: process.env.GITHUB_BRANCH || process.env.GITHUB_DEFAULT_BRANCH || "main"
    },
    server: {
      name: process.env.N6_SERVER_NAME || "nexus6-mcp",
      version: process.env.N6_SERVER_VERSION || "1.0.0"
    }
  };
}

const cfg = loadConfig();

// ───────────────────────────────────────────────────────────────────────────────
// Logging — STDERR ONLY (never write to STDOUT yourself)
// ───────────────────────────────────────────────────────────────────────────────
function stderr(obj: unknown) {
  try {
    process.stderr.write((typeof obj === "string" ? obj : JSON.stringify(obj)) + "\n");
  } catch { /* ignore */ }
}
class Logger {
  static info(message: string, ctx: Record<string, unknown> = {}) {
    stderr({ level: "info", message, ts: new Date().toISOString(), svc: "nexus6-mcp", ...ctx });
  }
  static error(message: string, ctx: Record<string, unknown> = {}) {
    stderr({ level: "error", message, ts: new Date().toISOString(), svc: "nexus6-mcp", ...ctx });
  }
  static debug(message: string, ctx: Record<string, unknown> = {}) {
    if (process.env.NODE_ENV === "development") {
      stderr({ level: "debug", message, ts: new Date().toISOString(), svc: "nexus6-mcp", ...ctx });
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers (retry/backoff)
// ───────────────────────────────────────────────────────────────────────────────
async function withRetry<T>(op: () => Promise<T>, maxRetries = 3, baseDelayMs = 1000, opName = "operation"): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      attempt++;
      return await op();
    } catch (err: any) {
      const status = err?.response?.status;
      if (attempt >= maxRetries || status !== 429) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      Logger.info(`Rate limited; retrying ${opName} in ${delay}ms`, { attempt, status });
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Schemas
// ───────────────────────────────────────────────────────────────────────────────
const AirtableListSchema = z.object({
  baseId: z.string().min(1).optional(), // allow fallback to env
  table: z.string().min(1),
  maxRecords: z.number().int().positive().max(1000).optional(),
  view: z.string().optional(),
  filterByFormula: z.string().optional()
});

const GitHubFileSchema = z.object({
  path: z.string().min(1).refine((p) => !p.includes("..") && !p.startsWith("/"), "Invalid file path"),
  content: z.string().max(1024 * 1024, "Content too large (max 1MB)"),
  message: z.string().min(1),
  branch: z.string().optional()
});

// ───────────────────────────────────────────────────────────────────────────────
// External ops
// ───────────────────────────────────────────────────────────────────────────────
async function airtableList(params: {
  apiKey: string; baseId: string; table: string; maxRecords?: number; view?: string; filterByFormula?: string;
}) {
  const url = new URL(`https://api.airtable.com/v0/${params.baseId}/${encodeURIComponent(params.table)}`);
  if (params.maxRecords) url.searchParams.set("maxRecords", String(params.maxRecords));
  if (params.view) url.searchParams.set("view", params.view);
  if (params.filterByFormula) url.searchParams.set("filterByFormula", params.filterByFormula);

  return withRetry(async () => {
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${params.apiKey}`, "Content-Type": "application/json" }});
    if (!res.ok) {
      if (res.status === 401) throw new Error("Invalid Airtable credentials");
      if (res.status === 404) throw new Error(`Table '${params.table}' not found in base '${params.baseId}'`);
      if (res.status === 422) throw new Error("Invalid request parameters");
      const text = await res.text().catch(() => "");
      throw new Error(`Airtable API error: ${res.status} ${text}`);
    }
    const data: any = await res.json();
    Logger.info("Airtable records retrieved", { table: params.table, count: data?.records?.length || 0, hasMore: !!data?.offset });
    return data;
  }, 3, 1000, "airtable_list_records");
}

async function githubCreateOrUpdate(params: {
  token: string; owner: string; repo: string; path: string; content: string; message: string; branch?: string;
}) {
  const branch = params.branch || cfg.github.defaultBranch;
  const headers = { Authorization: `token ${params.token}`, "Content-Type": "application/json", "User-Agent": "Nexus6-MCP-Server" };
  const getUrl = `https://api.github.com/repos/${params.owner}/${params.repo}/contents/${encodeURIComponent(params.path)}?ref=${encodeURIComponent(branch)}`;
  const putUrl = `https://api.github.com/repos/${params.owner}/${params.repo}/contents/${encodeURIComponent(params.path)}`;

  return withRetry(async () => {
    let sha: string | undefined;
    try {
      const existing = await fetch(getUrl, { headers });
      if (existing.ok) {
        const js: any = await existing.json();
        sha = js?.sha;
        Logger.debug("File exists; will update", { path: params.path, sha });
      }
    } catch { /* not found → create */ }

    const body: any = {
      message: params.message,
      content: Buffer.from(params.content, "utf8").toString("base64"),
      branch
    };
    if (sha) body.sha = sha;

    const put = await fetch(putUrl, { method: "PUT", headers, body: JSON.stringify(body) });
    if (!put.ok) {
      if (put.status === 401) throw new Error("Invalid GitHub credentials");
      if (put.status === 404) throw new Error(`Repository '${params.owner}/${params.repo}' not found`);
      if (put.status === 409) throw new Error("File conflict: file was modified by another process");
      let msg = put.statusText;
      try {
        const errJs: any = await put.json();
        if (errJs && typeof errJs === "object" && "message" in errJs) msg = String(errJs.message);
      } catch {
        try { const errText = await put.text(); if (errText) msg = errText; } catch { /* ignore */ }
      }
      throw new Error(`GitHub API error: ${put.status} ${msg}`);
    }

    const result: any = await put.json();
    Logger.info("GitHub file operation completed", { path: params.path, operation: sha ? "updated" : "created", sha: result?.content?.sha });
    return result;
  }, 3, 1000, "github_create_or_update_file");
}

// ───────────────────────────────────────────────────────────────────────────────
// Server (MCP) — use `Server`, not `McpServer`
// ───────────────────────────────────────────────────────────────────────────────
const server = new Server(
  { name: cfg.server.name, version: cfg.server.version },
  { capabilities: { tools: {} } }
);

// Idempotent registration
const registered = new Set<string>();
function safeTool(
  name: string,
  description: string,
  schema: Record<string, unknown>,
  handler: (params: unknown) => Promise<{ content: Array<{ type: "json" | "text"; json?: unknown; text?: string }> }>
) {
  if (registered.has(name)) return;
  server.tool(name, description, schema as any, handler);
  registered.add(name);
  Logger.debug("Tool registered", { tool: name });
}

// debug_echo
safeTool(
  "debug_echo",
  "Echo back the raw params received by the handler.",
  { type: "object", properties: {}, additionalProperties: true },
  async (params) => {
    return { content: [{ type: "json", json: { received: params ?? {} } }] };
  }
);

// airtable_list_records
safeTool(
  "airtable_list_records",
  "List records from an Airtable table",
  {
    type: "object",
    properties: {
      baseId: { type: "string", description: "Airtable base ID (optional if default set in env)" },
      table: { type: "string", description: "Table name" },
      maxRecords: { type: "number", description: "Max rows (1-1000)" },
      view: { type: "string", description: "View name" },
      filterByFormula: { type: "string", description: "Airtable formula filter" }
    },
    required: ["table"]
  },
  async (params) => {
    const p = AirtableListSchema.parse(params ?? {});
    const baseId = p.baseId || cfg.airtable.defaultBaseId;
    if (!baseId) throw new Error("baseId is required (not set in params or AIRTABLE_BASE_ID).");
    const data = await airtableList({
      apiKey: cfg.airtable.apiKey,
      baseId,
      table: p.table,
      maxRecords: p.maxRecords,
      view: p.view,
      filterByFormula: p.filterByFormula
    });
    return { content: [{ type: "json", json: data }] };
  }
);

// github_create_or_update_file
safeTool(
  "github_create_or_update_file",
  "Create or update a file in the configured GitHub repo",
  {
    type: "object",
    properties: {
      path: { type: "string", description: "File path in repo (no leading slash)" },
      content: { type: "string", description: "UTF-8 content" },
      message: { type: "string", description: "Commit message" },
      branch: { type: "string", description: "Branch (defaults to env)" }
    },
    required: ["path", "content", "message"]
  },
  async (params) => {
    const p = GitHubFileSchema.parse(params ?? {});
    const result = await githubCreateOrUpdate({
      token: cfg.github.token,
      owner: cfg.github.owner,
      repo: cfg.github.repo,
      path: p.path,
      content: p.content,
      message: p.message,
      branch: p.branch || cfg.github.defaultBranch
    });
    return { content: [{ type: "json", json: result }] };
  }
);

// ───────────────────────────────────────────────────────────────────────────────
// Start stdio transport (no stdout logs)
// ───────────────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);

// Graceful shutdown (stderr only)
process.on("SIGINT", () => { Logger.info("Shutting down Nexus6 MCP Server"); process.exit(0); });
process.on("SIGTERM", () => { Logger.info("Shutting down Nexus6 MCP Server"); process.exit(0); });
