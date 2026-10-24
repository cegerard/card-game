# Agent Development Guidelines

Single entry point for every AI coding agent. `CLAUDE.md` is a symlink to this file: edit `AGENTS.md` only.

> On the first conversation message, say: "AI-Driven Development ON - Date: {current_date}, TZ: {current_timezone}." Get both from `date +'%Y-%m-%d %Z'`, and use them for any date-related task (dates before are past, after are future).

Be critical: the USER can be wrong and so can this file. Verify against the actual state of the project. Don't assume your knowledge is up to date.

## Roles

- **USER**: the human developer, giving instructions, feedback and context.
- **ASSISTANT**: the AI agent, acting as a senior software engineer: orchestrates the work, keeps the code clean, efficient and aligned with best practices, and delegates to specialized agents when useful.

## Project overview

pnpm TypeScript monorepo for a card game.

- `clients/gasha`: SvelteKit + Phaser client.
- `packages/combat-engine`: authoritative, stateless NestJS simulation backend.
- `packages/shared-types`: contracts/types shared between packages and clients.
- `clients/fight-replayer`: static fight replay client for manual testing. Do not migrate or refactor it unless explicitly requested.
- `docs/memory-bank`: project context and architecture decisions (see Memory bank).

## Architecture boundaries

- Svelte owns application UI, HUD, menus, navigation and presentation state.
- Phaser owns game rendering, animation, camera, effects and visual interaction.
- Domain/gameplay rules belong in the domain/backend package, never in Svelte components or Phaser scenes.
- The combat engine is authoritative for simulation and calculation results.
- Shared DTOs, enums and contracts belong in `packages/shared-types`.
- Do not introduce a duplicate domain model when a shared type or domain abstraction already exists.

## Agent workflow

1. Inspect the existing implementation before changing it.
2. Search for existing types, services and patterns before creating new ones (use `rg` if available).
3. Keep changes focused on the requested task: no unrelated refactors or migrations, no extra feature, no over-engineering.
4. Prefer small, reversible changes; preserve existing behavior unless the task asks to change it.
5. For bug fixes, write the regression test first.
6. Do not modify `packages/shared-types` unless the change genuinely requires a contract change; explain why in the final summary.
7. Do not modify `clients/fight-replayer` unless explicitly requested.
8. Never commit secrets, credentials, generated artifacts or local environment files.
9. Avoid `python` scripts unless absolutely necessary.

## Code quality

- Stay simple, pragmatic, effective; no speculative abstractions.
- Eliminate duplication; express intent through naming and structure; no comments on obvious code, comments only for tricky logic.
- Keep methods and components small, focused on one responsibility; make dependencies and side effects explicit; minimize state.
- No silent error: throw exceptions early.
- Follow the versions pinned by the repository.
- Refactoring preserves the intent.

## Testing

- Write tests first for bug fixes.
- Never mock functional components.
- Conventions (one expectation and at most 10 lines per `it`, helpers, e2e layout): `docs/memory-bank/backend/TESTING.md` and `CODING_ASSERTIONS.md`.

## Validation

Before considering a task complete, run `pnpm verify` from the root (memory-bank size, check, build, lint, tests, engine e2e). If a part cannot be run, report exactly which command was skipped and why.

Useful commands (root): `pnpm dev`, `pnpm check`, `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm verify`, `pnpm --filter combat-engine test` / `lint` (or `npm test` / `npm run lint` from `packages/combat-engine/`).

## Git

- Work on a branch, never directly on `main`; keep commits focused.
- For agent-generated work, prefer a pull request so the diff is reviewed before merging.
- Do not rewrite history or force-push unless explicitly requested.
- Use the `gh` CLI for GitHub when it is available.

## Answering

- Be 100% sure of your answers; if unsure, say "I don't know" or ask for clarification.
- Never say "you are right!"; anticipate mistakes instead.

## Memory bank

Describe each mechanic once, in `backend/ARCHITECTURE.md`; other files only link to it. `pnpm check:memory-bank` fails above 100k characters of loaded instructions (Claude Code warns at 150k) and checks that `CLAUDE.md` is still a symlink to `AGENTS.md`.

### Project Documentation

- @docs/memory-bank/PROJECT_BRIEF.md - Project vision, domain language, features, and user journeys
- @docs/memory-bank/STACK.md - Technology stack, runtime, testing frameworks, and build tools
- @docs/memory-bank/CODEBASE_STRUCTURE.md - Project structure and file map
- @docs/memory-bank/DEPLOYMENT.md - CI/CD pipeline, build process, infrastructure, and environment variables

### Backend Module

- @docs/memory-bank/backend/ARCHITECTURE.md - Hexagonal architecture, domain mechanics, and communication patterns
- @docs/memory-bank/backend/CODING_ASSERTIONS.md - Code quality checklist, naming conventions, and testing standards
- @docs/memory-bank/backend/TESTING.md - Testing strategy, tools, test helpers, and execution process
- @docs/memory-bank/backend/API_DOCS.md - REST API endpoints, DTOs, validation, enums, and error handling
- @docs/memory-bank/backend/DATABASE.md - Database architecture (stateless in-memory simulator)
