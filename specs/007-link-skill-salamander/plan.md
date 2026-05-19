# Implementation Plan: Kaelion Link Skill - Salamander Tears

**Branch**: `007-link-skill-salamander` | **Date**: 2026-05-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-link-skill-salamander/spec.md`

## Summary

Implement Kaelion's "Salamander Tears" link skill by building on existing classes. The approach introduces one new trigger type (`AllyHealthBelowThresholdTrigger`) and two new targeting strategies (`LastAttackerOfAllyTargetingStrategy`, `AlliedCardByIdStrategy`). The skill is composed of 3 instances of existing skill classes (`ConditionalAttack` + 2 × `AlterationSkill`), all fired by the same trigger type and grouped by `powerId`. `ActionStage` dispatches an `ally-health-<id>` event after each non-dodged hit.

## Technical Context

**Language/Version**: TypeScript on Node.js 26  
**Primary Dependencies**: NestJS 11, class-validator, class-transformer  
**Storage**: N/A (stateless in-memory simulator)  
**Testing**: Jest 29, ts-jest, supertest (e2e)  
**Target Platform**: Linux server (Heroku)  
**Project Type**: REST web service — single `POST /fight` endpoint  
**Performance Goals**: No latency regression (stateless, in-memory)  
**Constraints**: All four quality gates must pass: format → lint → test:cov → build  
**Scale/Scope**: 3 new files, 5 modified files, no new SkillKind

## Constitution Check

| Principle | Status | Notes |
| --- | --- | --- |
| I. Domain Isolation | ✅ PASS | `AllyHealthBelowThresholdTrigger` and both strategies in `core/`. Factory in `http-api/`. |
| II. Test-First Development | ✅ PASS (requirement) | Tests written before implementation — see step ordering. |
| III. Simplicity — No Over-Engineering | ✅ PASS | No new `SkillKind`, no new `Skill` interface, no new `SkillResults`. Reuses `ConditionalAttack` and `AlterationSkill` unchanged. |
| IV. Fail Fast — No Silent Errors | ✅ PASS | Factory throws on missing `activationCondition` or `targetCardId`. Trigger returns silently if ally is not found in context (card not in team). |
| V. Eliminate Duplication | ✅ PASS | `AlliedCardByIdStrategy` mirrors the existing `TargetedCard`. `activate()` added to `ConditionalAttack` is an exact copy of the existing `AlterationSkill` pattern. |

## Project Structure

### Documentation (this feature)

```text
specs/007-link-skill-salamander/
├── plan.md                ← this file
├── research.md            ← Phase 0 output
├── data-model.md          ← Phase 1 output
├── contracts/
│   └── link-skill-dto.md  ← Phase 1 output
└── tasks.md               ← Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code

```text
src/fight/core/
├── cards/@types/
│   └── fighting-context.ts              ← MODIFY: add lastAttacker?: FightingCard
├── cards/skills/
│   └── conditional-attack.ts            ← MODIFY: add activate() method
├── trigger/
│   └── ally-health-below-threshold-trigger.ts  ← CREATE
└── targeting-card-strategies/
    ├── last-attacker-of-ally.ts         ← CREATE
    └── allied-card-by-id.ts             ← CREATE

src/fight/card-action/
└── action-stage.ts                      ← MODIFY: dispatch ally-health-<id> event

src/fight/http-api/
├── targeting-strategy-factory.ts        ← MODIFY: register 2 new strategies
├── dto/
│   └── fight-data.dto.ts                ← MODIFY: new TriggerEvent + TargetingStrategy values
└── fight.controller.ts                  ← MODIFY: factory case for ally-health-below

test/fight/                              ← MODIFY: add e2e test
src/fight/core/trigger/__tests__/        ← CREATE: ally-health-below-threshold-trigger.spec.ts
src/fight/core/targeting-card-strategies/__tests__/  ← CREATE or MODIFY: specs for both new strategies
```

**Structure Decision**: Single project. New files slot into existing directories (`trigger/`, `targeting-card-strategies/`).

## Implementation Order

### Step 1 — Type-only changes (no logic)

Add `lastAttacker?: FightingCard` to `FightingContext`.  
*(No test required — type-only change)*

### Step 2 — Unit tests for `AllyHealthBelowThresholdTrigger` (RED)

Write `ally-health-below-threshold-trigger.spec.ts` covering:
- `isTriggered()` returns `false` before any `activate()` call
- `activate()` with a non-matching event ID → `isTriggered()` stays `false`
- First crossing (HP drops below threshold) → `isTriggered()` returns `true`
- Subsequent hit still below threshold (no new crossing) → `isTriggered()` returns `false`
- HP recovers above threshold → rearm: next crossing fires again
- `lastAttackerStrategy.setLastAttacker()` called with `context.lastAttacker` on crossing
- Ally not found in context → silent no-op

Tests must fail (class does not exist yet).

### Step 3 — Implement `AllyHealthBelowThresholdTrigger` (GREEN)

Create `ally-health-below-threshold-trigger.ts`. All Step 2 tests pass.

### Step 4 — Unit tests for the two new targeting strategies (RED)

`last-attacker-of-ally.spec.ts`:
- `targetedCards()` returns `[]` if `setLastAttacker(null)` was never called
- Returns `[card]` after `setLastAttacker(card)` if card is alive
- Returns `[]` if the targeted card is dead

`allied-card-by-id.spec.ts`:
- Returns `[card]` if the ally is alive in `sourcePlayer`
- Returns `[]` if the ally is dead
- Returns `[]` if the ally is absent from the team

### Step 5 — Implement the two new targeting strategies (GREEN)

Create `last-attacker-of-ally.ts` and `allied-card-by-id.ts`. All Step 4 tests pass.

### Step 6 — Minimal changes to `ConditionalAttack`

No constructor or signature change. Two additions only:

1. **Create `AlwaysTrueAttackCondition`** (new file alongside the other condition implementations):
   ```typescript
   export class AlwaysTrueAttackCondition implements AttackCondition {
     isTriggered(): boolean { return true; }
     tick(): void {}
     reset(): void {}
   }
   ```

2. **Add `activate()`** to `ConditionalAttack` (exact copy of the `AlterationSkill` pattern):
   ```typescript
   activate(triggerId: string, context: FightingContext): void {
     if ('activate' in this.trigger) {
       (this.trigger as ActivatableTrigger).activate(triggerId, context);
     }
   }
   ```

The controller factory passes `new AlwaysTrueAttackCondition()` as the condition for Salamander Tears. No existing usages or tests are affected.

### Step 7 — Wiring in `ActionStage`

In `handleAttackResult()`, after the shield-broken check and before the dead/alive branch split, add:

```typescript
if (!damageDealt.dodge) {
  const damagedCardPlayer = this.player1.ownCard(defensiveCard) ? this.player1 : this.player2;
  const attackerPlayer = damagedCardPlayer === this.player1 ? this.player2 : this.player1;
  const allyHealthContext: FightingContext = {
    sourcePlayer: damagedCardPlayer,
    opponentPlayer: attackerPlayer,
    lastAttacker: attackerCard,
  };
  damagedCardPlayer.playableCards
    .filter((c) => c !== defensiveCard)
    .forEach((caster) => {
      const results = caster.launchSkills(`ally-health-${defensiveCard.id}`, allyHealthContext);
      report.statusChanges.push(...skillResultsToSteps(caster, results));
    });
}
```

No changes to `skillResultsToSteps` — results are existing `SkillKind.Attack` and `SkillKind.Buff`.

### Step 8 — DTO + factory

**`fight-data.dto.ts`**:
- Add `ALLY_HEALTH_BELOW = 'ally-health-below'` to `TriggerEvent`
- Add `LAST_ATTACKER_OF_ALLY = 'last-attacker-of-ally'` to `TargetingStrategy`
- Add `LINKED_ALLY = 'linked-ally'` to `TargetingStrategy`
- Extend `@ValidateIf` on `targetCardId` to include `ALLY_HEALTH_BELOW`
- Require `activationCondition` when `event === ALLY_HEALTH_BELOW`

**`targeting-strategy-factory.ts`**:
- Add `LAST_ATTACKER_OF_ALLY` and `LINKED_ALLY` entries (note: these cannot be singletons — see controller note below)

**`fight.controller.ts`**:
- `CONDITIONAL_ATTACK` case: if `event === ALLY_HEALTH_BELOW`, bypass `buildTriggerForSkill()` and manually create the shared `lastAttackerStrategy` + trigger + `SimpleAttack`
- `ALTERATION` case: if `event === ALLY_HEALTH_BELOW`, create `AllyHealthBelowThresholdTrigger` (without `lastAttackerStrategy`) + `AlliedCardByIdStrategy(skillData.targetCardId)`
- Throw on missing `activationCondition` or `targetCardId` for both cases

### Step 9 — E2E test

Add a test in `test/fight/` verifying:
- Kaelion + Arionis on the same team: when Arionis drops below 30% HP, Salamander Tears steps appear immediately after that damage step in the fight log
- The attack step targets the correct last attacker (the enemy that most recently hit Arionis)
- Two buff steps appear on Arionis (`attack` and `defense`), both with the same `powerId`
- No re-trigger on subsequent hits while Arionis remains below 30%
- No Salamander Tears steps when Arionis is absent from Kaelion's team

### Step 10 — Quality gates

```bash
npm run format && npm run lint && npm run test:cov && npm run build
```

All four must be green before the branch is ready for review.

## Key Design Decisions

### `ConditionalAttack` constructor unchanged

The constructor signature `(name, attackSkill, condition, trigger)` is not modified. The controller factory passes `new AlwaysTrueAttackCondition()` as the condition for Salamander Tears. No existing usages or tests require updates.

### Shared `LastAttackerOfAllyTargetingStrategy` instance

Created in the controller factory and injected into both the trigger and the `SimpleAttack`. The trigger calls `strategy.setLastAttacker(context.lastAttacker)` on threshold crossing. The `SimpleAttack` reads it via `targetedCards()`. Minimal coupling — the strategy is the single shared state.

### Separate trigger instances per skill

Each `ConditionalAttack` / `AlterationSkill` owns its own trigger instance. The `wasAboveThreshold` and `shouldFire` state is independent per skill. All three detect the same crossing simultaneously (same Arionis HP, same threshold). This avoids the double-reset bug that would occur with a shared trigger (`launchSkills()` calls `activate()` on each skill sequentially).

### Buff duration: 5 turns

`applyBuff(type, rate, 5, undefined, powerId)`. The buff expires after 5 turns via the standard `decreaseBuffAndDebuffDuration()` mechanism. The DTO passes `duration: 5` directly to the domain — no special mapping required.

## Complexity Tracking

*No constitution violations. No complexity justification needed.*
