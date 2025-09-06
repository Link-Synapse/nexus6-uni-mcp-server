// Nexus6 MCP — unified server (Phase 1 ready)

import { McpServer } from "@modelcontextprotocol/sdk/server";
import { stdioTransport } from "@modelcontextprotocol/sdk/stdio-transport";
import { JSONSchema } from "@modelcontextprotocol/sdk/types";

import { loadConfig } from "../config/environment.js";
import { AirtableAdapter } from "../airtable/adapter.js";
import { GitHubAdapter } from "../github/adapter.js";

// Phase 1 Architect tools (memory, roles, doc ops)
import { registerPhase1Tools } from "../features/phase1/registerTools";

// Types for minimal example tools
type Dict = Record<string, unknown>;

async function main() {
  // 1) Load config + construct adapters (no secrets here; they must come from env)
  const cfg = loadConfig();
  const airtable = new AirtableAdapter(
    cfg.airtable.apiKey || "",
    cfg.airtable.baseId || ""
  );
  const github = new GitHubAdapter(
    cfg.github.token || "",
    cfg.github.owner || "",
    cfg.github.repo || ""
  );

  // 2) Start MCP server
  const server = new McpServer();

  // 2a) Minimal health tool (quick sanity from Claude)
  server.tool(
    "nexus6.health",
    {
      description: "Return server health and basic config visibility (no secrets).",
      inputSchema: { type: "object", properties: {} } as JSONSchema,
    },
    async () => {
      return {
        ok: true,
        ts: new Date().toISOString(),
        githubOwner: cfg.github.owner ?? null,
        githubRepo: cfg.github.repo ?? null,
        airtableBase: cfg.airtable.baseId ? mask(cfg.airtable.baseId) : null,
      };
    }
  );

  // 2b) Safe example: list Airtable tables (read-only)
  // Adjust if your AirtableAdapter has a different API.
  server.tool(
    "airtable.listTables",
    {
      description: "List Airtable tables for the configured base (read-only).",
      inputSchema: { type: "object", properties: {} } as JSONSchema,
    },
    async () => {
      try {
        // If your adapter uses another method, change here.
        // Many Airtable SDK flows can list tables via meta API; keep as placeholder:
        const meta = await (airtable as any).listTables?.();
        return { tables: meta ?? [] };
      } catch (err: any) {
        return {
          error: "Failed to list tables",
          message: err?.message ?? String(err),
          ts: new Date().toISOString(),
        };
      }
    }
  );

  // 2c) Safe example: show a repo root listing (read-only)
  // If your GitHubAdapter API differs, adapt the call signature.
  server.tool(
    "github.listRoot",
    {
      description:
        "List files at repository root (read-only; uses configured owner/repo).",
      inputSchema: { type: "object", properties: {} } as JSONSchema,
    },
    async () => {
      try {
        // Placeholder call; adjust to your adapter’s method
        const files = await (github as any).listRepoRoot?.();
        return { files: files ?? [] };
      } catch (err: any) {
        return {
          error: "Failed to list repo root",
          message: err?.message ?? String(err),
          ts: new Date().toISOString(),
        };
      }
    }
  );

  // 3) Register Phase 1 Architect tools (memory, roles, doc ops)
  registerPhase1Tools(server, { baseDir: process.cwd() });

  // 4) Connect stdio transport (Claude Desktop will talk to us here)
  const transport = stdioTransport();
  await server.connect(transport);

  console.error("[Nexus6] MCP server up (Phase 1).");
}

main().catch((e) => {
  console.error("MCP server failed:", { message: e?.message, ts: new Date().toISOString() });
  process.exit(1);
});

// --- helpers ---
function mask(s: string, visible = 4) {
  if (!s) return s;
  const n = Math.max(0, s.length - visible);
  return "*".repeat(n) + s.slice(-visible);
}
