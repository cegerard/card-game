# Instruction: Buff Condition System

## Feature

- **Summary**: Add a generic condition system to `BuffApplication` that allows buff rates to be multiplied when a runtime condition is met. First implementation: `AllyPresenceCondition`, which multiplies a buff's rate if a named ally is alive in the source player's team.
- **Stack**: `Node.js`, `NestJS`, `TypeScript`, `Jest`
- **Branch name**: `feat/buff-condition-system`

## Existing files

- @src/fight/core/cards/@types/buff/buff-application.ts
- @src/fight/core/cards/@types/buff/type.ts
- @src/fight/core/cards/@types/fighting-context.ts
- @src/fight/core/player.ts
- @src/fight/http-api/dto/fight-data.dto.ts
- @src/fight/http-api/fight.controller.ts
- @src/fight/http-api/targeting-strategy-factory.ts
- @samples/cards.json

### New files to create

- src/fight/core/cards/@types/buff/buff-condition.ts
- src/fight/core/cards/@types/buff/conditions/ally-presence-condition.ts
- src/fight/http-api/buff-condition-factory.ts
- src/fight/core/cards/@types/buff/__tests__/buff-application-with-condition.spec.ts
- src/fight/core/cards/@types/buff/conditions/__tests__/ally-presence-condition.spec.ts

## Implementation phases

### Phase 1 - Domain: Condition interface and BuffApplication

> Introduce a generic `BuffCondition` interface and wire it into `BuffApplication`

1. Create `BuffCondition` interface with `id: string` and `evaluate(source: FightingCard, context: FightingContext): boolean`
2. Add optional `condition?: BuffCondition` and `conditionMultiplier?: number` to `BuffApplication` constructor
3. In `BuffApplication.applyBuff()`, compute effective rate: `condition?.evaluate(source, context) ? rate * conditionMultiplier : rate`
4. Implement `AllyPresenceCondition` — checks that a card with a given `name` exists in `context.sourcePlayer.playableCards`

### Phase 2 - API: DTO and factory

> Expose the condition configuration through the HTTP layer

1. Add `BuffConditionType` enum with value `ALLY_PRESENCE = 'ally-presence'`
2. Add `BuffConditionDto` class with `type: BuffConditionType`, `allyName?: string`, `multiplier: number`
3. Add optional `@ValidateNested() condition?: BuffConditionDto` to `BuffApplicationDto`
4. Create `buff-condition-factory.ts` mapping `BuffConditionType` → `BuffCondition` instance
5. Update `fight.controller.ts` to pass instantiated `BuffCondition` when building `BuffApplication`

### Phase 3 - Tests

> Cover all condition evaluation paths

1. Unit test `AllyPresenceCondition`: ally alive → `true`, ally dead/absent → `false`
2. Unit test `BuffApplication.applyBuff()` with condition: evaluates to true → multiplied rate, evaluates to false → base rate, no condition → base rate

## Reviewed implementation

- [x] Phase 1 - Domain: Condition interface and BuffApplication
- [x] Phase 2 - API: DTO and factory
- [x] Phase 3 - Tests

## Validation flow

1. Update `samples/cards.json` — add `condition: { type: "ally-presence", allyName: "Kaelion", multiplier: 2 }` to Arionis's buff
2. Run the fight simulation with Arionis + Kaelion in team → confirm buff value is doubled in the response steps
3. Run the fight simulation with Arionis alone → confirm buff value is unchanged
4. Run `npm run test` → all tests pass

## Estimations

- Confidence: 9/10
  - ✅ `FightingContext` already exposes `sourcePlayer.playableCards` — condition evaluation requires no new data plumbing
  - ✅ `BuffApplication.applyBuff()` already receives `source` and `context` — minimal surface to touch
  - ✅ Pattern is consistent with existing Strategy pattern used throughout (Trigger, TargetingStrategy)
  - ❌ DTO validation with nested optional objects using `class-validator` can have edge cases to watch
