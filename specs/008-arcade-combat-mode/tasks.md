# Tasks: Arcade Combat Mode (008)

**Input**: `specs/008-arcade-combat-mode/` — plan.md, spec.md, data-model.md, contracts/combat-engine-api.md, research.md, quickstart.md  
**Branch**: `008-arcade-combat-mode`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unresolved dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Bootstrap the `clients/gasha` SvelteKit application.

`clients/gasha/package.json` already exists as a stub; root workspace scripts (`dev:gasha`, `build:gasha`) and `pnpm-workspace.yaml` are already configured — no changes needed there.

- [ ] T001 Update `clients/gasha/package.json` with full deps: `svelte`, `@sveltejs/kit`, `@sveltejs/adapter-static`, `phaser`, `vite`, `typescript`, `vitest`, `@sveltejs/vite-plugin-svelte`, `svelte-check` and dev tooling
- [ ] T002 Create `clients/gasha/svelte.config.js` — `adapter-static`, no SSR (`ssr: false`), `paths.base` empty, `alias: { $lib: 'src/lib' }`
- [ ] T003 [P] Create `clients/gasha/vite.config.ts` — import `sveltekit()` plugin, expose `PUBLIC_COMBAT_ENGINE_URL` via `$env/static/public` (default `http://localhost:3000`)
- [ ] T004 [P] Create `clients/gasha/tsconfig.json` — `extends: ".svelte-kit/tsconfig.json"`, `target: ES2021`, `paths: { "$lib/*": ["src/lib/*"] }`
- [ ] T005 [P] Create `clients/gasha/eslint.config.js` and `clients/gasha/.prettierrc` — single quotes, trailing commas, 2-space indent (matches root `.prettierrc`)
- [ ] T006 Create `clients/gasha/src/app.html` — minimal HTML shell with `%sveltekit.head%` and `%sveltekit.body%` placeholders
- [ ] T007 Create `clients/gasha/src/routes/+layout.svelte` — empty root layout wrapper (`<slot />`)

**Checkpoint**: `pnpm --filter gasha dev` should start Vite without errors.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infrastructure all user stories depend on. No US work begins until this phase is complete.

**⚠️ CRITICAL**: Session store, levels, and player team are read by every arcade route.

- [ ] T008 Add `app.enableCors()` to `packages/combat-engine/src/main.ts` before `app.listen(port)` — required for browser `fetch()` from Gasha origin (D-004, contracts/combat-engine-api.md §CORS)
- [ ] T009 [P] Define shared TypeScript types in `clients/gasha/src/lib/arcade/types.ts` — `ArcadePhase` union, `ArcadeSession` interface, `ArcadeLevel` interface, `CardConfig` with nested `SpecialConfig`, `SimpleAttackConfig`, `OtherSkillConfig`, minimal `FightResult` / `Step` union (`fight_end` winner field)
- [ ] T010 [P] Implement arcade session Svelte store in `clients/gasha/src/lib/arcade/session.ts` — `writable<ArcadeSession>` with initial `{ currentLevel: 1, phase: 'idle', fightResult: null }`, export `resetSession()` helper (FR-007, FR-008, D-005)
- [ ] T011 [P] Define `PLAYER_TEAM: CardConfig[]` (3–5 balanced cards) in `clients/gasha/src/lib/arcade/player-team.ts` — hand-crafted stats compatible with `FightingCardDto` schema (FR-012)
- [ ] T012 [P] Define `ARCADE_LEVELS: ArcadeLevel[]` (exactly 5 entries) in `clients/gasha/src/lib/arcade/levels.ts` — progressive stat multipliers ×1.0 → ×2.5 per data-model.md table, skill complexity increases from level 3 (FR-009, FR-013, SC-003)

**Checkpoint**: All types, store, and static configs importable without runtime errors.

---

## Phase 3: User Story 1 — Start an Arcade Session from the Menu (Priority: P1) 🎯 MVP

**Goal**: Player opens Gasha, clicks "Arcade Mode", and a combat encounter is presented.

**Independent Test**: Open `http://localhost:5173`, click "Arcade Mode" on the main menu, verify the Phaser canvas mounts and the first combat begins animating.

- [ ] T013 [US1] Implement main menu in `clients/gasha/src/routes/+page.svelte` — display game title, "Arcade Mode" button that navigates to `/arcade` via SvelteKit `goto()` (FR-001, SC-001 ≤ 2 interactions)
- [ ] T014 [P] [US1] Implement combat engine API client in `clients/gasha/src/lib/combat/engine-client.ts` — `fetchFight(player1Deck: CardConfig[], player2Deck: CardConfig[], enemyName: string): Promise<FightResult>` using `PUBLIC_COMBAT_ENGINE_URL`, `cardSelectorStrategy: 'speed-weighted'`, throws `Error` on non-200 or network failure (D-003, contracts/combat-engine-api.md)
- [ ] T015 [US1] Implement Phaser 3 `CombatScene` class in `clients/gasha/src/lib/combat/CombatScene.ts` — extends `Phaser.Scene`, receives `FightResult` via scene data, replays steps sequentially in `create()`, emits `'fight-complete'` custom event with `{ playerWon: boolean }` on `fight_end` step (FR-010, D-002)
- [ ] T016 [US1] Create `clients/gasha/src/routes/arcade/+page.svelte` — `onMount`: set session phase to `'combat'`, call `fetchFight` with `PLAYER_TEAM` vs level 1 enemy, instantiate `new Phaser.Game({ scene: CombatScene, ... })` targeting a `<div bind:this={container}>`; `onDestroy`: call `game.destroy(true)` (D-002, D-005)
- [ ] T017 [US1] Wire `CombatScene`'s `fight-complete` event in `clients/gasha/src/routes/arcade/+page.svelte` — listen via `game.events.on('fight-complete', handler)`, store `fightResult` in session, route to victory/game-over phase based on outcome

**Checkpoint**: US1 fully functional — menu → arcade → combat animates end-to-end.

---

## Phase 4: User Story 2 — Fight and Progress Through Levels (Priority: P1)

**Goal**: Player wins a combat, sees a victory screen, and advances to a harder next level.

**Independent Test**: Start arcade session, verify `CombatScene` resolves to victory, click "Next Level", confirm level counter increments and a new (harder) combat begins.

- [ ] T018 [P] [US2] Implement `VictoryScreen.svelte` in `clients/gasha/src/lib/components/VictoryScreen.svelte` — props: `level: number`, `isFinalVictory: boolean`; slots/events: `on:next` (hidden when `isFinalVictory`), `on:menu`; shows level-complete message or final victory message (FR-003, FR-011)
- [ ] T019 [US2] Integrate `VictoryScreen` into `clients/gasha/src/routes/arcade/+page.svelte` — show when `$session.phase === 'victory' || 'final-victory'`; "Next Level" handler: increment `currentLevel`, fetch next enemy team, call `fetchFight`, restart `CombatScene`; "Back to Menu" handler: call `resetSession()` and `goto('/')` (FR-003, FR-008)
- [ ] T020 [US2] Add final-victory detection in `clients/gasha/src/routes/arcade/+page.svelte` — when player wins and `currentLevel >= ARCADE_LEVELS.length`, set phase to `'final-victory'` instead of `'victory'`; "Back to Menu" from final-victory resets session (FR-011)

**Checkpoint**: US1 + US2 both functional — full win path from level 1 through level 5 playable.

---

## Phase 5: User Story 3 — Lose a Combat and Return to Menu (Priority: P2)

**Goal**: Player loses (or draw occurs), game over screen appears, player returns to menu with fresh state.

**Independent Test**: Lose first combat, verify `GameOverScreen` appears, click "Back to Menu", verify session resets and level 1 starts fresh on next session.

- [ ] T021 [P] [US3] Implement `GameOverScreen.svelte` in `clients/gasha/src/lib/components/GameOverScreen.svelte` — "Game Over" heading, `on:menu` event from "Back to Menu" button (FR-005, FR-006)
- [ ] T022 [US3] Integrate `GameOverScreen` into `clients/gasha/src/routes/arcade/+page.svelte` — show when `$session.phase === 'game-over'`; "Back to Menu" handler: call `resetSession()` and `goto('/')` (FR-006, FR-014)
- [ ] T023 [US3] Add error handling to `clients/gasha/src/lib/combat/engine-client.ts` and `clients/gasha/src/routes/arcade/+page.svelte` — catch fetch errors, surface a visible error notification (e.g., Svelte `bind:this` toast or alert), then call `resetSession()` and `goto('/')` (edge case spec, contracts/combat-engine-api.md §Error Handling)

**Checkpoint**: US1 + US2 + US3 functional — complete arcade loop (win path + loss path + error path).

---

## Phase 6: User Story 4 — View Current Arcade Level (Priority: P3)

**Goal**: Level indicator shows current level throughout the arcade session, updates on progression.

**Independent Test**: Start arcade session, win first combat, verify `LevelIndicator` updates from "Level 1" to "Level 2".

- [ ] T024 [P] [US4] Implement `LevelIndicator.svelte` in `clients/gasha/src/lib/components/LevelIndicator.svelte` — prop `level: number`, renders "Level {level}" badge visible during combat phase (FR-004, SC-001)
- [ ] T025 [US4] Integrate `LevelIndicator` into `clients/gasha/src/routes/arcade/+page.svelte` — bind `level={$session.currentLevel}`, display during `'combat'` phase (FR-004)

**Checkpoint**: All four user stories complete and independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T026 [P] Create `clients/gasha/static/` directory with a `.gitkeep` and document expected asset structure (card sprite placeholders) for future asset integration
- [ ] T027 Run full-stack smoke test per `specs/008-arcade-combat-mode/quickstart.md` — `pnpm dev:engine` + `pnpm dev:gasha`, open `http://localhost:5173`, manually validate SC-001 through SC-006; record any animation frame-rate or transition timing issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user story phases
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 3 (VictoryScreen integrates into arcade page built in US1)
- **Phase 5 (US3)**: Depends on Phase 3 (GameOverScreen integrates into arcade page built in US1)
- **Phase 6 (US4)**: Depends on Phase 3 (LevelIndicator integrates into arcade page)
- **Phase 7 (Polish)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: Unblocked after Phase 2 — implements the core flow scaffold
- **US2 (P1)**: Depends on US1 arcade page existing — adds victory path on top
- **US3 (P2)**: Depends on US1 arcade page existing — adds loss path on top (parallel with US2)
- **US4 (P3)**: Depends on US1 arcade page existing — adds display overlay (parallel with US2 and US3)

### Parallel Opportunities

Within Phase 1: T003, T004, T005 can run in parallel after T001 + T002  
Within Phase 2: T009, T010, T011, T012 can all run in parallel after T008 (or concurrently with T008 since they touch different files)  
Within Phase 3: T014 (engine-client) can run in parallel with T013 (menu page) and T015 (CombatScene)  
Phases 4, 5, 6: US2, US3, US4 can all start in parallel once Phase 3 is complete  

---

## Parallel Example: Phase 2

```
# All four can run simultaneously (different files):
T009 → src/lib/arcade/types.ts
T010 → src/lib/arcade/session.ts
T011 → src/lib/arcade/player-team.ts
T012 → src/lib/arcade/levels.ts
```

## Parallel Example: Phases 4 + 5 + 6 (after Phase 3)

```
Developer A: Phase 4 (US2) — VictoryScreen + level progression
Developer B: Phase 5 (US3) — GameOverScreen + error handling
Developer C: Phase 6 (US4) — LevelIndicator
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (menu → arcade → combat animates)
4. **STOP and VALIDATE**: Click "Arcade Mode", verify combat encounter appears
5. Demo-able at this point

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1) → Menu + combat flow works (**MVP**)
3. Phase 4 (US2) → Win path complete → full session playable
4. Phase 5 (US3) → Loss + error paths → game loop complete
5. Phase 6 (US4) → Level indicator → full spec delivered
6. Phase 7 → Smoke test + polish

---

## Notes

- `[P]` = different files, no blocking dependencies within the phase
- `[USn]` maps each task to a user story for traceability
- `clients/gasha/package.json`, `pnpm-workspace.yaml`, and root scripts already exist — Phase 1 focuses on SvelteKit config and source scaffolding only
- `app.enableCors()` (T008) is the only change to the combat engine for this feature
- No test tasks generated — not explicitly requested in spec; add with `/speckit.tasks --tdd` if needed
