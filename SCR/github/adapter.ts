import { Buffer } from "node:buffer";

export class GitHubAdapter {
  constructor(private token: string, private owner: string, private repo: string) {}

  private url(path: string) {
    return `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(path)}`;
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      "User-Agent": "nexus6-uni-mcp",
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    };
  }

  async createOrUpdateFile(path: string, content: string, message: string) {
    // discover SHA (if exists)
    let sha: string | undefined;
    {
      const res = await fetch(this.url(path), { headers: this.headers() });
      if (res.ok) {
        const js = await res.json();
        sha = js.sha;
      }
    }

    const body = {
      message,
      content: Buffer.from(content, "utf-8").toString("base64"),
      sha,
    };

    const put = await fetch(this.url(path), {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!put.ok) {
      const txt = await put.text();
      throw new Error(`GitHub write failed: ${put.status} ${put.statusText} — ${txt}`);
    }
    return put.json();
  }
}
