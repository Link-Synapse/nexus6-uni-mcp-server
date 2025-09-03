
Param(
  [string]$RepoUrl = "https://github.com/Link-Synapse/nexus6-uni-mcp-server.git"
)

Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path)\..

git init
git add .
git commit -m "feat: v1.0 unified MCP server scaffold"
git branch -M main
git remote add origin $RepoUrl
git push -u origin main
