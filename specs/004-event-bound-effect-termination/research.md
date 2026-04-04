# Research: Event-Bound Effect Termination

**Date**: 2026-04-03
**Feature**: 004-event-bound-effect-termination

## Research Tasks

### 1. How does the existing EndEventProcessor work?

**Finding**: `EndEventProcessor.processEndEvent(eventName, source, players, powerId?)` iterates all living cards across both players, calls `card.removeEventBoundBuffs(eventName)` on each, collects removed buffs, also calls `card.restoreAttackTargeting(eventName)` for targeting override cleanup, and returns an array of Steps (`BuffRemoved`, `TargetingReverted`).

**Decision**: Extend this same method to also call a new `card.removeEventBoundEffects(eventName)` in the same loop, and append `EffectRemoved` steps to the result.

**Rationale**: Single processing point; no new orchestration needed; consistent with existing pattern.

### 2. How are CardState constructors called?

**Finding**: Each `AttackEffect.applyEffect()` creates a `CardState` instance:
- `new CardStatePoisoned(level, duration, damageValue)` 
- `new CardStateBurned(level, duration, damageValue)`
- `new CardStateFrozen(level, duration, damageRate)`

The `AttackEffect` instances themselves are created in the controller from EffectDto, using `new AttackPoisonedEffect(rate, level, triggeredDebuff?)`.

**Decision**: Add optional `terminationEvent` parameter to both `AttackEffect` constructors and `CardState` constructors. The chain: DTO → AttackEffect → CardState.

**Alternatives considered**: Storing terminationEvent only on AttackEffect and checking at removal time — rejected because the CardState is the persisted state on the card; AttackEffect is transient (used only during attack resolution).

### 3. How does FightingCard store and clear status effects?

**Finding**: `FightingCard` has three private fields: `poisoned?: CardState`, `burned?: CardState`, `frozen?: CardState`. The `setState(state)` method sets the appropriate field based on `state.type`. Effects are cleared by setting the field to `undefined` when `remainingTurns` reaches 0 in `applyStateEffects()`.

**Decision**: `removeEventBoundEffects(eventName)` will check each of the three fields. If the field is defined and its `terminationEvent === eventName`, set it to `undefined` and add it to the removed list. Return the list.

**Rationale**: Direct and simple — three field checks, no iteration needed.

### 4. What step kinds exist and how are they structured?

**Finding**: `StepKind` enum in `step.ts` has: `Attack`, `SpecialAttack`, `Healing`, `StatusChange`, `StateEffect`, `Buff`, `Debuff`, `BuffRemoved`, `TargetingOverride`, `TargetingReverted`, `Winner`, `FightEnd`.

**Decision**: Add `EffectRemoved = 'effect_removed'` to the enum. Create `EffectRemovedReport` interface mirroring `BuffRemovedReport` structure.

## Summary

No NEEDS CLARIFICATION items. All technical questions resolved. The implementation follows existing patterns closely — extending EndEventProcessor and CardState rather than introducing new mechanisms.
