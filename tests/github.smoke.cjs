/* eslint-env node */
// GitHub smoke (create/update docs/_smoke/n6-smoke-YYYYMMDD.md)
const TOKEN = process.env.GITHUB_TOKEN;
const OWNER = process.env.GITHUB_OWNER;
const REPO  = process.env.GITHUB_REPO;

function fail(msg) { console.error(msg); process.exit(5); }

if (!TOKEN || !OWNER || !REPO) {
  fail("Missing GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO");
}

function ymd() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

const path = `docs/_smoke/n6-smoke-${ymd()}.md`;
const api  = (p) => `https://api.github.com/repos/${OWNER}/${REPO}/${p}`;

async function getExistingSha() {
  const res = await fetch(api(`contents/${encodeURIComponent(path)}`), {
    headers: {
      // IMPORTANT: GitHub expects "token <PAT>" here
      Authorization: `token ${TOKEN}`,
      "User-Agent": "n6-smoke"
    },
  });
  if (res.status === 200) {
    const json = await res.json();
    return json.sha;
  }
  if (res.status === 404) return null; // doesn't exist yet
  const text = await res.text();
  fail(`Pre-check failed: ${res.status} ${res.statusText} — ${text}`);
}

async function putFile(sha) {
  const content = [
    `# Nexus6 MCP — Smoke (${new Date().toISOString()})`,
    ``,
    `This file is written by the smoke test.`,
    `- Repo: ${OWNER}/${REPO}`,
    `- Path: ${path}`,
  ].join("\n");
  const body = {
    message: sha
      ? `test: update ${path} (smoke)`
      : `test: create ${path} (smoke)`,
    content: Buffer.from(content, "utf8").toString("base64"),
    sha: sha || undefined,
  };
  const res = await fetch(api(`contents/${encodeURIComponent(path)}`), {
    method: "PUT",
    headers: {
      Authorization: `token ${TOKEN}`,
      "User-Agent": "n6-smoke",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    fail(`GitHub write failed: ${res.status} ${res.statusText} — ${text}`);
  }
  const json = await res.json();
  return json.content && json.content.sha;
}

(async () => {
  try {
    console.log(`Owner/Repo: ${OWNER}/${REPO}`);
    console.log(`Token len: ${TOKEN.length} (starts with: ${TOKEN.slice(0,4)}***)`);
    const sha = await getExistingSha();
    const newSha = await putFile(sha);
    console.log(`GitHub OK: wrote ${path} (sha=${newSha ? String(newSha).slice(0, 7) : "unknown"})`);
  } catch (e) {
    fail(e.message || String(e));
  }
})();
