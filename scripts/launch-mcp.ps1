
# scripts/launch-mcp.ps1
# Purpose: Start Nexus6 stdio MCP server reliably for Claude Desktop.
# Usage in Claude config:
#   Command: C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
#   Args: -ExecutionPolicy, Bypass, -File, C:\Users\STENCH\Documents\Projects\nexus6-uni-mcp-server\scripts\launch-mcp.ps1

$ErrorActionPreference = "Stop"

$Node = "C:\Program Files\nodejs\node.exe"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$Tsx = Join-Path $RepoRoot "node_modules\tsx\dist\cli.mjs"
$Entry = Join-Path $RepoRoot "src\mcp\server.ts"
$LogDir = Join-Path $RepoRoot "logs"
$Log = Join-Path $LogDir "mcp-boot.log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
  $ts = (Get-Date).ToString("s")
  Add-Content -Path $Log -Value "[$ts] $msg"
}

Log "====== Launching MCP (launch-mcp.ps1) ======"
Log "RepoRoot=$RepoRoot"
Log "Node=$Node"
Log "Tsx=$Tsx"
Log "Entry=$Entry"
Log "CWD=$PWD"

if (-not (Test-Path $Node)) { Log "ERROR: Node not found at $Node"; throw "Node not found" }
if (-not (Test-Path $Tsx))  { Log "ERROR: tsx missing. Run `npm install`"; throw "tsx missing" }
if (-not (Test-Path $Entry)){ Log "ERROR: Entry not found: $Entry"; throw "Entry missing" }

$envs = @(
  "AIRTABLE_API_KEY","AIRTABLE_BASE_ID",
  "GITHUB_TOKEN","GITHUB_OWNER","GITHUB_REPO","GITHUB_BRANCH"
)
foreach ($name in $envs) {
  $val = $env:$name
  if ([string]::IsNullOrWhiteSpace($val)) {
    $val = [Environment]::GetEnvironmentVariable($name, "User")
    if ($val) {
      $env:$name = $val
      Log "Loaded $name from User scope"
    } else {
      Log "WARN: $name not set"
    }
  } else {
    Log "Using $name from process/env"
  }
}

function Mask($s) { if ([string]::IsNullOrEmpty($s)) { return "<empty>" } if ($s.Length -le 6) { return "******" } return $s.Substring(0,3) + "..." + $s.Substring($s.Length-3) }
Log ("AIRTABLE_API_KEY=" + (Mask $env:AIRTABLE_API_KEY))
Log ("AIRTABLE_BASE_ID=" + $env:AIRTABLE_BASE_ID)
Log ("GITHUB_TOKEN=" + (Mask $env:GITHUB_TOKEN))
Log ("GITHUB_OWNER=" + $env:GITHUB_OWNER)
Log ("GITHUB_REPO=" + $env:GITHUB_REPO)
Log ("GITHUB_BRANCH=" + $env:GITHUB_BRANCH)

Log "Starting MCP..."
& $Node $Tsx $Entry
