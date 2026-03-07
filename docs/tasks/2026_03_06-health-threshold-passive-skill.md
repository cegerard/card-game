# Instruction: Health Threshold Passive Skill

## Feature

- **Summary**: Add a passive buff skill that activates conditionally based on the card's current health percentage. Each turn where the condition is met, a new stacking buff is applied. Already applied buffs persist if the condition becomes false.
- **Stack**: `Node.js 20`, `NestJS 10`, `TypeScript 5`, `Jest 29`
- **Branch name**: `feat/health-threshold-passive-skill`

## Existing files

- @src/fight/core/cards/@types/buff/buff-condition.ts
- @src/fight/core/cards/@types/buff/conditions/ally-presence-condition.ts
- @src/fight/core/cards/@types/buff/buff-application.ts
- @src/fight/core/cards/skills/buff-skill.ts
- @src/fight/core/cards/fighting-card.ts
- @src/fight/core/fight-simulator/turn-manager.ts
- @src/fight/http-api/dto/fight-data.dto.ts
- @src/fight/http-api/buff-condition-factory.ts
- @src/fight/http-api/fight.controller.ts
- @samples/cards.json

### New files to create

- src/fight/core/cards/@types/buff/conditions/health-threshold-condition.ts
- src/fight/core/cards/@types/buff/conditions/__tests__/health-threshold-condition.spec.ts
- src/fight/core/cards/skills/__tests__/conditional-buff-skill.spec.ts

## Implementation phases

### Phase 1 — HealthThresholdCondition

> Implement the condition that evaluates the card's health ratio against a threshold.

1. Add `healthRatio` public getter on `FightingCard`: `this.actualHealth / this.maxHealth`
2. Create `HealthThresholdCondition` implementing `BuffCondition`:
   - Constructor: `threshold: number` (0–1), `operator: 'above' | 'below'` (default `'above'`)
   - `evaluate(source)`: returns `source.healthRatio > threshold` (or `<` for below)
3. Write unit tests for `HealthThresholdCondition` (above threshold true/false, below threshold true/false)

### Phase 2 — Conditional BuffSkill

> Allow a `BuffSkill` to skip execution if an optional activation condition is not met.

1. Add optional `activationCondition?: BuffCondition` as last constructor param of `BuffSkill`
2. In `BuffSkill.launch()`: if condition is set and evaluates to `false`, return `{ skillKind: SkillKind.Buff, results: [] }`
3. In `TurnManager.processCardSkill()`: only push the buff step if `buffResults.length > 0`
4. Write unit tests: buff applied when condition true, buff skipped when condition false, previously applied buffs persist

### Phase 3 — Integration (DTO, factory, example)

> Wire the new condition through the HTTP layer and add a sample card.

1. Add `HEALTH_THRESHOLD = 'health-threshold'` to `BuffConditionType` enum in `fight-data.dto.ts`
2. Add `threshold?: number` and `operator?: string` to `BuffConditionDto`
3. Add `activationCondition?: BuffConditionDto` to the buff skill DTO (without `multiplier` usage)
4. Add `HEALTH_THRESHOLD` case to `buff-condition-factory.ts` returning `new HealthThresholdCondition(threshold, operator)`
5. In `fight.controller.ts`: build and pass `activationCondition` when creating `BuffSkill`
6. Add a sample card to `samples/cards.json` demonstrating the skill

## Reviewed implementation

- [ ] Phase 1 — HealthThresholdCondition
- [ ] Phase 2 — Conditional BuffSkill
- [ ] Phase 3 — Integration

## Validation flow

1. POST `/fight` with a card having a turn-end buff skill with `activationCondition: { type: "health-threshold", threshold: 0.5 }`
2. Verify that each turn where the card's health > 50%, a new +5% attack buff appears in the step results
3. Deal damage to bring the card below 50% health and verify no new buff is added that turn
4. Verify the buffs accumulated before crossing the threshold are still active and decrement normally

## Estimations

- Confidence: 9/10
  - ✅ `BuffCondition` interface is already well-suited for reuse as an activation gate
  - ✅ `BuffSkill` and `TurnManager` require minimal, localized changes
  - ✅ `actualHealth` getter exists; only a `healthRatio` getter needs to be added
  - ❌ `BuffConditionDto` currently has `multiplier` as required — need to verify if making it optional breaks existing cards
