import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { loadConfig } from "../config/environment.js";
import { AirtableAdapter } from "../airtable/adapter.js";
import { GitHubAdapter } from "../github/adapter.js";
import { ChatCoordinator } from "../chat/coordinator.js";

async function main() {
  const cfg = loadConfig();
  const server = new McpServer({ name: "nexus6-uni-mcp", version: "1.1.4" });

  const airtable = new AirtableAdapter(cfg.airtable.apiKey, cfg.airtable.baseId);
  const github = new GitHubAdapter(cfg.github.token, cfg.github.owner, cfg.github.repo);
  const chat = new ChatCoordinator();

  // ---- Airtable: list records
  server.tool(
    "airtable_list_records",
    {
      table: z.string().describe("Table name to query (e.g., Docs)"),
      view: z.string().optional().describe("Specific Airtable view to use"),
      maxRecords: z.number().int().min(1).max(1000).optional().describe("Maximum records to return (default 100)")
    },
    { title: "List Airtable records", idempotentHint: true },
    async (args) => {
      try {
        const data = await airtable.listRecords(args.table, { view: args.view, maxRecords: args.maxRecords });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        console.error("Airtable list failed", { 
          table: args.table, 
          view: args.view, 
          maxRecords: args.maxRecords, 
          error: err?.message,
          timestamp: new Date().toISOString()
        });
        throw new McpError(ErrorCode.InternalError, `Airtable list failed: ${err?.message}`);
      }
    }
  );

  // ---- Airtable: upsert doc
  server.tool(
    "airtable_upsert_doc",
    {
      table: z.string().default("Docs").describe("Table name (defaults to 'Docs')"),
      slug: z.string().describe("Unique slug for the document"),
      name: z.string().describe("Human-readable document title"),
      content: z.string().describe("Markdown or plain text content"),
      status: z.enum(["Draft", "Ready", "Approved"]).default("Draft").describe("Workflow status")
    },
    { title: "Upsert Airtable doc" },
    async (args) => {
      try {
        const data = await airtable.upsertDoc(args.table ?? "Docs", args.slug, {
          Name: args.name,
          Content: args.content,
          Status: args.status ?? "Draft"
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        console.error("Airtable upsert failed", { 
          table: args.table, 
          slug: args.slug, 
          status: args.status, 
          error: err?.message,
          timestamp: new Date().toISOString()
        });
        throw new McpError(ErrorCode.InternalError, `Airtable upsert failed: ${err?.message}`);
      }
    }
  );

  // ---- GitHub: create or update file
  server.tool(
    "github_create_or_update_file",
    {
      path: z.string().describe("Path in repo, e.g., docs/README.md"),
      content: z.string().describe("UTF-8 file content"),
      message: z.string().describe("Commit message to use")
    },
    { title: "GitHub create/update file" },
    async (args) => {
      try {
        const data = await github.createOrUpdateFile(args.path, args.content, args.message);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        console.error("GitHub write failed", { 
          path: args.path, 
          message: args.message, 
          error: err?.message,
          timestamp: new Date().toISOString()
        });
        throw new McpError(ErrorCode.InternalError, `GitHub write failed: ${err?.message}`);
      }
    }
  );

  // ---- A2A: create session
  server.tool(
    "a2a_create_session",
    {
      participants: z.array(z.string()).min(1).describe("Array of agent/user identifiers")
    },
    { title: "A2A create session" },
    async (args) => {
      try {
        const id = chat.createSession(args.participants);
        return { content: [{ type: "text", text: id }] };
      } catch (err: any) {
        console.error("A2A session creation failed", {
          participants: args.participants,
          error: err?.message,
          timestamp: new Date().toISOString()
        });
        throw new McpError(ErrorCode.InternalError, `A2A session creation failed: ${err?.message}`);
      }
    }
  );

  // ---- A2A: send message
  server.tool(
    "a2a_send_message",
    {
      sessionId: z.string().describe("Session ID returned by a2a_create_session"),
      sender: z.string().describe("Sender identifier"),
      content: z.string().describe("Message body")
    },
    { title: "A2A send message" },
    async (args) => {
      try {
        chat.sendMessage(args.sessionId, args.sender, args.content);
        return { content: [{ type: "text", text: "ok" }] };
      } catch (err: any) {
        console.error("A2A message send failed", {
          sessionId: args.sessionId,
          sender: args.sender,
          error: err?.message,
          timestamp: new Date().toISOString()
        });
        throw new McpError(ErrorCode.InternalError, `A2A message send failed: ${err?.message}`);
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  console.error("MCP server failed:", {
    error: e?.message,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});
