# Instruction: Combat Report Renderer

## Feature

- **Summary**: Replace the simple `WebRenderer` with a mobile-portrait combat report screen that aggregates per-card stats (damage dealt, damage taken, healing done) from the fight result and presents them in a vertical layout: enemy cards row at top, result banner in the middle, player cards row at bottom. Dead cards are visually grayed out.
- **Stack**: `SvelteKit 2.x, Svelte 5 (runes: $derived, $props), TypeScript, Vitest`
- **Branch name**: `combat-report-renderer`

## Existing files

- @clients/gasha/src/lib/combat/WebRenderer.svelte
- @clients/gasha/src/routes/arcade/+page.svelte
- @clients/gasha/src/lib/arcade/types.ts
- @clients/gasha/src/lib/arcade/player-team.ts
- @clients/gasha/src/lib/combat/outcome.ts
- @clients/gasha/src/lib/combat/**tests**/outcome.spec.ts

### New files to create

- clients/gasha/src/lib/combat/combatStats.ts
- clients/gasha/src/lib/combat/CombatReportRenderer.svelte
- clients/gasha/src/lib/combat/**tests**/combatStats.spec.ts

## Implementation phases

### Phase 1 — Stat Aggregation

> Pure function that computes per-card totals from a FightResult

1. Create `combatStats.ts` with types:
   - `CardStat { id, name, damageDealt, damageTaken, healingDone, isDead }`
   - `CombatStats { playerCards: CardStat[], enemyCards: CardStat[], winner: string | null }`
2. Implement `aggregateCombatStats(fightResult: FightResult, playerCardIds: string[]): CombatStats`:
   - `attack` / `special_attack` steps: add each `d.damage` (non-dodge) to attacker's `damageDealt` and defender's `damageTaken`
   - `state_effect` steps: add `damage` field to affected card's `damageTaken`
   - `healing` steps: add each `h.healed` to source's `healingDone`
   - `status_change` with `status === 'dead'`: set `isDead = true`
   - `fight_end` step: extract `winner` name
   - Partition all discovered cards into `playerCards` / `enemyCards` using the `playerCardIds` set
3. Write unit tests in `combatStats.spec.ts`:
   - Damage dealt / taken accumulation across multiple attack steps
   - State effect damage contributes to `damageTaken`
   - Healing accumulation
   - Dead card detection from `status_change`
   - Player / enemy partitioning via `playerCardIds`
   - Winner extraction from `fight_end`
   - Dodge hits (damage = 0) do not inflate `damageTaken`

### Phase 2 — CombatReportRenderer Component

> New Svelte component with a mobile-portrait layout showing the combat report

1. Create `CombatReportRenderer.svelte` with Props: `{ fightResult: FightResult, playerName: string, playerCardIds: string[], oncomplete: ({ playerWon }) => void }`
2. Derive stats using `$derived(aggregateCombatStats(fightResult, playerCardIds))` and outcome using existing `detectOutcome`
3. Layout — `display: flex; flex-direction: column; height: 100dvh`:
   - **Top section** (~40%): enemy cards row — `display: flex; flex-wrap: wrap; align-content: center`
   - **Middle section** (~20%): result banner — outcome title (Victory / Defeat), winner name, Continue button
   - **Bottom section** (~40%): player cards row — same flex layout
4. Card mini-panel for each `CardStat`:
   - Card name
   - Damage dealt, damage taken, healing done (hide healing row when 0)
   - Dead state: `filter: grayscale(1); opacity: 0.5`
   - Cards use `flex: 1 1 0; min-width: 0` to share row width equally

### Phase 3 — Arcade Integration

> Replace WebRenderer with CombatReportRenderer in the arcade page

1. In `+page.svelte`, import `CombatReportRenderer`, replace the `rendererMode === 'web'` branch to use it with `playerCardIds={PLAYER_TEAM.map(c => c.id)}`
2. Remove the now-unused `WebRenderer` import and delete `WebRenderer.svelte`

## Reviewed implementation

- [ ] Phase 1 — Stat Aggregation
- [ ] Phase 2 — CombatReportRenderer Component
- [ ] Phase 3 — Arcade Integration

## Validation flow

1. Run `pnpm --filter gasha dev` and open `http://localhost:5173/arcade` in a mobile-sized viewport (portrait, ~390×844)
2. Start a combat — confirm the report screen appears immediately after fetch (no replay animation)
3. Verify enemy cards appear in the top row, player cards in the bottom row
4. Verify each card panel shows three stat lines (damage dealt, damage taken, healing if non-zero)
5. Verify dead cards are visually grayed out; surviving cards appear normally
6. Verify the middle banner shows the correct outcome (Victory or Defeat) and winner name
7. Click Continue — confirm the arcade session advances to the next phase (victory screen or game-over)
8. Run `pnpm --filter gasha test` and confirm all unit tests pass

## Estimations

- Confidence: 9/10
  - ✅ Parser pattern is well-established in fight-replayer (`parser.js`) — aggregation logic is straightforward to port
  - ✅ Renderer pattern is clear: same Props contract as existing renderers
  - ✅ No backend changes required; purely frontend
  - ✅ Fight result format is well-documented
  - ❌ `Step` type uses `[key: string]: unknown` — aggregation code requires type narrowing/casts for `attacker`, `damages`, etc.
- Time to implement: ~2h
