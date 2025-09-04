export interface Config {
  airtable: { apiKey: string; baseId: string };
  github: { token: string; owner: string; repo: string };
}

export function loadConfig(): Config {
  const apiKey  = process.env.AIRTABLE_API_KEY || "";
  const baseId  = process.env.AIRTABLE_BASE_ID || "";
  const ghToken = process.env.GITHUB_TOKEN || "";
  const ghOwner = process.env.GITHUB_OWNER || "Link-Synapse";
  const ghRepo  = process.env.GITHUB_REPO  || "nexus6-uni-mcp-server";

  if (!apiKey || !baseId) console.warn("[env] Missing Airtable vars (AIRTABLE_API_KEY, AIRTABLE_BASE_ID)");
  if (!ghToken)           console.warn("[env] Missing GitHub token (GITHUB_TOKEN)");

  return {
    airtable: { apiKey, baseId },
    github:   { token: ghToken, owner: ghOwner, repo: ghRepo }
  };
}
