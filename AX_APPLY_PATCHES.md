# AX_APPLY_PATCHES — Instructions for Claude

> Use this file to apply code-level diffs that aren’t shipped as full files in the zip.

## Delete legacy duplicate server
- DELETE: `unified/server.ts`
- Keep canonical entry: `src/unified/server.ts`

## package.json scripts
- Ensure:
```
"dev:mcp": "tsx src/unified/server.ts",
"start:mcp": "node dist/unified/server.js"
```
> If `tsc` outputs to `dist/src/unified/server.js`, adjust `start:mcp` accordingly after a build check.

## src/airtable/adapter.ts — safe slug escape
```diff
- const formula = `Slug=\"${slug.replace(/\"/g, '\\"')}\"`;
+ const escapedSlug = slug.replace(/'/g, "\\'").replace(/"/g, '\\"');
+ const formula = `{Slug}="${escapedSlug}"`;
```

## src/github/adapter.ts — input validation
Add near top of `createOrUpdateFile`:
```ts
const isSafePath = (p: string) =>
  !!p &&
  !p.startsWith('/') &&
  !p.includes('..') &&
  !p.includes('\\') &&
  /^[-a-zA-Z0-9_/.]+$/.test(p);

if (!isSafePath(path)) throw new Error('Invalid file path');
if (!message || !message.trim()) throw new Error('Commit message cannot be empty');
if (content.length > 1024 * 1024) throw new Error('Content too large (max 1MB)');
```

## src/chat/coordinator.ts — session TTL & max
```diff
  export class ChatCoordinator {
    private sessions = new Map<string, Session>();
+   private readonly maxSessions = 100;
+   private readonly sessionTTL = 24 * 60 * 60 * 1000; // 24h

    createSession(participants: string[]) {
+     this.cleanupExpiredSessions();
+     if (this.sessions.size >= this.maxSessions) {
+       throw new Error('Maximum session limit reached');
+     }
      const id = crypto.randomUUID();
-     this.sessions.set(id, { id, participants, messages: [] });
+     this.sessions.set(id, { id, participants, messages: [], createdAt: Date.now() });
      return id;
    }
+   private cleanupExpiredSessions() {
+     const now = Date.now();
+     for (const [id, session] of this.sessions.entries()) {
+       if ((now - (session as any).createdAt) > this.sessionTTL) {
+         this.sessions.delete(id);
+       }
+     }
+   }
```

## Logging — timestamps & no secrets
Search for `console.error(` and wrap objects like:
```diff
- console.error("Airtable list failed", { table: args.table, view: args.view, maxRecords: args.maxRecords, error: err?.message });
+ console.error("Airtable list failed", {
+   table: args.table,
+   view: args.view,
+   maxRecords: args.maxRecords,
+   error: err?.message,
+   ts: new Date().toISOString()
+ });
```
Avoid logging tokens/keys anywhere.

## Verify
1. `npm run build`
2. `npm run start:mcp` (or the correct built path) — server starts
3. Claude GitHub MCP: list repo files
4. Claude Airtable MCP: list bases/tables, show Docs columns
