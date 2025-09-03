
# Implementation Plan — nexus6-uni-mcp-server (v1.0)

**Date:** 2025-09-03

## Phases
1) Bring-up: run server; open UI; Claude Desktop connects via MCP (ws://localhost:3001)
2) Adapters: Airtable + GitHub minimal ops; push/pull flow
3) A2A: SSE live feed and simple message bus
4) UX polish + Safe Mode

## Acceptance
- Server boots without errors
- UI reachable at http://localhost:3002/ui
- Claude connects to ws://localhost:3001 (stub ok)
- State log append works
- Adapters call stubs (no secret leakage)
