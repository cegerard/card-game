---
name: plan
description: Feature implementation plan template
argument-hint: N/A
---

# Instruction: Kaelion — Multi-Effect Attack & STUNT Status

## Feature

- **Summary**: Add support for multiple status effects per attack with per-effect trigger probability, and introduce the STUNT effect type that prevents a card from acting. Enables Kaelion's "Flamme Terreuse" attack (PHYSICAL + FIRE + EARTH damages, BURN at 50%, STUNT at 20%).
- **Stack**: `TypeScript, Node.js 24, NestJS 11, class-validator, class-transformer`
- **Branch name**: `feat/kaelion-multi-effect-stunt`

## Existing files

- @src/fight/core/cards/@types/attack/attack-effect.ts
- @src/fight/core/cards/@types/attack/attack-poison-effect.ts
- @src/fight/core/cards/@types/attack/attack-burn-effect.ts
- @src/fight/core/cards/@types/attack/attack-freeze-effect.ts
- @src/fight/core/cards/@types/state/state-effect-type.ts
- @src/fight/core/cards/@types/state/card-state-frozen.ts
- @src/fight/core/cards/fighting-card.ts
- @src/fight/core/card-action/action_stage.ts
- @src/fight/core/cards/skills/simple-attack.ts
- @src/fight/core/cards/skills/multiple-attack.ts
- @src/fight/http-api/dto/fight-data.dto.ts
- @src/fight/http-api/fight.controller.ts
- @samples/cards.json

### New files to create

- src/fight/core/cards/@types/state/card-state-stunted.ts
- src/fight/core/cards/@types/attack/attack-stunt-effect.ts
- src/fight/core/cards/__tests__/stunt-effect.spec.ts
- src/fight/core/cards/__tests__/multi-effect-attack.spec.ts
- test/fight/kaelion-attack.e2e-spec.ts

## Implementation phases

### Phase 1 — STUNT domain implementation

> Add STUNT as a new status effect: skip-action state with no damage tick, no damage amplification.

1. Add `'stunt'` to `StateEffectType` union in `state-effect-type.ts`
2. Create `CardStateStunted` implementing `CardState`: `type='stunt'`, `remainingTurns`, `applyState()` decrements turns only (no damage, returns 0-damage result), `terminationEvent?`
3. Create `AttackStuntEffect` implementing `AttackEffect`: constructor `(level, probability?, terminationEvent?)`, `applyEffect()` calls `defender.setState(new CardStateStunted(...))`, returns `EffectResult`
4. Add `stunted?: CardState` + `get isStunted()` getter to `FightingCard`; extend `setState()` to route `'stunt'` type; extend `applyStateEffects()` to tick stunt; extend `removeEventBoundEffects()` to clear stunt
5. In `action_stage.ts`, add `|| card.isStunted` to the frozen-skip condition (line 44)
6. Add `STUNT = 'STUNT'` to `Effect` enum in `fight-data.dto.ts`
7. Add `case Effect.STUNT` to `buildEffect()` in `fight.controller.ts`

### Phase 2 — Multiple effects + per-effect probability

> Upgrade attack effects from a single optional field to an array; add probability-based triggering.

1. Add `probability?: number` to `AttackEffect` interface; update each effect class (`PoisonAttackEffect`, `BurnAttackEffect`, `FreezeAttackEffect`, `AttackStuntEffect`) to accept `probability` in constructor and guard `applyEffect()` with a randomizer check: `if (probability && context.randomizer.random() > probability) return null`
2. In `SimpleAttack` and `MultipleAttack`: replace `effect?: AttackEffect` with `effects?: AttackEffect[]`; in `launch()` iterate the array and collect non-null `EffectResult[]`
3. In `fight-data.dto.ts`: rename `effect?` → `effects?` on `SimpleAttackDto` and `MultipleAttackDto` (type: `EffectDto[]`); add `@IsOptional() @IsNumber() probability?: number` to `EffectDto`
4. In `fight.controller.ts`: rename `buildEffect()` → `buildEffects()` returning `AttackEffect[]`, pass `probability` from dto to each effect constructor

### Phase 3 — Tests + Kaelion sample

> Write functional harness tests first (TDD), then wire up samples.

1. **Unit — STUNT**: stunted card skips its action; stunt expires after correct number of turns; `removeEventBoundEffects` clears stunt; freeze and stunt do not interfere
2. **Unit — multi-effect + probability**: both effects applied when both trigger; neither applied when neither triggers; partial application when only one probability fires; null effect skipped gracefully
3. **E2E — Kaelion `Flamme Terreuse`**: POST `/fight` with Kaelion card; assert `state_effect` step of type `burn` appears after hit; assert `state_effect` step of type `stunt` can appear; assert three damage compositions (PHYSICAL, FIRE, EARTH) reported per attack
4. Add Kaelion card to `samples/cards.json` with full `effects` array payload

## Reviewed implementation

<!-- That section is filled by a review agent after implementation -->

- [ ] Phase 1 — STUNT domain implementation
- [ ] Phase 2 — Multiple effects + per-effect probability
- [ ] Phase 3 — Tests + Kaelion sample

## Validation flow

1. Run `npm run test` — all unit tests pass including new STUNT and multi-effect specs
2. Run `npm run test:e2e` — Kaelion E2E passes, both BURN and STUNT effects observable in fight log
3. POST `/fight` manually with `samples/cards.json` Kaelion payload; verify `state_effect` steps appear for burn and stunt
4. Run `npm run build` — no TypeScript errors

## Estimations

- **Confidence**: 9/10
  - ✅ STUNT follows the exact same pattern as FREEZE (skip action + state object) — well-understood pattern
  - ✅ Multi-effect is a straightforward array upgrade of existing single-effect plumbing
  - ✅ Probability check pattern already exists in `EffectTriggeredDebuff.tryApply()`
  - ❌ `applyEffect()` signature may need `context` added if it's not already there — needs verification during implementation
- **Time to implement**: ~2-3h
