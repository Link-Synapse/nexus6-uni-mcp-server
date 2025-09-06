
# scripts/set-env-user.ps1
# Prompts once and saves env vars at User scope.

function Prompt-Secret($label) {
  $secure = Read-Host -Prompt $label -AsSecureString
  [Runtime.InteropServices.Marshal]::PtrToStringBSTR(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}

$AIRTABLE_API_KEY = Prompt-Secret "Enter AIRTABLE_API_KEY"
$AIRTABLE_BASE_ID = Read-Host "Enter AIRTABLE_BASE_ID"
$GITHUB_TOKEN     = Prompt-Secret "Enter GITHUB_TOKEN (PAT)"
$GITHUB_OWNER     = Read-Host "Enter GITHUB_OWNER (default: Link-Synapse)"
if (-not $GITHUB_OWNER) { $GITHUB_OWNER = "Link-Synapse" }
$GITHUB_REPO      = Read-Host "Enter GITHUB_REPO (default: nexus6-uni-mcp-server)"
if (-not $GITHUB_REPO) { $GITHUB_REPO = "nexus6-uni-mcp-server" }
$GITHUB_BRANCH    = Read-Host "Enter GITHUB_BRANCH (default: main)"
if (-not $GITHUB_BRANCH) { $GITHUB_BRANCH = "main" }

[Environment]::SetEnvironmentVariable("AIRTABLE_API_KEY", $AIRTABLE_API_KEY, "User")
[Environment]::SetEnvironmentVariable("AIRTABLE_BASE_ID", $AIRTABLE_BASE_ID, "User")
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", $GITHUB_TOKEN, "User")
[Environment]::SetEnvironmentVariable("GITHUB_OWNER", $GITHUB_OWNER, "User")
[Environment]::SetEnvironmentVariable("GITHUB_REPO", $GITHUB_REPO, "User")
[Environment]::SetEnvironmentVariable("GITHUB_BRANCH", $GITHUB_BRANCH, "User")

Write-Host "Saved. Restart Claude Desktop to pick up new env vars." -ForegroundColor Green
