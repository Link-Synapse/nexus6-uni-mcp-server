
param([switch]$Commit=$true)

$ErrorActionPreference = "Stop"

function Ok($m){ Write-Host $m -ForegroundColor Green }

if (Test-Path ".\scripts\dev-ui.cjs") {
  git rm .\scripts\dev-ui.cjs
  Ok "Removed scripts\dev-ui.cjs"
}

if (-not (Test-Path ".gitattributes")) {
  Set-Content -NoNewline -Encoding utf8 .gitattributes @"
* text=auto
*.ts text eol=lf
*.js text eol=lf
*.json text eol=lf
*.md text eol=lf
"@
  git add .gitattributes
  Ok ".gitattributes added"
}

$log = @"
## [$([DateTime]::UtcNow.ToString("yyyy-MM-dd"))] Real UI mount + cleanup

- Added real UI mount to main server (serves `/ui` + `/health`).
- Removed fallback UI (`scripts/dev-ui.cjs`).
- Added .gitattributes for consistent line endings.

Agents: Axlon + Claude
Outcome: Main cleaned, UI stable without fallback.
"@
Add-Content .\STATE_LOG.md "`r`n$log"
git add STATE_LOG.md
Ok "STATE_LOG.md updated"

if ($Commit) {
  git add src/unified/server.js ui/index.html
  git commit -m "feat(ui): add real UI mount; remove fallback dev-ui; update STATE_LOG"
  Ok "Committed cleanup"
}
