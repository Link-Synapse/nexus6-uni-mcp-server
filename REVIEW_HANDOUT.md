# Nexus6 MCP — Reviewer Handout

Workflow
1) Ax posts full files with exact Windows paths.
2) Claude (GitHub MCP) creates a branch, adds files, commits, opens a PR.
3) You review and merge. Specs can be mirrored in Airtable `Docs`.

Daily Claude prompts

Open repo + branch + PR
> Open `Link-Synapse/nexus6-uni-mcp-server`, create branch `feature/<short-slug>`, add the files Ax provided at the exact paths, commit `feat: <summary>`, open a PR to `main`, and paste the PR link.

Airtable upsert (optional)
> In base `appM75fvKM3nYyOaF`, table `Docs`, upsert a record with Slug='<slug>', Status='Ready', and Content = the spec Ax provided.

PR Review Checklist
- [ ] Summary & scope are clear
- [ ] Paths exactly match Ax's post
- [ ] Builds locally (if applicable)
- [ ] No secrets
- [ ] Links to Airtable Doc (if used)
- [ ] Tests/manual steps documented

Rollback
- Revert the PR via GitHub.
- If conflict, follow-up PR with `_conflict-YYYYMMDD`.