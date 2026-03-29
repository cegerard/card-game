# Research: Composite Power

**Feature**: 003-composite-power | **Date**: 2026-03-29

## R-001: How to make all grouped skills fire on the same trigger

**Decision**: Change `FightingCard.launchSkill()` from `find()` (first match) to `filter()` (all matches), returning `SkillResults[]` instead of `SkillResults | null`.

**Rationale**: The current implementation at `fighting-card.ts:233` uses `this.skills.find((s) => s.isTriggered(trigger))` which only returns the first matching skill. Composite powers require ALL skills sharing the same trigger to fire simultaneously. Returning an array is the minimal change that supports both single and grouped skills.

**Alternatives considered**:
- Wrapper "CompositeSkill" class that internally delegates to children: rejected because it adds a new abstraction layer and doesn't align with the spec's "group by identifier" approach.
- Separate launch method for grouped skills: rejected because it would duplicate trigger matching logic.

**Impact**: Callers of `launchSkill()` — `TurnManager.processCardSkill()` and `ActionStage.launchNextActionSkills()` — must iterate the array. Existing behavior preserved: a single-element array for non-grouped skills, empty array for no match.

## R-002: How to implement targeting strategy override

**Decision**: Add `overrideAttackTargeting(strategy, terminationEvent)` and `restoreAttackTargeting(eventName)` methods to `FightingCard`. The card stores the original targeting strategy and swaps the active one.

**Rationale**: `SimpleAttack.targetingStrategy` is private and immutable (constructor-injected). Modifying `SimpleAttack` would break encapsulation. Instead, `FightingCard` — which already owns the `simpleAttack` instance — manages the override at a higher level. The card stores a stack of `{strategy, terminationEvent}` overrides and delegates to the most recent active override's strategy.

**Alternatives considered**:
- Making `SimpleAttack.targetingStrategy` mutable with a setter: rejected because it breaks the immutable value object pattern used by all attack skills.
- Creating a `TargetingStrategyProxy` that wraps the real strategy: viable but adds indirection without clear benefit over the card-level approach.

**Design detail**: `FightingCard` gets:
- `private targetingOverrides: { strategy: TargetingCardStrategy, terminationEvent: string }[]`
- `overrideAttackTargeting(strategy, terminationEvent)`: pushes override
- `restoreAttackTargeting(eventName)`: removes overrides matching the event
- `launchAttack()`: if overrides exist, uses the last override's strategy; otherwise uses the simpleAttack's built-in strategy

This requires `SimpleAttack` to expose a method that accepts an external targeting strategy (or the card passes targeted cards directly). Simplest approach: add a `launchWithTargeting(card, context, targetingStrategy)` method to `SimpleAttack`.

## R-003: How to propagate powerId through the system

**Decision**: Thread `powerId` as an optional string through: `OtherSkillDto` → domain `Skill` constructor → `SkillResults` → step report types.

**Rationale**: The powerId is a pass-through identifier with no domain logic attached. It exists purely for grouping in reports. Keeping it optional ensures backwards compatibility.

**Flow**:
1. `OtherSkillDto.powerId?: string` — API input
2. `AlterationSkill`, `Healing`, `TargetingOverride` constructors accept optional `powerId`
3. `SkillResults.powerId?: string` — returned from `skill.launch()`
4. `TurnManager` / `ActionStage` propagate `powerId` into `BuffReport`, `HealingReport`, `DebuffReport`, `TargetingOverrideReport`
5. `EndEventProcessor` propagates `powerId` into `BuffRemovedReport` and `TargetingRevertedReport`

## R-004: How to validate powerId consistency in the API

**Decision**: Post-construction validation in `FightController` after all skills for a card are created from DTOs.

**Rationale**: Validation requires cross-skill comparison (all skills with same powerId must share trigger and terminationEvent). This can only be done after all skills are parsed. Controller-level validation aligns with the "validate at boundaries" principle.

**Implementation**: Group `OtherSkillDto[]` by `powerId`. For each group, assert all have the same `event` and `terminationEvent`. Throw `BadRequestException` on mismatch.

## R-005: How EndEventProcessor handles targeting override cleanup

**Decision**: Extend `EndEventProcessor.processEndEvent()` to also call `card.restoreAttackTargeting(eventName)` on all playable cards, emitting a `TargetingReverted` step if any overrides were removed.

**Rationale**: The existing `EndEventProcessor` already iterates all playable cards to remove event-bound buffs. Adding targeting override restoration to the same pass is natural and ensures atomicity.

**Alternatives considered**:
- Separate processor for targeting overrides: rejected because it would duplicate the "iterate all cards for event" pattern.
