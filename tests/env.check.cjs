/* eslint-env node */
const REQUIRED = [
  "AIRTABLE_API_KEY",
  "AIRTABLE_BASE_ID",
  "GITHUB_TOKEN",
  "GITHUB_OWNER",
  "GITHUB_REPO",
];

const OPTIONAL = {
  AIRTABLE_TABLE_DOCS: "Docs",
  SERVER_UI_PORT: "3002",
};

let ok = true;
for (const k of REQUIRED) {
  if (!process.env[k]) {
    console.error(`❌ Missing required env: ${k}`);
    ok = false;
  } else {
    console.log(`✅ ${k}=***set***`);
  }
}

for (const [k, def] of Object.entries(OPTIONAL)) {
  console.log(`ℹ️ ${k}=${process.env[k] || def}`);
}

if (!ok) {
  console.error("Fix missing env vars in .env and re-run.");
  process.exit(2);
} else {
  console.log("ENV check OK.");
}