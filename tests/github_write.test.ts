
import { describe, it, expect } from "vitest";
import "dotenv/config";
import { GitHubAdapter } from "../src/github/adapter.js";

describe("GitHubAdapter write", () => {
  it("creates or updates docs/test.md", async () => {
    const token = process.env.GITHUB_TOKEN || "";
    const owner = process.env.GITHUB_OWNER || "Link-Synapse";
    const repo = process.env.GITHUB_REPO || "nexus6-uni-mcp-server";
    if (!token) throw new Error("Missing GITHUB_TOKEN");

    const gh = new GitHubAdapter(token, owner, repo);
    const res = await gh.createOrUpdateFile(
      "docs/test.md",
      "# Hello from local test!\n",
      "chore: add test file via local test"
    );

    expect(res).toBeTruthy();
  }, 60_000);
});
