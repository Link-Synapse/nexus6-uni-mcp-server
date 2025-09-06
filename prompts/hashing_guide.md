# Hashing Guide (SHA‑256)

Use the UI "Compute SHA‑256" tool to hash text or small files. For Airtable content, Axlon may use a server method in future (`mcp.hash_doc`).

**Why hash?**  
To prove that a doc or decision you reference is the same as when you reviewed it.

**How to hash a local file (PowerShell):**
```powershell
Get-FileHash .\docs\STATE_LOG.md -Algorithm SHA256 | Select-Object Hash
```

**How to hash a string (Node):**
```js
import crypto from "crypto";
const s = "hello";
const hash = crypto.createHash("sha256").update(s).digest("hex");
console.log(hash);
```
