export interface Config {
  server: {
    name: string;
    version: string;
  };
  airtable: {
    apiKey?: string;
    baseId?: string;
  };
  github: {
    token?: string;
    owner?: string;
    repo?: string;
    defaultBranch: string;
  };
}

export function loadConfig(): Config {
  return {
    server: {
      name: process.env.N6_SERVER_NAME || "nexus6-unified-mcp",
      version: process.env.N6_SERVER_VERSION || "1.0.0"
    },
    airtable: {
      apiKey: process.env.AIRTABLE_API_KEY,
      baseId: process.env.AIRTABLE_BASE_ID
    },
    github: {
      token: process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_OWNER || "Link-Synapse",
      repo: process.env.GITHUB_REPO || "nexus6-uni-mcp-server",
      defaultBranch: process.env.GITHUB_BRANCH || "main"
    }
  };
}