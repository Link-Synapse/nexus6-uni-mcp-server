/* eslint-env node */
const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE = process.env.AIRTABLE_TABLE_DOCS || "Docs";

if (!API_KEY || !BASE_ID) {
  console.error("Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID");
  process.exit(4);
}

const url = new URL(
  `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`
);
url.searchParams.set("pageSize", "3");

(async () => {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!res.ok) {
      console.error(`Airtable error: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error(text);
      process.exit(4);
    }
    const json = await res.json();
    const count = Array.isArray(json.records) ? json.records.length : 0;
    console.log(`Airtable OK: table="${TABLE}", fetched ${count} record(s).`);
    if (count) {
      json.records.forEach((r, i) => {
        const keys = r && r.fields ? Object.keys(r.fields) : [];
        console.log(`  [${i}] id=${r.id} keys=${keys.slice(0, 5).join(",")}`);
      });
    }
  } catch (e) {
    console.error("Airtable request failed:", e.message);
    process.exit(4);
  }
})();