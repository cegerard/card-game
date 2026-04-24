# Instruction: Buff/Debuff Expiration and Removal Reporting

## Feature

- **Summary**: Add missing fight result steps for buff/debuff lifecycle events — event-based debuff removal (`debuff_removed`) and natural duration expiration (`buff_expired`, `debuff_expired`) — so clients have a complete picture of stat modifier changes during a battle.
- **Stack**: `TypeScript 5, Node.js 24, NestJS 11, Jest 29`
- **Branch name**: `feat/buff-debuff-expiration-reporting`

## Existing files

- @src/fight/core/cards/@types/buff/debuff.ts
- @src/fight/core/cards/@types/buff/buff.ts
- @src/fight/core/cards/fighting-card.ts
- @src/fight/core/cards/@types/attack/effect-triggered-debuff.ts
- @src/fight/core/fight-simulator/end-event-processor.ts
- @src/fight/core/fight-simulator/turn-manager.ts
- @src/fight/core/fight-simulator/@types/step.ts
- @src/fight/core/fight-simulator/@types/buff-removed-report.ts
- @src/fight/http-api/dto/fight-data.dto.ts
- @src/fight/http-api/fight.controller.ts
- @docs/memory-bank/backend/API_DOCS.md

### New files to create

- `src/fight/core/fight-simulator/@types/debuff-removed-report.ts`
- `src/fight/core/fight-simulator/@types/buff-expired-report.ts`
- `src/fight/core/fight-simulator/@types/debuff-expired-report.ts`

## Implementation phases

### Phase 1: `debuff_removed` — event-based debuff removal

> Mirror the existing `buff_removed` mechanism for debuffs.

1. Add `terminationEvent?: string` and `powerId?: string` to `Debuff` type
2. Update `FightingCard.applyDebuff()` to accept `terminationEvent` and `powerId` params
3. Add `FightingCard.removeEventBoundDebuffs(eventName)` returning `{ type: DebuffType; value: number }[]`
4. Create `DebuffRemovedReport` type: `{ kind: StepKind.DebuffRemoved; source: CardInfo; eventName: string; removed: { target: CardInfo; kind: DebuffType; value: number }[]; powerId?: string }`
5. Add `StepKind.DebuffRemoved = 'debuff_removed'` and include `DebuffRemovedReport` in the `Step` union
6. Add debuff sweep to `EndEventProcessor.processEndEvent()` (after buff sweep), emit `debuff_removed` step
7. Update `EffectTriggeredDebuff` to store and forward `terminationEvent` to `applyDebuff`
8. Add `terminationEvent?: string` to `EffectTriggeredDebuffDto` and pass it through in `fight.controller.ts`
9. Write unit tests: `removeEventBoundDebuffs` on `FightingCard`, `EndEventProcessor` debuff sweep

### Phase 2: `buff_expired` / `debuff_expired` — natural duration expiration

> Report stat modifiers that reach duration 0 at end-of-turn.

1. Modify `FightingCard.decreaseBuffAndDebuffDuration()` to return `{ expiredBuffs: Buff[]; expiredDebuffs: Debuff[] }` instead of `void`
2. Create `BuffExpiredReport`: `{ kind: StepKind.BuffExpired; card: CardInfo; expired: { kind: BuffType; value: number }[] }`
3. Create `DebuffExpiredReport`: `{ kind: StepKind.DebuffExpired; card: CardInfo; expired: { kind: DebuffType; value: number }[] }`
4. Add `StepKind.BuffExpired = 'buff_expired'` and `StepKind.DebuffExpired = 'debuff_expired'`; include both in the `Step` union
5. Update `TurnManager.endTurn()` to collect expired items and push `buff_expired` / `debuff_expired` steps per card (skip empty results)
6. Write unit tests: `decreaseBuffAndDebuffDuration` returns expiry data, `TurnManager` emits correct steps

### Phase 3: API docs update

> Keep documentation in sync with new step kinds.

1. Add `debuff_removed`, `buff_expired`, `debuff_expired` to the step kind enum list and response format section in `API_DOCS.md`
2. Document `EffectTriggeredDebuffDto.terminationEvent` field

## Reviewed implementation

- [ ] Phase 1: `debuff_removed`
- [ ] Phase 2: `buff_expired` / `debuff_expired`
- [ ] Phase 3: API docs

## Validation flow

1. Run `npm run test:cov` — all tests pass, coverage maintained
2. Verify new unit tests cover: `removeEventBoundDebuffs`, `EndEventProcessor` debuff sweep, `decreaseBuffAndDebuffDuration` return value, `TurnManager` step emission
3. Run `npm run build` — no TypeScript errors
4. Send a POST `/fight` with a debuff that has a `terminationEvent` and a skill that fires that event; confirm `debuff_removed` step appears in result
5. Send a POST `/fight` with cards that have finite-duration buffs/debuffs; confirm `buff_expired` / `debuff_expired` steps appear after the correct turn

## Estimations

- Confidence: 9.5/10
  - ✅ Pattern is identical to existing `buff_removed` / `effect_removed` — low risk of design errors
  - ✅ `decreaseBuffAndDebuffDuration` change is isolated and the return value is straightforward
  - ✅ All touched files are already well-tested
  - ❌ Slight risk: infinite-duration buffs (duration = `Infinity`) must be excluded from expiry reporting — need to guard `duration === 0` check after decrement (Infinity - 1 = Infinity, so the filter handles it, but worth verifying)
- Time to implement: ~1.5h
