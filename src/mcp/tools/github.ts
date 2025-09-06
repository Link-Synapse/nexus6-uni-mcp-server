// src/mcp/tools/github.ts
// Helper used by MCP tool to create/update a file in GitHub

type CreateOrUpdateArgs = {
  token: string;
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
  branch?: string;
};

export async function createOrUpdateGitHubFile(args: CreateOrUpdateArgs) {
  const { token, owner, repo, path, content, message, branch } = args;
  const apiBase = "https://api.github.com";
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "nexus6-uni-mcp-server"
  };

  // 1) Try to read existing file to get SHA
  let existingSha: string | undefined;
  const getUrl = new URL(`${apiBase}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`);
  if (branch) getUrl.searchParams.set("ref", branch);
  const getRes = await fetch(getUrl, { headers });
  if (getRes.ok) {
    const data: any = await getRes.json(); // safe cast
    existingSha = data?.sha as string | undefined;
  }

  // 2) Create or update
  const putUrl = `${apiBase}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const body: any = {
    message,
    content: Buffer.from(content, "utf8").toString("base64")
  };
  if (existingSha) body.sha = existingSha;
  if (branch) body.branch = branch;

  const putRes = await fetch(putUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify(body)
  });
  if (!putRes.ok) {
    const text = await putRes.text();
    throw new Error(`GitHub PUT ${putRes.status}: ${text}`);
  }
  const js: any = await putRes.json(); // safe cast
  return js;
}
