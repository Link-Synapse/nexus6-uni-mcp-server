# Nexus6 Unified MCP — Smoke Tests

These tests verify environment wiring and core integrations:
- ENV sanity
- Airtable read
- GitHub write (to `docs/_smoke/`)
- UI online + SSE endpoint touch

## Prereqs
- Node 20+
- Server/UI running (UI on http://localhost:3002, MCP stdio)
- `.env` filled:
  - AIRTABLE_API_KEY
  - AIRTABLE_BASE_ID
  - (optional) AIRTABLE_TABLE_DOCS (defaults to "Docs")
  - GITHUB_TOKEN
  - GITHUB_OWNER (e.g., Link-Synapse)
  - GITHUB_REPO (e.g., nexus6-uni-mcp-server)

## Run (PowerShell)
```powershell
cd "C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server\tests"
node .\run-all.cjs
```

## Notes
- GitHub smoke writes/updates: `docs/_smoke/n6-smoke-YYYYMMDD.md`
- If Airtable table name differs, set `AIRTABLE_TABLE_DOCS` in `.env`.
- Tests are resilient: they won’t throw if optional endpoints are missing; they print actionable diagnostics.