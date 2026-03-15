# Instruction: On Ally Death Trigger with Unique Card ID

## Feature

- **Summary**: Add a unique identifier to fighting cards and implement a new skill trigger that activates when a specific ally dies, enabling death-reactive abilities
- **Stack**: `NestJS 10`, `TypeScript (ES2021)`, `Jest 29`, `class-validator 0.14`
- **Branch name**: `feat/on-ally-death-trigger`

## Existing files

- @src/fight/core/cards/fighting-card.ts
- @src/fight/core/cards/@types/card-info.ts
- @src/fight/core/trigger/trigger.ts
- @src/fight/core/trigger/turn-end.ts
- @src/fight/core/fight-simulator/card-death-subscriber.ts
- @src/fight/core/fight-simulator/fight.ts
- @src/fight/core/fight-simulator/turn-manager.ts
- @src/fight/core/card-action/action_stage.ts
- @src/fight/core/cards/skills/skill.ts
- @src/fight/core/player.ts
- @src/fight/http-api/dto/fight-data.dto.ts
- @src/fight/http-api/trigger-factory.ts
- @src/fight/http-api/fight.controller.ts
- @test/helpers/fighting-card.ts

### New files to create

- src/fight/core/trigger/ally-death.ts
- src/fight/core/fight-simulator/death-skill-handler.ts

## Implementation phases

### Phase 1: Add unique ID to FightingCard

> Cards need a stable unique identifier independent of player/position

1. Add `id: string` field to `FightingCard` constructor
2. Update `CardInfo` type to include `id`
3. Update `identityInfo` getter to expose `id`
4. Add `id` field to `FightingCardDto` with `@IsString()` validation
5. Pass `id` from DTO to `FightingCard` in controller
6. Update `createFightingCard` test helper with `id` parameter (default to faker uuid)

### Phase 2: Ally Death Trigger

> New trigger type that matches on `ally-death:<cardId>` pattern

1. Create `AllyDeath` trigger class implementing `Trigger` interface
   - Constructor takes `targetCardId: string` (the ally whose death activates this trigger)
   - `id` = `'ally-death'`
   - `isTriggered(triggerId)` matches `ally-death:<targetCardId>`
2. Add `ALLY_DEATH = 'ally-death'` to `TriggerEvent` enum in DTO
3. Add `targetCardId?: string` field to `OtherSkillDto` (required when event is `ALLY_DEATH`)
4. Update `buildTriggerStrategy` factory to handle `ALLY_DEATH` with `targetCardId` parameter
5. Update controller `createOtherSkill` to pass `targetCardId` to trigger factory

### Phase 3: Death Skill Handler

> Subscriber that triggers skills on surviving allies when a card dies

1. Create `DeathSkillHandler` class implementing `CardDeathSubscriber`
   - `notifyDeath(player, deadCard)`: iterate surviving allies, call `card.launchSkill('ally-death:<deadCardId>', context)`
   - Accumulate resulting `Step[]` internally
   - `drainSteps(): Step[]` returns and clears accumulated steps
2. Register `DeathSkillHandler` in `Fight` constructor's `eventBroker.onCardDeath`
3. Expose handler on eventBroker so `ActionStage` and `TurnManager` can drain steps after each death notification
4. In `ActionStage.handleAttackResult()`: after `notifyDeath`, drain and append death-triggered steps
5. In `TurnManager.processCardEffectStates()`: after `notifyDeath`, drain and append death-triggered steps

### Phase 4: Tests

> Validate the full feature end-to-end

1. Unit test `AllyDeath` trigger: matches correct `ally-death:<id>` string, rejects others
2. Unit test `DeathSkillHandler`: triggers skills on surviving allies, accumulates steps, drains correctly
3. Integration test: card with ally-death-triggered healing skill activates when the target ally dies
4. Integration test: card with ally-death-triggered buff skill activates on ally death
5. Update existing tests that create `FightingCard` to include `id` field

## Reviewed implementation

- [ ] Phase 1: Add unique ID to FightingCard
- [ ] Phase 2: Ally Death Trigger
- [ ] Phase 3: Death Skill Handler
- [ ] Phase 4: Tests

## Validation flow

1. Create two cards on same team: card A (id: "warrior-01") and card B with a healing skill triggered by `ally-death` targeting "warrior-01"
2. Create an enemy card strong enough to kill card A
3. Simulate fight via POST /fight
4. Verify fight result contains: card A dies -> card B's healing skill activates immediately after

## Estimations

- Confidence: 9/10
  - The trigger system is extensible by design (string-based matching)
  - `CardDeathSubscriber` pattern already exists for death events
  - Pattern follows existing `AllyPresenceCondition` for card identification
  - Risk: step drainage in ActionStage/TurnManager requires careful ordering to avoid missing or duplicating steps
- Time to implement: ~2h
