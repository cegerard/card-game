---
name: refresh_memory_bank
description: Refresh (aka create or update) the memory bank files to reflect the current state of the codebase
argument-hint: <module> (optional) - default is project root
---

# Refresh Memory Bank

Means to create or update the documentation files that make up the memory bank of the project.

Only change existing files if there is REAL CHANGES in the codebase, do not change files just to reformat or reword things.

If $ARGUMENTS is provided, it will be the module/folder to analyze, otherwise use project root.

## Resources

Every file has its own template to follow.

### Common

Used for each module! (Backend, Frontend, etc...)

- docs/templates/memory/ARCHITECTURE.md
- docs/templates/memory/CODING_ASSERTIONS.md
- docs/templates/memory/TESTING.md

### Backend Specific

- docs/templates/memory/backend/API_DOCS.md
- docs/templates/memory/backend/DATABASE.md

### Frontend Specific

- docs/templates/memory/frontend/BACKEND_COMMUNICATION.md
- docs/templates/memory/frontend/DESIGN.md
- docs/templates/memory/frontend/FORMS.md

### Documentation Root

- docs/templates/memory/PROJECT_BRIEF.md
- docs/templates/memory/DEPLOYMENT.md
- docs/templates/memory/STACK.md
- docs/templates/memory/CODEBASE_STRUCTURE.md

## Steps

1. Check if memory bank already exist in `docs/memory-bank` folder:
   1. If exists, update it with newer information.
   2. If not exist, create them from scratch.
2. Determine modules to analyze:
   1. If $ARGUMENTS is provided, it will be the module/folder to analyze.
   2. If not provided, use project root.
3. Provide the modules list to USER.
4. **Wait for user approval** before proceeding.
5. For each module, identify which files to create/update:
   - Common: `docs/memory-bank/<module>/<file>.md`
   - Backend specific: `docs/memory-bank/backend/<file>.md`
   - Frontend specific: `docs/memory-bank/frontend/<file>.md`
   - Documentation root: `docs/memory-bank/<file>.md`
6. Spawn a new task agent for each template file to analyze the codebase and fill its own template (in parallel) based on rules below.
7. Output the generated files in proper dir.
8. Synchronize AGENTS.md root file with memory bank executing

## Rules

- "?" means optional, do not add section if not applicable
- Templates give optional sections, feel free to add or remove sections as needed
- ZERO DUPLICATION: Focus only on the sections in template to avoid duplication across files
- No minor versions in libs (e.g. `Next.js 15.3.4` → `Next.js 15` )
- Templates follow clear separation of concerns
- For config files (e.g. `package.json`, API schema etc...), please include relative based path using "@" (do not surrounded path with backticks)
- SUPER SHORT explicit and concise bullet points
- Mention code using backticks
