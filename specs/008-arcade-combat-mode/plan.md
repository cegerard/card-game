# Implementation Plan: Arcade Combat Mode

**Branch**: `008-arcade-combat-mode` | **Date**: 2026-06-08 | **Spec**: specs/008-arcade-combat-mode/spec.md

## Summary

Build a new SvelteKit 2.x + Phaser 3 client application (`clients/gasha`) implementing an arcade combat mode: a sequence of ≥5 progressively harder enemy encounters. The client calls the existing combat engine REST API (`POST /fight`) for fight resolution and animates results via a Phaser 3 scene. All session state is in-memory (Svelte stores); no persistence. One minor infrastructure change to the combat engine (`app.enableCors()`) enables browser requests from the Gasha origin.

## Technical Context

**Language/Version**: TypeScript — SvelteKit 2.x + Phaser 3.60+, Node.js 26, ES2021+  
**Primary Dependencies**: `@sveltejs/kit`, `svelte`, `phaser`, `vite`, `@sveltejs/adapter-static`, `@card-game/shared-types`  
**Storage**: N/A — stateless; arcade session held in Svelte writable store (in-memory only)  
**Testing**: Vitest (SvelteKit default unit/component tests); Playwright for E2E  
**Target Platform**: Browser (desktop), served as static files  
**Project Type**: Web application — SPA-like static export  
**Performance Goals**: 60fps combat animation (SC-004); screen transitions < 3s (SC-005)  
**Constraints**: No persistence between sessions (FR-007); predefined player team, no deck selection (FR-012)  
**Scale/Scope**: ≥5 arcade levels; single-player only; no authentication

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Domain Isolation | ✅ PASS | Combat engine domain is untouched. Gasha is a pure HTTP consumer — no domain logic. |
| II. Test-First Development | ✅ PASS | Component tests written before implementation; arcade session store tested before wiring. No functional mocks. |
| III. Simplicity — No Over-Engineering | ✅ PASS | Static level configs, single store, SvelteKit's built-in routing. No state machine library, no ORM, no DI framework. |
| IV. Fail Fast — No Silent Errors | ✅ PASS | API errors surface immediately via error notification + redirect to menu. No swallowed rejections. |
| V. Clean Code — Eliminate Duplication | ✅ PASS | Level configs are data, not logic. CardConfig type mirrors the API DTO — no parallel type hierarchy. |

*Re-checked after Phase 1 design: no violations.*

## Project Structure

### Documentation (this feature)

```text
specs/008-arcade-combat-mode/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── combat-engine-api.md  # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code

```text
clients/gasha/
├── package.json                     # svelte, @sveltejs/kit, phaser, vite, adapter-static
├── svelte.config.js                 # adapter-static; no SSR
├── vite.config.ts                   # PUBLIC_COMBAT_ENGINE_URL env var
├── tsconfig.json                    # ES2021, paths alias for $lib
├── src/
│   ├── app.html                     # HTML shell
│   ├── routes/
│   │   ├── +layout.svelte           # Root layout (minimal)
│   │   ├── +page.svelte             # Main menu (FR-001)
│   │   └── arcade/
│   │       └── +page.svelte         # Arcade page: hosts Phaser + overlays (FR-002..014)
│   └── lib/
│       ├── arcade/
│       │   ├── levels.ts            # ArcadeLevel[] — ≥5 static enemy configs (FR-009, FR-013)
│       │   ├── player-team.ts       # PLAYER_TEAM: CardConfig[] — fixed (FR-012)
│       │   └── session.ts           # Svelte writable store: ArcadeSession (FR-007, FR-008)
│       ├── combat/
│       │   ├── engine-client.ts     # fetchFight(p1, p2): Promise<FightResult> (POST /fight)
│       │   └── CombatScene.ts       # Phaser 3 Scene: step-by-step fight animation (FR-010)
│       └── components/
│           ├── LevelIndicator.svelte  # "Level N" badge (FR-004, SC-001)
│           ├── VictoryScreen.svelte   # Win overlay + "Next Level" / "Back to Menu" (FR-003, FR-011)
│           └── GameOverScreen.svelte  # Loss overlay + "Back to Menu" (FR-005, FR-006)
└── static/                          # Assets (card images, audio — TBD)

packages/combat-engine/src/main.ts   # Add app.enableCors() — required for browser CORS (D-004)
```

**Structure Decision**: Single SvelteKit app with two routes (`/` menu, `/arcade` game). Phaser 3 embedded inside the arcade route via `onMount` / `onDestroy`. Svelte components handle all non-Phaser UI (menus, overlays). Shared state via a single Svelte store.

## Complexity Tracking

| Complexity | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| New client application | Spec explicitly targets `clients/gasha` as a new app; a browser game UI cannot live in the NestJS backend | N/A — scope requirement |
| Two frontend libraries (SvelteKit + Phaser 3) | Both are explicitly named in spec assumptions as confirmed design decisions | SvelteKit alone lacks a 2D game loop; Phaser alone lacks SvelteKit routing; removing Phaser would break FR-010 (combat animation) |
