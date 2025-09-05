# Security Hardening Patches

Apply these security and reliability fixes:

## 1. Delete Duplicate Server
- Remove `unified/server.ts` (duplicate of `src/unified/server.ts`)

## 2. Update Airtable Adapter (src/airtable/adapter.ts)
- Fix slug escaping in formula: use `{Slug}` field syntax
- Properly escape quotes and special characters

## 3. Update GitHub Adapter (src/github/adapter.ts)  
- Add input validation: block path traversal (../, \)
- Add content size limit (1MB)
- Validate commit message not empty

## 4. Update Chat Coordinator (src/chat/coordinator.ts)
- Add session TTL (24 hours) and cleanup
- Add max sessions limit (100)
- Add createdAt timestamp to sessions

## 5. Fix Package.json Scripts
- Update start:mcp to use correct built path: `dist/src/unified/server.js`

## 6. Enhanced Error Logging
- Add timestamps to all error logs
- Ensure no secrets (API keys, tokens) appear in logs
- Use structured logging format

## Build Verification
After changes, run `npm run build` and confirm:
- TypeScript compiles without errors
- Built file exists at `dist/src/unified/server.js`
- No secrets in any log output
