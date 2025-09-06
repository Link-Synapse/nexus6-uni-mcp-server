/**
 * GitHub adapter with path traversal guard and size limit (<=1MB)
 * config/github.json:
 * {
 *   "token": "...",
 *   "owner": "Link-Synapse",
 *   "repo": "Nexus6",
 *   "docs_dir": "docs"
 * }
 */
import { Octokit } from "@octokit/rest";

const MAX_BYTES = 1 * 1024 * 1024;

export class GitHubAdapter {
  constructor(cfg = {}) {
    this.token = cfg.token || process.env.GITHUB_TOKEN;
    this.owner = cfg.owner;
    this.repo = cfg.repo;
    this.docsDir = (cfg.docs_dir || "docs").replace(/^\/*|\/*$/g, "");
    if (!this.token || !this.owner || !this.repo) {
      console.warn("[GitHub] Missing token/owner/repo – doc operations will fail until configured.");
      this.client = null;
    } else {
      this.client = new Octokit({ auth: this.token });
    }
  }

  _safePath(slug) {
    const s = String(slug).toLowerCase().replace(/[^a-z0-9\-]/g, "-").slice(0, 64);
    const rel = `${this.docsDir}/${s}.md`;
    if (rel.includes("..")) throw new Error("path_traversal_blocked");
    return rel;
  }

  async listRepoDocs() {
    if (!this.client) return [];
    const res = await this.client.repos.getContent({
      owner: this.owner, repo: this.repo, path: this.docsDir
    });
    if (!Array.isArray(res.data)) return [];
    return res.data.filter(it => it.type === "file" && it.name.endsWith(".md")).map(it => ({
      name: it.name, path: it.path, sha: it.sha, size: it.size
    }));
  }

  async readRepoDoc(slug) {
    if (!this.client) throw new Error("github_not_configured");
    const path = this._safePath(slug);
    const res = await this.client.repos.getContent({
      owner: this.owner, repo: this.repo, path
    });
    const { content, sha } = res.data;
    const buf = Buffer.from(content, "base64");
    return { path, sha, content: buf.toString("utf-8") };
  }

  async pushDoc(slug, content) {
    if (!this.client) throw new Error("github_not_configured");
    const bytes = Buffer.byteLength(content, "utf-8");
    if (bytes > MAX_BYTES) throw new Error("file_too_large");
    const path = this._safePath(slug);

    // See if file exists
    let sha = undefined;
    try {
      const curr = await this.client.repos.getContent({ owner: this.owner, repo: this.repo, path });
      sha = curr?.data?.sha;
    } catch (e) {
      // 404 is ok - new file
    }

    const res = await this.client.repos.createOrUpdateFileContents({
      owner: this.owner, repo: this.repo, path,
      message: `docs: sync ${slug}`,
      content: Buffer.from(content, "utf-8").toString("base64"),
      sha
    });
    return { path, sha: res.data.content.sha };
  }
}
