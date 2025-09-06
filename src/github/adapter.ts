// src/github/adapter.ts
// Minimal GitHub content adapter with safe JSON typing

import { Buffer } from "node:buffer";

export interface GitHubContentResponse {
  sha?: string;
  content?: string;
  path?: string;
}

export class GitHubAdapter {
  constructor(private token: string, private owner: string, private repo: string) {}

  private headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
      "User-Agent": "nexus6-uni-mcp-server"
    };
  }

  private url(path: string) {
    return `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(
      path
    )}`;
  }

  async getFile(path: string, ref?: string): Promise<GitHubContentResponse | null> {
    const url = new URL(this.url(path));
    if (ref) url.searchParams.set("ref", ref);
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) return null;
    const js: any = await res.json(); // safe cast
    return js as GitHubContentResponse;
  }

  async putFile(
    path: string,
    contentUtf8: string,
    message: string,
    branch?: string
  ): Promise<GitHubContentResponse> {
    let sha: string | undefined;
    const existing = await this.getFile(path, branch);
    if (existing?.sha) sha = existing.sha;

    const body: any = {
      message,
      content: Buffer.from(contentUtf8, "utf8").toString("base64")
    };
    if (sha) body.sha = sha;
    if (branch) body.branch = branch;

    const res = await fetch(this.url(path), {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub PUT ${res.status}: ${text}`);
    }
    const js: any = await res.json(); // safe cast
    return js as GitHubContentResponse;
  }
}
