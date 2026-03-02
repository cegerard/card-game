# Instruction: Effect-Triggered Debuff

## Feature

- **Summary**: Allow an attack effect (burn/poison/freeze) to optionally trigger a secondary debuff on the target when successfully applied, with a configurable probability.
- **Stack**: `Node.js`, `NestJS`, `TypeScript`, `Jest`
- **Branch name**: `feat/effect-triggered-debuff`

## Existing files

- @src/fight/core/cards/@types/attack/attack-effect.ts
- @src/fight/core/cards/@types/attack/attack-burned-effect.ts
- @src/fight/core/cards/@types/attack/attack-poisoned-effect.ts
- @src/fight/core/cards/@types/attack/attack-frozen-effect.ts
- @src/fight/http-api/dto/fight-data.dto.ts
- @src/fight/http-api/fight.controller.ts

### New file to create

- `src/fight/core/cards/@types/attack/effect-triggered-debuff.ts`

## Implementation phases

### Phase 1: Domain

> Introduce the `EffectTriggeredDebuff` concept and wire it into the existing effect system.

1. Create `EffectTriggeredDebuff` class with `probability: number`, `debuffType: DebuffType`, `debuffRate: number`, `duration: number` and a `tryApply(target: FightingCard): Debuff | undefined` method that rolls `Math.random()` against `probability` then calls `target.applyDebuff()` on success
2. Extend `EffectResult` (in `attack-effect.ts`) with optional field `triggeredDebuff?: { card: FightingCard; debuff: Debuff }`
3. Add `triggeredDebuff?: EffectTriggeredDebuff` as optional property to the `AttackEffect` interface
4. In each of the three effect classes (`BurnedAttackEffect`, `PoisonedAttackEffect`, `FrozenAttackEffect`): after the successful `setState` call, invoke `this.triggeredDebuff?.tryApply(defender)` and attach the result to the returned `EffectResult`

### Phase 2: HTTP API

> Expose the new concept through the existing DTO and factory layers.

1. Add `EffectTriggeredDebuffDto` class in `fight-data.dto.ts` with `debuffType: BuffType`, `debuffRate: number`, `duration: number`, `probability: number`
2. Add `@IsOptional() triggeredDebuff?: EffectTriggeredDebuffDto` to the existing `EffectDto` class
3. In `fight.controller.ts`, extract a `buildEffect(effectDto)` helper that instantiates the correct `AttackEffect` (poison/burn/freeze) and passes a new `EffectTriggeredDebuff` instance when `effectDto.triggeredDebuff` is present — replace the three duplicated effect-building blocks (simpleAttack, special) with calls to this helper

### Phase 3: Tests

> Cover the new behaviour with unit and integration tests.

1. Unit test for `EffectTriggeredDebuff.tryApply()`: debuff is applied when roll succeeds (mock `Math.random`), nothing is applied when roll fails
2. Update `BurnedAttackEffect` tests: when a `triggeredDebuff` is set and effect is applied, `EffectResult.triggeredDebuff` is populated; when effect is skipped (burn level already high enough), no triggered debuff
3. Same coverage for `PoisonedAttackEffect` and `FrozenAttackEffect`

## Reviewed implementation

- [ ] Phase 1: Domain
- [ ] Phase 2: HTTP API
- [ ] Phase 3: Tests

## Validation flow

1. POST `/fight` with a card whose `simpleAttack.effect` is `BURN` with a `triggeredDebuff` (e.g., `debuffType: defense`, `debuffRate: -0.08`, `duration: 2`, `probability: 1.0`)
2. Verify in the fight result that when burn is applied, the target card's defense is debuffed in the subsequent turn
3. Set `probability: 0.0` and confirm the debuff never fires
4. Repeat with a card using a Skill that applies an effect (once such a skill exists) — the trigger must work identically

## Estimations

- Confidence: 9/10
  - ✅ Clean extension point: `AttackEffect` is the single application site for all callers (attack, special, skill)
  - ✅ Follows existing patterns: `BuffApplication`, `DebuffSkill`, factory/DTO conventions are well established
  - ✅ No breaking changes: `triggeredDebuff` is optional throughout
  - ❌ Minor risk: `EffectResult` is used across multiple result types; propagation to the final `FightResult` output must be verified
