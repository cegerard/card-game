# Instruction: Integrate DamageCalculator into SimpleAttack

## Feature

- **Summary**: Replace the manual damage computation in `SimpleAttack` with `DamageCalculator`, enabling elemental typing and actual-defense calculations on simple attacks. Adapt the constructor, DTO, controller, test helpers, and sample data accordingly.
- **Stack**: `Node.js`, `NestJS`, `TypeScript`, `Jest`
- **Branch name**: `feat/integrate-damage-calculator-simple-attack`

## Existing files

- @src/fight/core/cards/skills/simple-attack.ts
- @src/fight/core/cards/damage/damage-calculator.ts
- @src/fight/core/cards/fighting-card.ts
- @src/fight/http-api/fight.controller.ts
- @src/fight/http-api/dto/fight-data.dto.ts
- @test/helpers/fighting-card.ts
- @samples/cards.json
- @src/fight/core/__tests__/attack.spec.ts

### New file to create

- None

## Implementation phases

### Phase 1: Expose post-calculator damage recording in FightingCard

> Give `FightingCard` a method that applies frozen and records damage without re-subtracting defense.

1. Add `applyFinalDamage(damage: number): number` that applies frozen modifier if active, increments `receivedDamages`, and returns the final amount.

### Phase 2: Refactor SimpleAttack to use DamageCalculator

> Replace scalar `damageRate` with `DamageComposition[]` and delegate computation to `DamageCalculator`.

1. Change constructor parameter from `damageRate: number` to `damages: DamageComposition[]`.
2. In `launch()`, call `DamageCalculator.calculateDamage(this.damages, card.actualAttack * damageMultiplier, defender)` to get `{ total }`.
3. Replace `defender.collectsDamages(computedDamage)` with `defender.applyFinalDamage(result.total)`.

### Phase 3: Update DTO and controller mapping

> Align the HTTP contract and factory with the new `DamageComposition[]` shape.

1. In `SimpleAttackDto`, replace `damageRate: number` with `damages: DamageCompositionDto[]` (each entry has `type: DamageType` and `rate: number`).
2. In `fight.controller.ts`, map the DTO `damages` array to `DamageComposition[]` when instantiating `SimpleAttack`.

### Phase 4: Update test helpers and sample data

> Keep tests and samples consistent with the new signature.

1. In `test/helpers/fighting-card.ts`, replace `damageRate` with a `damages` array defaulting to `[new DamageComposition(DamageType.PHYSICAL, <rate>)]`.
2. Update `samples/cards.json`: replace each `"damageRate": N` under `simpleAttack` with `"damages": [{"type": "PHYSICAL", "rate": N}]`.
3. Update any test files that construct `SimpleAttack` directly with the old signature.

## Reviewed implementation

- [ ] Phase 1: applyFinalDamage added to FightingCard
- [ ] Phase 2: SimpleAttack uses DamageCalculator
- [ ] Phase 3: DTO and controller updated
- [ ] Phase 4: Helpers, samples, tests updated

## Validation flow

1. Run `npm run test` — all existing tests pass.
2. POST to `/fight` with the updated `samples/cards.json` payload — fight resolves without error.
3. Verify an attack against a card with a fire weakness returns higher damage than against a neutral card.
4. Verify defense buffs on the defender now correctly reduce damage (uses `actualDefense` via DamageCalculator instead of base `defense`).

## Estimations

- Confidence: 9/10
  - ✅ All affected files are identified; DamageCalculator API is stable and well-tested.
  - ✅ Change is additive — frozen handling moves to a new method, nothing is deleted.
  - ❌ Minor risk: tests that assert exact damage values will need updating since `actualDefense` (with buffs) replaces base `defense` in the damage formula.
