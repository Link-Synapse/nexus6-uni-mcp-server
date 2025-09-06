param(
  [string]$BranchName = "feat/mcp-compliance",
  [switch]$UpdateDevScript = $true
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) { Write-Host "[$(Get-Date -Format HH:mm:ss)] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[$(Get-Date -Format HH:mm:ss)] $msg" -ForegroundColor Yellow }
function Write-Ok($msg)   { Write-Host "[$(Get-Date -Format HH:mm:ss)] $msg" -ForegroundColor Green }
function Write-Err($msg)  { Write-Host "[$(Get-Date -Format HH:mm:ss)] $msg" -ForegroundColor Red }

# Ensure we are at repo root (package.json must exist)
if (-not (Test-Path ".\package.json")) {
  Write-Err "Run this from your repo root (where package.json is)."
  exit 1
}

# Git sanity
git rev-parse --is-inside-work-tree | Out-Null
$st = git status --porcelain
if ($st) {
  Write-Warn "You have unstaged changes. This script will only stage MCP starter/fixpack files."
}

# Create branch
Write-Info "Creating/updating branch: $BranchName"
git checkout -B $BranchName

# Candidate files to stage (only if present)
$paths = @(
  "tsconfig.json",
  "src/unified/server.ts",
  "src/config/environment.ts",
  "src/airtable/adapter.ts",
  "src/github/adapter.ts",
  "src/types/shim.d.ts"
)

$existing = @()
foreach ($p in $paths) {
  if (Test-Path $p) { $existing += $p }
}

if ($existing.Count -eq 0) {
  Write-Warn "No MCP starter/fixpack files found to stage. If you extracted zips, verify paths."
} else {
  Write-Info ("Staging files:`n - " + ($existing -join "`n - "))
  git add $existing
}

# Optionally update package.json "dev" script to watch the MCP server entry
if ($UpdateDevScript) {
  try {
    $pkgPath = "package.json"
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
    if (-not $pkg.scripts) { $pkg | Add-Member -NotePropertyName scripts -NotePropertyValue @{} }
    # Prefer tsx if installed; fallback to ts-node, else node on dist
    $devCmd = "tsx watch src/unified/server.ts"
    if (-not (Get-Command tsx -ErrorAction SilentlyContinue)) {
      if (Get-Command ts-node -ErrorAction SilentlyContinue) {
        $devCmd = "ts-node src/unified/server.ts"
      } else {
        $devCmd = "node dist/unified/server.js"
      }
    }
    $pkg.scripts.dev = $devCmd
    $pkg | ConvertTo-Json -Depth 100 | Out-File -Encoding utf8 $pkgPath
    git add $pkgPath
    Write-Ok "Updated package.json scripts.dev -> $devCmd"
  } catch {
    Write-Warn "Could not update package.json: $($_.Exception.Message)"
  }
}

# Commit
$commitMsg = "feat(mcp): add MCP starter & fixpack; set dev script to MCP server"
git commit -m $commitMsg | Out-Null

Write-Ok "Committed on branch $BranchName"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Magenta
Write-Host "  1) npm install" -ForegroundColor White
Write-Host "  2) npm run build" -ForegroundColor White
Write-Host "  3) (Stop your legacy server if running)" -ForegroundColor White
Write-Host "  4) npm run dev   # starts the MCP stdio server entry" -ForegroundColor White
Write-Host "  5) In Claude Desktop, point the tool to this MCP server if needed" -ForegroundColor White
Write-Host ""
Write-Ok "Done."