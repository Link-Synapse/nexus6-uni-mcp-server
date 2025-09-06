
---

## 2) All-in-one runner (JS)  
**Path:** `C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server\tests\run-all.mjs`
```js
/* Nexus6 Unified MCP — Smoke Runner */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFile } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tests = [
  "env.check.mjs",
  "ui.smoke.mjs",
  "airtable.smoke.mjs",
  "github.smoke.mjs",
];

const run = (script) =>
  new Promise((res) => {
    const p = spawn(process.execPath, [resolve(__dirname, script)], {
      stdio: "inherit",
      env: process.env,
    });
    p.on("close", (code) => res({ script, code }));
  });

(async () => {
  console.log("=== Nexus6 Unified MCP — Smoke Tests ===");
  const results = [];
  for (const t of tests) {
    console.log(`\n--- Running: ${t} ---`);
    // eslint-disable-next-line no-await-in-loop
    results.push(await run(t));
  }

  const failed = results.filter(r => r.code !== 0);
  console.log("\n=== Summary ===");
  results.forEach(r => console.log(`${r.code === 0 ? "✅" : "❌"} ${r.script}`));
  if (failed.length) {
    console.error(`\n${failed.length} test(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll smoke tests PASSED.");
})();
