# CONTROL_CENTER.md — Phase 1 Architect Features

This pack adds:
- File-backed **Memory** (`logs/memory.json`) with REST API
- **Role prompts** in `/prompts/`
- **Doc orchestration** endpoints for Airtable→GitHub
- Updated **UI** with Push/Pull, Memory, Hash, and A2A feed

## Local Paths (Windows examples)

- Server: `C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server\server\server.js`
- Memory: `C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server\server\memory.js`
- UI: `C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server\ui\index.html`
- Adapters:
  - `C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server\adapters\airtable.js`
  - `C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server\adapters\github.js`
- Prompts:
  - `C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server\prompts\axlon_instructions.md`
  - `C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server\prompts\claude_instructions.md`
  - `C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server\prompts\hashing_guide.md`
- Config:
  - `C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server\config\airtable.json`
  - `C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server\config\github.json`
  - `C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server\config\projects.json`

(If your repo folder is `nexus6-mcp-server`, substitute accordingly.)

## How to Run

```powershell
cd C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server
npm install
node .\server\server.js
# Open http://localhost:3002/ui
```

## Configure

Edit the three files in `/config/` to add your Airtable base and GitHub repo details.
