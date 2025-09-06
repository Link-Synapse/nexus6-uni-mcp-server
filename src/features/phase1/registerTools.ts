import { McpServer } from "@modelcontextprotocol/sdk/server";
import { JSONSchema } from "@modelcontextprotocol/sdk/types";
import { MemoryStore } from "../memory/memoryStore";
import { splitTextByTokens, sha256Hex } from "../orchestration/docOrchestrator";
import * as path from "path";

export interface Phase1Options {
  baseDir?: string;
}

export function registerPhase1Tools(server: McpServer, opts: Phase1Options = {}) {
  const baseDir = opts.baseDir || process.cwd();
  const mem = new MemoryStore(baseDir);

  server.tool("memory.add", {
    description: "Add a memory note",
    inputSchema: { type: "object", required: ["text"], properties: { text: { type: "string" } } } as JSONSchema
  }, async ({ text }) => mem.add(String(text)));

  server.tool("memory.search", {
    description: "Search memory notes",
    inputSchema: { type: "object", required: ["query"], properties: { query: { type: "string" } } } as JSONSchema
  }, async ({ query }) => ({ results: mem.search(String(query)) }));

  server.tool("roles.list", {
    description: "List available role prompts",
    inputSchema: { type: "object", properties: {} } as JSONSchema
  }, async () => {
    const roles = ["research_analyst.md","technical_writer.md","code_architect.md","quality_auditor.md","synthesis_engine.md"];
    const base = path.resolve(baseDir, "prompts", "roles");
    return { roles, base };
  });

  server.tool("doc.split", {
    description: "Split text into chunks",
    inputSchema: { type: "object", required: ["text"], properties: { text: { type: "string" } } } as JSONSchema
  }, async ({ text }) => splitTextByTokens(String(text)));

  server.tool("doc.hash", {
    description: "Compute SHA-256 of a string",
    inputSchema: { type: "object", required: ["text"], properties: { text: { type: "string" } } } as JSONSchema
  }, async ({ text }) => ({ sha256: sha256Hex(String(text)) }));
}
