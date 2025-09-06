/* eslint-env node */
// Nexus6 Unified MCP — Smoke Runner (CommonJS)
const { spawn } = require("node:child_process");
const { resolve } = require("node:path");

const tests = [
  "env.check.cjs",
  "ui.smoke.cjs",
  "airtable.smoke.cjs",
  "github.smoke.cjs",
];

function run(script) {
  return new Promise((res) => {
    const p = spawn(process.execPath, [resolve(__dirname, script)], {
      stdio: "inherit",
      env: process.env,
    });
    p.on("close", (code) => res({ script, code }));
  });
}

(async () => {
  console.log("=== Nexus6 Unified MCP — Smoke Tests ===");
  const results = [];
  for (const t of tests) {
    console.log(`\n--- Running: ${t} ---`);
    // eslint-disable-next-line no-await-in-loop
    results.push(await run(t));
  }

  const failed = results.filter((r) => r.code !== 0);
  console.log("\n=== Summary ===");
  results.forEach((r) =>
    console.log(`${r.code === 0 ? "✅" : "❌"} ${r.script}`)
  );
  if (failed.length) {
    console.error(`\n${failed.length} test(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll smoke tests PASSED.");
})();