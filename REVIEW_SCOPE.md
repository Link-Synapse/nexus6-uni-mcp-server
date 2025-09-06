# Nexus6 — Review Scope Rules

## Include (default review targets)
- /server/**
- /adapters/**
- /config/**
- /ui/**
- /prompts/**
- /projects/**
- /REVIEW_HANDOUT.md
- /.github/pull_request_template.md

## Exclude (never review unless explicitly requested)
- /SCR/**
- /node_modules/**
- /dist/**
- /logs/**
- /.git/**
- *.png *.jpg *.jpeg *.gif *.mp4 *.zip *.pdf

## Review Prompt (copy/paste for Claude)
“Review ONLY the Include list above. DO NOT open anything in Exclude. Use:
[FILE] … [RISK] … [WHY] … [DIFF] … [TESTS] …
No writes.”
