# Agent Development Guidelines

## Project overview

This repository is a pnpm TypeScript monorepo for a card game.

- `clients/gasha`: SvelteKit + Phaser client.
- `packages/combat-engine`: authoritative/stateless NestJS simulation backend.
- `packages/shared-types`: shared contracts/types between packages and clients.
- `clients/fight-replayer`: static fight replay client for manual testing purpose. Do not migrate or refactor it unless explicitly requested.
- `docs/memory-bank`: project context and architecture decisions.

## Architecture boundaries

- Svelte is responsible for application UI, HUD, menus, navigation and presentation state.
- Phaser is responsible for game rendering, animation, camera, effects and visual interaction.
- Domain/gameplay rules belong in the appropriate domain/backend package, not in Svelte components or Phaser scenes.
- The combat engine is authoritative for simulation/calculation results.
- Shared DTOs, enums and contracts belong in `packages/shared-types`.
- Do not introduce duplicate domain models when an existing shared type or domain abstraction already exists.

## Agent workflow

1. Inspect the existing implementation before changing it.
2. Search for existing types, services and patterns before creating new ones.
3. Keep changes focused on the requested task.
4. Do not perform unrelated refactors or migrations.
5. Prefer small, reversible changes.
6. For bug fixes, add or update a regression test before considering the fix complete.
7. Do not modify `packages/shared-types` unless the change genuinely requires a contract change; explain why in the final summary.
8. Do not modify `clients/fight-replayer` unless explicitly requested.
9. Never commit secrets, credentials, generated artifacts or local environment files.

## Validation

Before considering a task complete, run:

```bash
pnpm verify
```

If a part of verification cannot be run, report exactly which command was skipped and why.

## Useful commands

```bash
pnpm dev
pnpm check
pnpm test
pnpm lint
pnpm build
pnpm verify
```

## Git

- Work on a branch, never directly on `main`.
- Keep commits focused.
- For agent-generated work, prefer a pull request so the diff can be reviewed before merging.
- Do not rewrite history or force-push unless explicitly requested.

## Code quality

- Follow the versions pinned by the repository.
- Keep methods and components focused.
- Make dependencies and side effects explicit.
- Avoid speculative abstractions and over-engineering.
- Preserve existing behavior unless the task explicitly asks for a behavior change.