export class GitHubAdapter {
  private token: string;
  private baseUrl = "https://api.github.com";

  constructor(token: string) {
    this.token = token;
  }

  async createOrUpdateFile(owner: string, repo: string, path: string, content: string, message: string) {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

    const res = await fetch(url, {
      headers: { Authorization: `token ${this.token}`, "User-Agent": "n6-mcp" }
    });

    let sha: string | undefined;
    if (res.status === 200) {
      const json = await res.json();
      sha = json.sha;
    }

    const body = {
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      sha
    };

    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${this.token}`,
        "User-Agent": "n6-mcp",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!putRes.ok) {
      const text = await putRes.text();
      throw new Error(`GitHub API error: ${putRes.status} ${putRes.statusText} — ${text}`);
    }
    return await putRes.json();
  }
}
