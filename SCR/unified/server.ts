import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { loadConfig } from "../config/environment.js";
import { AirtableAdapter } from "../airtable/adapter.js";
import { GitHubAdapter } from "../github/adapter.js";
import { ChatCoordinator } from "../chat/coordinator.js";

async function main() {
  const cfg = loadConfig();

  const server = new McpServer({
    name: "nexus6-uni-mcp",
    version: "1.1.0",
  });

  const airtable = new AirtableAdapter(cfg.airtable.apiKey, cfg.airtable.baseId);
  const github = new GitHubAdapter(cfg.github.token, cfg.github.owner, cfg.github.repo);
  const chat = new ChatCoordinator();

  // --- Airtable: list records
  server.tool(
    {
      name: "airtable_list_records",
      description: "List records from an Airtable table",
      inputSchema: {
        type: "object",
        properties: {
          table: { type: "string", description: "Table name (e.g., Docs)" },
          view: { type: "string" },
          maxRecords: { type: "number", default: 100 }
        },
        required: ["table"]
      }
    },
    async (req) => {
      const schema = z.object({
        table: z.string(),
        view: z.string().optional(),
        maxRecords: z.number().int().min(1).max(1000).optional()
      });
      const { table, view, maxRecords } = schema.parse(req.params.arguments ?? {});
      try {
        const data = await airtable.listRecords(table, { view, maxRecords });
        return { content: [{ type: "json", json: data }] };
      } catch (err: any) {
        throw new McpError(ErrorCode.InternalError, `Airtable list failed: ${err.message}`);
      }
    }
  );

  // --- Airtable: upsert doc by slug
  server.tool(
    {
      name: "airtable_upsert_doc",
      description: "Create/update a doc row in an Airtable Docs-like table by slug",
      inputSchema: {
        type: "object",
        properties: {
          table: { type: "string", default: "Docs" },
          slug:  { type: "string" },
          name:  { type: "string" },
          content:{ type: "string" },
          status: { type: "string", enum: ["Draft","Ready","Approved"], default: "Draft" }
        },
        required: ["slug","name","content"]
      }
    },
    async (req) => {
      const schema = z.object({
        table: z.string().default("Docs"),
        slug: z.string(),
        name: z.string(),
        content: z.string(),
        status: z.enum(["Draft","Ready","Approved"]).default("Draft")
      });
      const args = schema.parse(req.params.arguments ?? {});
      try {
        const data = await airtable.upsertDoc(args.table, args.slug, {
          Name: args.name,
          Content: args.content,
          Status: args.status
        });
        return { content: [{ type: "json", json: data }] };
      } catch (err: any) {
        throw new McpError(ErrorCode.InternalError, `Airtable upsert failed: ${err.message}`);
      }
    }
  );

  // --- GitHub: create or update a file
  server.tool(
    {
      name: "github_create_or_update_file",
      description: "Create or update a file in the configured GitHub repo",
      inputSchema: {
        type: "object",
        properties: {
          path:    { type: "string", description: "e.g., docs/README.md" },
          content: { type: "string", description: "utf-8 content" },
          message: { type: "string", description: "commit message" }
        },
        required: ["path","content","message"]
      }
    },
    async (req) => {
      const schema = z.object({
        path: z.string(),
        content: z.string(),
        message: z.string()
      });
      const { path, content, message } = schema.parse(req.params.arguments ?? {});
      try {
        const data = await github.createOrUpdateFile(path, content, message);
        return { content: [{ type: "json", json: data }] };
      } catch (err: any) {
        throw new McpError(ErrorCode.InternalError, `GitHub write failed: ${err.message}`);
      }
    }
  );

  // --- A2A: sessions + messages
  server.tool(
    {
      name: "a2a_create_session",
      description: "Create an A2A chat session",
      inputSchema: {
        type: "object",
        properties: { participants: { type: "array", items: { type: "string" } } },
        required: ["participants"]
      }
    },
    async (req) => {
      const schema = z.object({ participants: z.array(z.string()).min(1) });
      const { participants } = schema.parse(req.params.arguments ?? {});
      const id = chat.createSession(participants);
      return { content: [{ type: "text", text: id }] };
    }
  );

  server.tool(
    {
      name: "a2a_send_message",
      description: "Send a message in an A2A session",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string" },
          sender:    { type: "string" },
          content:   { type: "string" }
        },
        required: ["sessionId","sender","content"]
      }
    },
    async (req) => {
      const schema = z.object({
        sessionId: z.string(),
        sender: z.string(),
        content: z.string()
      });
      const { sessionId, sender, content } = schema.parse(req.params.arguments ?? {});
      chat.sendMessage(sessionId, sender, content);
      return { content: [{ type: "text", text: "ok" }] };
    }
  );

  // Start stdio transport (Claude Desktop compatible)
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  console.error("MCP server failed:", e);
  process.exit(1);
});
