import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AirtableAdapter } from "../airtable/adapter.js";
import { GitHubAdapter } from "../github/adapter.js";
import { loadConfig } from "../config/environment.js";

async function main() {
  const config = loadConfig();

  // TEMP: cast to any until we align with exact SDK typings
  const server: any = new McpServer({
    name: "nexus6-unified-mcp",
    version: "1.0.0"
  });

  const airtable = new AirtableAdapter(config.airtable.apiKey);
  const github = new GitHubAdapter(config.github.token);

  server.addTool(
    {
      name: "airtable_list_records",
      description: "List records from Airtable table",
      inputSchema: {
        type: "object",
        properties: {
          baseId: { type: "string" },
          tableId: { type: "string" },
          maxRecords: { type: "number" }
        },
        required: ["baseId", "tableId"]
      }
    },
    async (request: any) => {
      const { baseId, tableId, maxRecords } = request.params.arguments;
      return await airtable.listRecords(baseId, tableId, { maxRecords });
    }
  );

  server.addTool(
    {
      name: "github_create_file",
      description: "Create or update file in GitHub repository",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          path: { type: "string" },
          content: { type: "string" },
          message: { type: "string" }
        },
        required: ["owner", "repo", "path", "content", "message"]
      }
    },
    async (request: any) => {
      const { owner, repo, path, content, message } = request.params.arguments;
      return await github.createOrUpdateFile(owner, repo, path, content, message);
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal MCP server error", err);
  process.exit(1);
});