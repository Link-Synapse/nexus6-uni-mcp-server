# Phase 1 Architect Features — Wire Up

## Files added
- src/features/memory/memoryStore.ts
- src/features/orchestration/docOrchestrator.ts
- src/features/phase1/registerTools.ts
- prompts/roles/*.md

## One edit required

Edit: src/unified/server.ts

Add import:
```ts
import { registerPhase1Tools } from "../features/phase1/registerTools";
```

After server creation, add:
```ts
registerPhase1Tools(server, { baseDir: process.cwd() });
```

## Verify
- Build + start MCP server
- Claude call tool: memory.add, memory.search, roles.list, doc.split, doc.hash
