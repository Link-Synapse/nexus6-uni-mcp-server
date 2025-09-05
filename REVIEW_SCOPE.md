# Review Scope

For focused code reviews and token efficiency, only examine these locations:

## INCLUDE:
- /server/**
- /adapters/**
- /config/**
- /ui/**
- /prompts/**
- /projects/**
- /REVIEW_HANDOUT.md
- /.github/pull_request_template.md

## EXCLUDE (do not open or read):
- /SCR/**
- /node_modules/**
- /dist/**
- /logs/**
- /.git/**
- *.png *.jpg *.zip *.pdf *.mp4

## Review Format:
```
[FILE] path
[RISK] high/med/low
[WHY] one sentence
[DIFF]
--- before
+++ after
[TESTS]
1) ...
2) ...
```

**No writes during review** - review only.
