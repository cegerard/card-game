# Tasks: Arcade Combat Mode (008) — TDD

**Input**: `specs/008-arcade-combat-mode/` — plan.md, spec.md, data-model.md, contracts/combat-engine-api.md, research.md, quickstart.md
**Branch**: `008-arcade-combat-mode`
**Mode**: TDD — test tasks appear **before** their implementations in each user story phase

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unresolved dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Bootstrap the `clients/gasha` SvelteKit application with full test tooling.

`clients/gasha/package.json` is a stub; root workspace scripts (`dev:gasha`, `build:gasha`) and `pnpm-workspace.yaml` are already configured — no changes needed there.

- [X] T001 Update `clients/gasha/package.json` — add `svelte`, `@sveltejs/kit`, `@sveltejs/adapter-static`, `phaser`, `vite`, `typescript`, `vitest`, `@testing-library/svelte`, `jsdom`, `@playwright/test`, `svelte-check`, `@sveltejs/vite-plugin-svelte` and dev tooling deps
- [X] T002 Create `clients/gasha/svelte.config.js` — `adapter-static`, `ssr: false`, `alias: { $lib: 'src/lib' }`
- [X] T003 [P] Create `clients/gasha/vite.config.ts` — `sveltekit()` plugin, `PUBLIC_COMBAT_ENGINE_URL` via `$env/static/public`, Vitest config section (`environment: 'jsdom'`, `include: ['src/**/*.spec.ts']`)
- [X] T004 [P] Create `clients/gasha/tsconfig.json` — extends `.svelte-kit/tsconfig.json`, `target: ES2021`, `paths: { "$lib/*": ["src/lib/*"] }`
- [X] T005 [P] Create `clients/gasha/eslint.config.js` and `clients/gasha/.prettierrc` — single quotes, trailing commas, 2-space indent (matches root `.prettierrc`)
- [X] T006 [P] Create `clients/gasha/playwright.config.ts` — `baseURL: 'http://localhost:5173'`, `webServer: { command: 'pnpm dev', url: 'http://localhost:5173' }`, `testDir: 'tests'`
- [X] T007 Create `clients/gasha/src/app.html` — minimal HTML shell with `%sveltekit.head%` and `%sveltekit.body%` placeholders
- [X] T008 Create `clients/gasha/src/routes/+layout.svelte` — empty root layout (`<slot />`)

**Checkpoint**: `pnpm --filter gasha dev` starts without errors; `pnpm --filter gasha test` runs with zero tests.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure all user stories depend on. No US work until complete.

**⚠️ CRITICAL**: Session store, levels, and player team are imported by every arcade-related file.

- [X] T009 Add `app.enableCors()` to `packages/combat-engine/src/main.ts` before `app.listen(port)` — required for browser `fetch()` from Gasha origin (D-004, contracts/combat-engine-api.md §CORS)
- [X] T010 [P] Define shared TypeScript types in `clients/gasha/src/lib/arcade/types.ts` — `ArcadePhase` union, `ArcadeSession` interface, `ArcadeLevel` interface, `CardConfig` with nested `SpecialConfig`, `SimpleAttackConfig`, `OtherSkillConfig`, minimal `FightResult` / `Step` union covering `fight_end` step with `winner?: string`
- [X] T011 [P] Implement arcade session Svelte store in `clients/gasha/src/lib/arcade/session.ts` — `writable<ArcadeSession>` with initial `{ currentLevel: 1, phase: 'idle', fightResult: null }`, export `resetSession()` that resets store to initial state (FR-007, FR-008, D-005)
- [X] T012 [P] Define `PLAYER_TEAM: CardConfig[]` (3–5 balanced cards) in `clients/gasha/src/lib/arcade/player-team.ts` — hand-crafted stats compatible with `FightingCardDto` schema (FR-012)
- [X] T013 [P] Define `ARCADE_LEVELS: ArcadeLevel[]` (exactly 5 entries) in `clients/gasha/src/lib/arcade/levels.ts` — progressive stat multipliers ×1.0 → ×2.5 per data-model.md table, skill complexity increases from level 3 (FR-009, FR-013, SC-003)

**Checkpoint**: All types, store, and static configs importable; no runtime errors.

---

## Phase 3: User Story 1 — Start an Arcade Session from the Menu (Priority: P1) 🎯 MVP

**Goal**: Player opens Gasha, clicks "Arcade Mode", and a combat encounter is presented.

**Independent Test**: Open `http://localhost:5173`, click "Arcade Mode" on the main menu, verify Phaser canvas mounts and the first combat begins animating.

### Tests for User Story 1 ⚠️

> **Write these tests FIRST — verify they FAIL before implementing T017–T021**

- [X] T014 [P] [US1] Write Vitest unit test for `fetchFight()` in `clients/gasha/src/lib/combat/__tests__/engine-client.spec.ts` — mock `globalThis.fetch`, assert `POST /fight` called with `{ player1: { name: 'Player', deck: PLAYER_TEAM }, player2, cardSelectorStrategy: 'speed-weighted' }`, assert `FightResult` returned on 200, assert `Error` thrown on non-200 and network failure
- [X] T015 [P] [US1] Write Vitest unit test for arcade session store in `clients/gasha/src/lib/arcade/__tests__/session.spec.ts` — assert store initial state is `{ currentLevel: 1, phase: 'idle', fightResult: null }`, assert `resetSession()` restores initial state after mutation
- [X] T016 [P] [US1] Write Playwright E2E test for US1 in `clients/gasha/tests/us1-arcade-session.spec.ts` — navigate to `/`, assert "Arcade Mode" button is visible, click it, assert URL is `/arcade`, assert `<canvas>` element present in the DOM (Phaser mounted)

### Implementation for User Story 1

- [X] T017 [US1] Implement main menu in `clients/gasha/src/routes/+page.svelte` — game title, "Arcade Mode" button using SvelteKit `goto('/arcade')` (FR-001, SC-001 ≤ 2 interactions)
- [X] T018 [P] [US1] Implement `fetchFight(player1Deck: CardConfig[], player2Deck: CardConfig[], enemyName: string): Promise<FightResult>` in `clients/gasha/src/lib/combat/engine-client.ts` — uses `PUBLIC_COMBAT_ENGINE_URL`, `player1.name: 'Player'`, `cardSelectorStrategy: 'speed-weighted'`, throws `Error` on non-200 or network failure (D-003)
- [X] T019 [US1] Implement Phaser 3 `CombatScene` class in `clients/gasha/src/lib/combat/CombatScene.ts` — extends `Phaser.Scene`, receives `FightResult` via `scene.settings.data`, replays steps sequentially in `create()`, uses `detectOutcome()` from `outcome.ts`, emits `'fight-complete'` with `{ playerWon: boolean }` on `fight_end` step (FR-010, D-002)
- [X] T020 [US1] Create `clients/gasha/src/routes/arcade/+page.svelte` — `onMount`: set session phase to `'combat'`, call `fetchFight(PLAYER_TEAM, level.enemyTeam, level.name)`, instantiate `new Phaser.Game({ scene: CombatScene, ... })` targeting `<div bind:this={container}>` (D-002); `onDestroy`: `game.destroy(true)`
- [X] T021 [US1] Wire `fight-complete` event in `clients/gasha/src/routes/arcade/+page.svelte` — listen via `game.events.on('fight-complete', ({ playerWon }) => ...)`, store `fightResult` in session, transition phase to `'victory'`, `'final-victory'`, or `'game-over'` based on `playerWon` and current level vs `ARCADE_LEVELS.length`

**Checkpoint**: US1 fully functional — T014, T015, T016 all pass.

---

## Phase 4: User Story 2 — Fight and Progress Through Levels (Priority: P1)

**Goal**: Player wins a combat, sees a victory screen, and advances to a harder next level.

**Independent Test**: Start arcade session with mocked engine returning a player-win result, confirm VictoryScreen appears and level counter increments to 2.

### Tests for User Story 2 ⚠️

> **Write these tests FIRST — verify they FAIL before implementing T024–T027**

- [X] T022 [P] [US2] Write Vitest unit test for `detectOutcome()` in `clients/gasha/src/lib/combat/__tests__/outcome.spec.ts` — assert `winner === 'Player'` → `'victory'`, `winner === undefined` (draw) → `'game-over'`, `winner !== 'Player'` → `'game-over'`
- [X] T023 [P] [US2] Write Vitest component test for `VictoryScreen.svelte` in `clients/gasha/src/lib/components/__tests__/VictoryScreen.spec.ts` — mount with `level=2, isFinalVictory=false`, assert "Next Level" and "Back to Menu" buttons visible; mount with `isFinalVictory=true`, assert "Next Level" hidden and final victory message visible

### Implementation for User Story 2

- [X] T024 [P] [US2] Extract `detectOutcome(steps: Record<number, Step>, playerName: string): 'victory' | 'game-over'` into `clients/gasha/src/lib/combat/outcome.ts` — pure function; `CombatScene.ts` (T019) must call it for the `'fight-complete'` payload; handles draw (no winner) as `'game-over'` (FR-014, contracts §Victory detection)
- [X] T025 [P] [US2] Implement `VictoryScreen.svelte` in `clients/gasha/src/lib/components/VictoryScreen.svelte` — props: `level: number`, `isFinalVictory: boolean`; `on:next` event (hidden when `isFinalVictory`), `on:menu` event; level-complete or final-victory message (FR-003, FR-011)
- [X] T026 [US2] Integrate `VictoryScreen` into `clients/gasha/src/routes/arcade/+page.svelte` — show when `$session.phase === 'victory' || 'final-victory'`; "Next Level": `currentLevel++`, fetch next level enemy, restart `CombatScene`; "Back to Menu": `resetSession()` + `goto('/')` (FR-003, FR-008)
- [X] T027 [US2] Add final-victory detection in `clients/gasha/src/routes/arcade/+page.svelte` — when player wins and `currentLevel >= ARCADE_LEVELS.length`, set phase to `'final-victory'`; "Back to Menu" from final-victory resets session (FR-011)

**Checkpoint**: US1 + US2 functional — T022, T023 pass; full win path through all 5 levels playable.

---

## Phase 5: User Story 3 — Lose a Combat and Return to Menu (Priority: P2)

**Goal**: Player loses (or draw occurs), game over screen appears, player returns to menu with fresh state.

**Independent Test**: Start arcade session, lose combat (mocked engine returns enemy win), verify `GameOverScreen` appears, click "Back to Menu", verify session resets and `currentLevel` is 1 on next session.

### Tests for User Story 3 ⚠️

> **Write these tests FIRST — verify they FAIL before implementing T030–T032**

- [X] T028 [P] [US3] Write Vitest component test for `GameOverScreen.svelte` in `clients/gasha/src/lib/components/__tests__/GameOverScreen.spec.ts` — mount component, assert "Game Over" heading visible, assert "Back to Menu" button present and emits `menu` event on click
- [X] T029 [P] [US3] Write Playwright E2E test for US3 in `clients/gasha/tests/us3-game-over.spec.ts` — mock `POST /fight` via `page.route()` returning an enemy-wins `FightResult`, start arcade session, assert `GameOverScreen` visible, click "Back to Menu", assert URL is `/` and session `currentLevel` resets to 1 on next visit to `/arcade`

### Implementation for User Story 3

- [X] T030 [P] [US3] Implement `GameOverScreen.svelte` in `clients/gasha/src/lib/components/GameOverScreen.svelte` — "Game Over" heading, `on:menu` event from "Back to Menu" button (FR-005, FR-006)
- [X] T031 [US3] Integrate `GameOverScreen` into `clients/gasha/src/routes/arcade/+page.svelte` — show when `$session.phase === 'game-over'`; "Back to Menu": `resetSession()` + `goto('/')` (FR-006, FR-014)
- [X] T032 [US3] Add error handling in `clients/gasha/src/lib/combat/engine-client.ts` and `clients/gasha/src/routes/arcade/+page.svelte` — catch fetch/API errors, display a visible error notification, then `resetSession()` + `goto('/')` (edge case spec, contracts §Error Handling)

**Checkpoint**: US1 + US2 + US3 functional — T028, T029 pass; full arcade loop (win + loss + error paths).

---

## Phase 6: User Story 4 — View Current Arcade Level (Priority: P3)

**Goal**: Level indicator shows and updates the current level throughout the arcade session.

**Independent Test**: Start arcade session, win first combat, verify `LevelIndicator` updates from "Level 1" to "Level 2".

### Tests for User Story 4 ⚠️

> **Write this test FIRST — verify it FAILS before implementing T034–T035**

- [X] T033 [P] [US4] Write Vitest component test for `LevelIndicator.svelte` in `clients/gasha/src/lib/components/__tests__/LevelIndicator.spec.ts` — mount with `level=3`, assert "Level 3" text is visible in rendered output

### Implementation for User Story 4

- [X] T034 [P] [US4] Implement `LevelIndicator.svelte` in `clients/gasha/src/lib/components/LevelIndicator.svelte` — prop `level: number`, renders "Level {level}" badge visible during combat phase (FR-004, SC-001)
- [X] T035 [US4] Integrate `LevelIndicator` into `clients/gasha/src/routes/arcade/+page.svelte` — bind `level={$session.currentLevel}`, display during `'combat'` phase (FR-004)

**Checkpoint**: All four user stories complete; all unit, component, and E2E tests pass.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T036 [P] Create `clients/gasha/static/` directory with a `.gitkeep` and comment documenting expected card sprite file structure for future asset integration
- [ ] T037 Run full-stack smoke test per `specs/008-arcade-combat-mode/quickstart.md` — `pnpm dev:engine` + `pnpm dev:gasha`, open `http://localhost:5173`, manually validate SC-001 through SC-006; record any animation frame-rate or transition-timing issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user story phases
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 3 (VictoryScreen integrates into arcade page from US1)
- **Phase 5 (US3)**: Depends on Phase 3 — parallel with Phase 4 (adds loss path)
- **Phase 6 (US4)**: Depends on Phase 3 — parallel with Phases 4 and 5 (adds display layer)
- **Phase 7 (Polish)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: Unblocked after Phase 2 — establishes core arcade page scaffold
- **US2 (P1)**: Depends on US1 arcade page — adds victory path on top
- **US3 (P2)**: Depends on US1 arcade page — adds loss path (independent of US2)
- **US4 (P3)**: Depends on US1 arcade page — adds level display (independent of US2, US3)

### Within Each User Story (TDD Order)

1. Write all `[P]` test tasks simultaneously (they touch different files)
2. Confirm tests FAIL
3. Implement in the order shown
4. Confirm tests PASS before moving to next story

### Parallel Opportunities

Within Phase 1: T003, T004, T005, T006 can run in parallel after T001 + T002
Within Phase 2: T010, T011, T012, T013 all parallel (different files); T009 touches a different package
Within Phase 3 tests: T014, T015, T016 can run in parallel (different test files)
Within Phase 3 impl: T018 can run in parallel with T017 and T019 (different files)
Phases 4, 5, 6: All can start in parallel once Phase 3 is complete

---

## Parallel Example: Phase 3 Tests (Write-fail-first)

```
# Run simultaneously — all touch different files:
T014 → src/lib/combat/__tests__/engine-client.spec.ts
T015 → src/lib/arcade/__tests__/session.spec.ts
T016 → tests/us1-arcade-session.spec.ts
```

## Parallel Example: Phases 4 + 5 + 6 (after Phase 3)

```
Developer A: Phase 4 (US2) — outcome.ts + VictoryScreen + level progression
Developer B: Phase 5 (US3) — GameOverScreen + error handling
Developer C: Phase 6 (US4) — LevelIndicator
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Write T014, T015, T016 — confirm all FAIL
4. Complete Phase 3 implementations (T017–T021)
5. Confirm T014, T015, T016 all PASS
6. **STOP and VALIDATE**: Menu → Arcade → combat animates end-to-end

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1) → Menu + combat flow → **MVP demo**
3. Phase 4 (US2) → Win path complete → full session playable
4. Phase 5 (US3) → Loss + error paths → game loop complete
5. Phase 6 (US4) → Level indicator → full spec delivered
6. Phase 7 → Smoke test + polish

### Parallel Team Strategy

With multiple developers (after Phase 3):

- Developer A: Phase 4 (US2) — victory path
- Developer B: Phase 5 (US3) — loss + error path
- Developer C: Phase 6 (US4) — level indicator

---

## Notes

- `[P]` = different files, no blocking dependencies within the phase
- `[USn]` maps each task to its user story for traceability
- Test tasks are ordered BEFORE implementation tasks within each phase — mandatory for TDD
- `clients/gasha/package.json`, `pnpm-workspace.yaml`, and root scripts already exist — Phase 1 is config and test tooling only
- `app.enableCors()` (T009) is the only change to the combat engine for this feature
- `outcome.ts` (T024) is a pure function extracted from `CombatScene` to make winner detection testable without mocking Phaser
- `CombatScene.ts` is not unit-tested directly due to Phaser DOM dependency — covered by the US1 Playwright E2E test (T016)
