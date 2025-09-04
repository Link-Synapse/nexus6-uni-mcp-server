
# Nexus6 Unified MCP Server — QUICKSTART (Windows)

**Local project root**
```
C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server
```

---

## 1) Install & env

```powershell
cd "C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server"
npm install
```

Create `.env` (or use env in Claude config):
```powershell
cd "C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server"
@'
AIRTABLE_API_KEY=your_airtable_key
AIRTABLE_BASE_ID=appM75fvKM3nYyOaF

GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=Link-Synapse
GITHUB_REPO=nexus6-uni-mcp-server
'@ | Out-File -FilePath ".\.env" -Encoding utf8 -Force
```

---

## 2) Build & run

```powershell
cd "C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server"
npm run type-check
npm run build
```

**UI server (HTTP):**
```powershell
cd "C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server"
$env:PORT_UI=3002
npm run start:ui
# If busy: $env:PORT_UI=3003; npm run start:ui
```

**MCP server (stdio) — prod build:**
```powershell
cd "C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server"
node .\dist\unified\server.js
```

---

## 3) Claude Desktop config (auto-run)

**Config file (Windows):**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Template (dist-based + cwd + env):**
```json
{
  "mcpServers": {
    "nexus6-mcp": {
      "type": "stdio",
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": ["dist/unified/server.js"],
      "cwd": "C:\\Users\\STENCH\\Documents\\Projects\\nexus6-uni-mcp-server",
      "env": {
        "AIRTABLE_API_KEY": "your_real_key",
        "AIRTABLE_BASE_ID": "appM75fvKM3nYyOaF",
        "GITHUB_TOKEN": "your_real_token",
        "GITHUB_OWNER": "Link-Synapse",
        "GITHUB_REPO": "nexus6-uni-mcp-server"
      }
    }
  }
}
```

Validate JSON after editing:
```powershell
Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" | ConvertFrom-Json | Out-Null
```

Restart Claude Desktop (quit from tray, relaunch).

---

## 4) First tool calls (inside Claude)

**Airtable list**
```json
{ "table": "tbloZ8LbITEVCvBbK", "view": "viwPiqIWRBhdMMarV", "maxRecords": 5 }
```

**GitHub write**
```json
{ "path": "docs/test.md", "content": "# Hello from Nexus6 MCP\n", "message": "chore: add test file via MCP" }
```

**A2A chat**
```json
# Create
{ "participants": ["Axlon", "Claude"] }
# Send
{ "sessionId": "<returned_id>", "sender": "Axlon", "content": "Kickoff message" }
```

---

## 5) Local adapter tests (no Claude required)

```powershell
cd "C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server"
npm run test
```

This runs:
- `tests/github_write.test.ts` → commits `docs/test.md` via GitHubAdapter
- `tests/airtable_list.test.ts` → lists records via AirtableAdapter

---

## 6) Troubleshooting

**Port busy (UI)**
```powershell
$env:PORT_UI=3003
npm run start:ui
```

**Kill stray Node procs**
```powershell
Get-Process node | Stop-Process -Force
```

**Claude logs**
```powershell
explorer "$env:APPDATA\Claude\logs"
```

**Verify dist file exists**
```powershell
Test-Path "C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server\dist\unified\server.js"
```

---

## 7) Git push (main)

```powershell
cd "C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server"
git add -A
git commit -m "feat: Nexus6 unified MCP (Airtable+GitHub+A2A)"
git branch -M main
git remote remove origin 2>$null
git remote add origin https://github.com/Link-Synapse/nexus6-uni-mcp-server.git
git pull --rebase origin main
git push -u origin main
```
