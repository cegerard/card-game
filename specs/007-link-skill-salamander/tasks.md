# Tasks: Kaelion Link Skill - Salamander Tears

**Input**: Design documents from `/specs/007-link-skill-salamander/`
**Branch**: `007-link-skill-salamander`
**Plan**: [plan.md](plan.md) | **Spec**: [spec.md](spec.md)

**Organization**: Tasks follow the test-first order defined in plan.md. Each user story phase is independently testable before moving to the next.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Type extension that all trigger and strategy implementations depend on.

**⚠️ CRITICAL**: Must be complete before any Phase 2+ work.

- [ ] T001 Add `lastAttacker?: FightingCard` to `FightingContext` in `src/fight/core/cards/@types/fighting-context.ts`

**Checkpoint**: Type compiles — all downstream code can reference `context.lastAttacker`.

---

## Phase 2: User Story 1 — Ally-Health Conditional Trigger (Priority: P1) 🎯 MVP

**Goal**: `AllyHealthBelowThresholdTrigger` fires once when an ally's HP crosses below a threshold, rearms on recovery, and dispatches via `ActionStage`.

**Independent Test**: Run `npm test -- ally-health-below-threshold-trigger.spec.ts` — all trigger specs green. Verify `action-stage` integration manually via an e2e payload where Arionis drops below 30% HP.

> **Write tests first (RED), implement second (GREEN)**

- [ ] T002 [US1] Write unit tests (RED) for `AllyHealthBelowThresholdTrigger` covering: `isTriggered()` before any activate, non-matching event ID no-op, first crossing fires, subsequent below-threshold no re-fire, rearm on recovery, `setLastAttacker()` called on crossing, ally absent silent no-op — in `src/fight/core/trigger/__tests__/ally-health-below-threshold-trigger.spec.ts`
- [ ] T003 [US1] Implement `AllyHealthBelowThresholdTrigger` (implements `ActivatableTrigger`) with `monitoredAllyId`, `threshold`, optional `lastAttackerStrategy`, private `wasAboveThreshold`/`shouldFire` state — in `src/fight/core/trigger/ally-health-below-threshold-trigger.ts`
- [ ] T004 [US1] Dispatch `ally-health-<id>` events to teammates after each non-dodged hit in `handleAttackResult()` in `src/fight/card-action/action-stage.ts`
- [ ] T005 [US1] Add `ALLY_HEALTH_BELOW = 'ally-health-below'` to `TriggerEvent` enum, extend `@ValidateIf` on `targetCardId` and `activationCondition` to include `ALLY_HEALTH_BELOW` — in `src/fight/http-api/dto/fight-data.dto.ts`

**Checkpoint**: Trigger unit tests pass. `ActionStage` dispatches the event; skills with a matching trigger can `activate()`.

---

## Phase 3: User Story 2 — Massive Explosion (Priority: P2)

**Goal**: When Salamander Tears triggers, Kaelion fires 200% fire damage at Arionis' last attacker via `ConditionalAttack` + `LastAttackerOfAllyTargetingStrategy`.

**Independent Test**: Run `npm test -- last-attacker-of-ally.spec.ts` — all strategy specs green. Send a fight payload with a `CONDITIONAL_ATTACK` + `ally-health-below` skill and verify the attack step appears in the fight log targeting the correct enemy.

> **Write tests first (RED), implement second (GREEN)**

- [ ] T006 [US2] Write unit tests (RED) for `LastAttackerOfAllyTargetingStrategy` covering: returns `[]` before `setLastAttacker()`, returns `[card]` after `setLastAttacker(card)` if alive, returns `[]` if card is dead — in `src/fight/core/targeting-card-strategies/__tests__/last-attacker-of-ally.spec.ts`
- [ ] T007 [P] [US2] Create `AlwaysTrueAttackCondition` implementing `AttackCondition` with `isTriggered(): true`, no-op `tick()` and `reset()` — in `src/fight/core/cards/@types/attack/conditions/always-true-attack-condition.ts`
- [ ] T008 [P] [US2] Add `activate(triggerId, context)` method to `ConditionalAttack` delegating to `(this.trigger as ActivatableTrigger).activate()` when trigger implements `ActivatableTrigger` — in `src/fight/core/cards/skills/conditional-attack.ts`
- [ ] T009 [US2] Implement `LastAttackerOfAllyTargetingStrategy` with `setLastAttacker(card)` and `targetedCards()` returning `[lastAttacker]` if alive — in `src/fight/core/targeting-card-strategies/last-attacker-of-ally.ts`
- [ ] T010 [P] [US2] Add `LAST_ATTACKER_OF_ALLY = 'last-attacker-of-ally'` to `TargetingStrategy` enum in `src/fight/http-api/dto/fight-data.dto.ts`
- [ ] T011 [P] [US2] Register `LastAttackerOfAllyTargetingStrategy` in `src/fight/http-api/targeting-strategy-factory.ts`
- [ ] T012 [US2] Wire `CONDITIONAL_ATTACK` + `ALLY_HEALTH_BELOW` case in `fight.controller.ts`: create shared `LastAttackerOfAllyTargetingStrategy`, create `AllyHealthBelowThresholdTrigger(targetCardId, threshold, sharedStrategy)`, create `SimpleAttack` using shared strategy, pass `AlwaysTrueAttackCondition`; throw on missing `activationCondition` or `targetCardId` — in `src/fight/http-api/fight.controller.ts`

**Checkpoint**: Explosion unit tests pass. Fight log includes an `attack` step with `powerId: "salamander-tears"` targeting the last attacker when threshold is crossed.

---

## Phase 4: User Story 3 — Power Transfer (Priority: P3)

**Goal**: When Salamander Tears triggers, Arionis receives +10% attack and +20% defense buffs for 5 turns via `AlterationSkill` + `AlliedCardByIdStrategy`.

**Independent Test**: Run `npm test -- allied-card-by-id.spec.ts` — all strategy specs green. Send a fight payload with both `ALTERATION` + `ally-health-below` skills and verify two `buff` steps appear in the fight log on Arionis, both with `powerId: "salamander-tears"`.

> **Write tests first (RED), implement second (GREEN)**

- [ ] T013 [US3] Write unit tests (RED) for `AlliedCardByIdStrategy` covering: returns `[card]` if ally is alive in `sourcePlayer`, returns `[]` if ally is dead, returns `[]` if ally is absent from team — in `src/fight/core/targeting-card-strategies/__tests__/allied-card-by-id.spec.ts`
- [ ] T014 [US3] Implement `AlliedCardByIdStrategy` searching `sourcePlayer.allCards` by `allyId`, returning `[]` if absent or dead — in `src/fight/core/targeting-card-strategies/allied-card-by-id.ts`
- [ ] T015 [P] [US3] Add `LINKED_ALLY = 'linked-ally'` to `TargetingStrategy` enum in `src/fight/http-api/dto/fight-data.dto.ts`
- [ ] T016 [P] [US3] Register `AlliedCardByIdStrategy` in `src/fight/http-api/targeting-strategy-factory.ts`
- [ ] T017 [US3] Wire `ALTERATION` + `ALLY_HEALTH_BELOW` case in `fight.controller.ts`: create `AllyHealthBelowThresholdTrigger(targetCardId, threshold)` (no shared strategy), use `AlliedCardByIdStrategy(targetCardId)`; throw on missing `activationCondition` or `targetCardId` — in `src/fight/http-api/fight.controller.ts`

**Checkpoint**: Buff unit tests pass. Fight log includes two `buff` steps on Arionis with `remainingTurns: 5` and `powerId: "salamander-tears"` immediately after the threshold crossing.

---

## Phase 5: Polish & Integration

**Purpose**: End-to-end validation and all four quality gates.

- [ ] T018 Write e2e test covering: threshold crossing emits attack + two buff steps in order with same `powerId`; correct last-attacker targeting; no re-trigger while below threshold; no steps when Arionis absent from team — in `test/fight/salamander-tears.e2e-spec.ts`
- [ ] T019 Run quality gates in order: `npm run format && npm run lint && npm run test:cov && npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on Phase 1 — blocks US2 and US3
- **US2 (Phase 3)**: Depends on Phase 2 (trigger must exist to wire the controller)
- **US3 (Phase 4)**: Depends on Phase 2 (trigger must exist); independent from US2
- **Polish (Phase 5)**: Depends on US1 + US2 + US3 all complete

### Within Phase 3 (US2)

```
T006 (write tests)    ──────────────────────► T009 (implement) ──► T010 ──►
T007 (AlwaysTrueCond) ─► T008 (activate())                        T011 ──► T012
```

T007 and T008 can run in parallel with T006 (different files, no shared dependency).  
T010 and T011 can run in parallel with each other after T009 (different files).

### Within Phase 4 (US3)

```
T013 (write tests) ──► T014 (implement) ──► T015 ──►
                                            T016 ──► T017
```

T015 and T016 can run in parallel with each other after T014.

### Parallel Execution Examples

```bash
# Phase 3 — Step 1: tests + condition class + activate() method (all independent files)
Task T006: "Write unit tests for LastAttackerOfAllyTargetingStrategy"
Task T007: "Create AlwaysTrueAttackCondition"
Task T008: "Add activate() to ConditionalAttack"

# Phase 3 — Step 2: enum + factory registration (after T009)
Task T010: "Add LAST_ATTACKER_OF_ALLY to TargetingStrategy enum"
Task T011: "Register LastAttackerOfAllyTargetingStrategy in factory"

# Phase 4 — Step 2: enum + factory registration (after T014)
Task T015: "Add LINKED_ALLY to TargetingStrategy enum"
Task T016: "Register AlliedCardByIdStrategy in factory"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Foundational)
2. Complete Phase 2 (US1): trigger + ActionStage dispatch + DTO enum
3. **Stop and validate**: trigger unit tests green, ActionStage compiles
4. Proceed to US2 and US3

### Incremental Delivery

1. Phase 1 → Phase 2: Trigger works, event dispatched — core mechanism proven
2. Phase 3: Explosion works — fight log contains attack step with correct target
3. Phase 4: Buffs work — complete fight log with all 3 steps under same `powerId`
4. Phase 5: E2E green, all quality gates pass — branch ready for review

---

## Notes

- [P] tasks touch different files with no incomplete dependencies — safe to run simultaneously
- All test tasks must be written **and confirmed failing** before implementation begins (TDD red-green cycle)
- T007 and T008 are both [P] within Phase 3: they can be done in parallel with T006 since none share a file
- T012 and T017 both modify `fight.controller.ts` — they are in separate phases and must be sequential
- T010/T015 both modify `fight-data.dto.ts` — they are in separate phases and must be sequential
