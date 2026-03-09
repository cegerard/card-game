# Instruction: Conditional Attack Skill

## Feature

- **Summary**: Add a new `ConditionalAttack` skill that fires in place of the simple attack when a condition is met (e.g., every N turns). The condition tracks internal state per card action.
- **Stack**: `TypeScript`, `NestJS`, `Jest`
- **Branch name**: `feat/conditional-attack`

## Existing files

- @src/fight/core/cards/skills/simple-attack.ts
- @src/fight/core/cards/fighting-card.ts
- @src/fight/core/card-action/action_stage.ts
- @src/fight/http-api/dto/fight-data.dto.ts
- @src/fight/http-api/fight.controller.ts

### New files to create

- `src/fight/core/cards/skills/conditional-attack.ts`
- `src/fight/core/cards/@types/attack/attack-condition.ts`
- `src/fight/core/cards/@types/attack/conditions/every-n-turns-condition.ts`
- `src/fight/core/cards/skills/__tests__/conditional-attack.spec.ts`

## Implementation phases

### Phase 1: Core domain — AttackCondition + ConditionalAttack

> Model the condition abstraction and the new attack skill.

1. Create `AttackCondition` interface: `isTriggered(): boolean`, `tick(): void`, `reset(): void`
2. Create `EveryNTurnsCondition` implementing `AttackCondition`: increments internal counter on `tick()`, `isTriggered()` returns `true` when counter reaches N, `reset()` sets counter to 0
3. Create `ConditionalAttack` class implements `Skill` interface: holds a `SimpleAttack` (reuses logic) + `AttackCondition`; exposes `isTriggered()`, `launch()` (delegates to SimpleAttack + calls `reset()`), `tick()`

### Phase 2: Action flow integration

> Plug ConditionalAttack into the existing Skill/trigger mechanism.

1. Add `NEXT_ACTION = 'next-action'` to `TriggerEvent` enum in `fight-data.dto.ts`
2. Add optional `tick?(): void` to the `Skill` interface; `FightingCard` adds `tickSkills()` that calls `tick()` on any skill that exposes it
3. Extend `SkillKind` with `Attack = 'attack'` and `SkillResults.results` to include `AttackResult[]` so `ConditionalAttack.launch()` can return attack results within the existing `Skill` contract
4. In `ActionStage.computeNextAction`: after frozen check, call `card.tickSkills()`; then priority: special → `launchSkill('next-action')` if result (handle as `StepKind.Attack`) → simple attack

### Phase 3: HTTP API

> Expose conditional attacks via DTO and wire them in the controller.

1. Add `ConditionalAttackDto` to `fight-data.dto.ts`: same fields as `SimpleAttackDto` (name, damages, targetingStrategy, optional effect) plus `interval: number`
2. Add optional `conditionalAttacks: ConditionalAttackDto[]` to `SkillsDto`
3. In `fight.controller.ts`, convert each `ConditionalAttackDto` to a `ConditionalAttack` domain object and push into the `others` skills array passed to `FightingCard`

### Phase 4: Tests

> Cover condition logic and the full action flow.

1. Unit test `EveryNTurnsCondition`: not ready before N ticks, ready at N, resets after `reset()`
2. Unit test `ConditionalAttack`: delegates damage to underlying attack, resets condition after launch; `tick()` forwards to condition
3. Unit test `FightingCard.tickSkills()`: only calls `tick()` on skills that expose it
4. Integration test in `ActionStage`: conditional attack fires on the Nth turn (step kind `attack`), simple attack fires on other turns; frozen card skips tick

## Reviewed implementation

- [ ] Phase 1: Core domain
- [ ] Phase 2: Action flow
- [ ] Phase 3: HTTP API
- [ ] Phase 4: Tests

## Validation flow

1. POST `/fight` with a card having a `conditionalAttacks` entry with `interval: 3`
2. Observe fight steps: all turns show `attack` kind — turns 1 and 2 are simple attacks, turn 3 is the conditional attack (same step kind)
3. Pattern repeats every 3 turns
4. Verify a frozen card does not tick nor trigger the conditional attack
5. Verify special attack takes priority over conditional attack when both are ready

## Estimations

- Confidence: 9/10
  - ✅ Clear separation: condition is self-contained, no change to existing Special/SimpleAttack logic
  - ✅ Reuses `SimpleAttack` for damage computation, minimal new code
  - ✅ DTO pattern is well established in codebase
  - ✅ No `StepKind` changes — conditional attack reuses `attack` step kind
  - ❌ `Skill` interface contract extended (optional `tick?`, `SkillKind.Attack`, `SkillResults` union) — small but touches existing implementations and ActionStage result handling
