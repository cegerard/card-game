# Research: Event-Bound Buff Termination

**Branch**: `002-event-bound-buff` | **Phase**: 0

## Findings

### Decision 1: Buff Termination Event Representation

**Decision**: Extend `Buff` type with optional `terminationEvent?: string`. Use `Infinity` as the `duration` value for buffs with no turn-based expiry.

**Rationale**: Minimal change to the existing `Buff` value object. `Infinity` integrates with the existing `duration > 0` filter in `decreaseBuffAndDebuffDuration()` — a buff with `duration === Infinity` decremented by 1 remains `Infinity`, so no special-casing is needed during duration decrease. The optional field keeps backward compatibility with all existing duration-only buffs.

**Alternatives considered**:
- Add a separate `duration: number | null` field: rejected — overloading `null` meaning is less explicit than `Infinity` math
- Separate `EventBoundBuff` type: rejected — over-engineering; one discriminated type is sufficient for current requirements

---

### Decision 2: Skill Lifecycle Tracking (activation limit + end event)

**Decision**: Extend `BuffSkill` directly with optional `activationLimit?: number`, a private runtime `activationCount = 0`, and `endEvent?: string`. Return `endEvent` in `SkillResults` when the limit is reached.

**Rationale**: The activation lifecycle is specific to `BuffSkill` (the only skill kind requiring a named end event per the spec). Extending the existing class avoids creating new abstractions. `SkillResults` already returns rich data; adding an optional `endEvent?: string` field signals lifecycle completion without a new event-bus layer.

**Alternatives considered**:
- A `LifecycleSkill` wrapper/decorator: rejected — unnecessary indirection; YAGNI
- A separate `SkillEndEventSubscriber` interface: rejected — event propagation inline in `TurnManager` is simpler and keeps the pattern consistent with `DeathSkillHandler`'s step accumulation model

---

### Decision 3: End Event Propagation and Buff Removal

**Decision**: Introduce a single `EndEventProcessor` class (in `src/fight/core/fight-simulator/end-event-processor.ts`) that holds references to `player1` and `player2`, and exposes `processEndEvent(eventName, sourceCardInfo): Step[]`. Both `TurnManager` and `DeathSkillHandler` call it when an end event fires.

**Rationale**: The removal logic (iterate all cards in both players, call `card.removeEventBoundBuffs(eventName)`, produce `StepKind.BuffRemoved` steps) is identical whether triggered by skill lifecycle or card death. Centralising it avoids duplication (Constitution Principle V). The class follows the same structural pattern as `DeathSkillHandler`.

**Alternatives considered**:
- Inline removal in `TurnManager` and duplicate in `DeathSkillHandler`: rejected — violates no-duplication rule
- Full event-bus with subscriber registration: rejected — over-engineering for two call sites

---

### Decision 4: Buff Removal Step Kind

**Decision**: Add `StepKind.BuffRemoved = 'buff_removed'` and a new `BuffRemovedReport` type with fields `{ source: CardInfo; eventName: string; removed: { target: CardInfo; kind: BuffType; value: number }[] }`.

**Rationale**: FR-006 requires buff removal to be logged. Reusing `StepKind.Buff` (which means "buff applied") would be semantically incorrect. A dedicated step kind makes the fight log unambiguous and future-proof for client display.

**Alternatives considered**:
- Reuse `StepKind.Buff` with a negative value: rejected — confusing semantics
- Add a `removed: boolean` flag to `BuffReport`: rejected — same semantic confusion

---

### Decision 5: Card Death → End Event (FR-007)

**Decision**: Extend `DeathSkillHandler.notifyDeath()` to call `card.lifecycleEndEvents(): string[]` on the dying card, then call `EndEventProcessor.processEndEvent()` for each event name and accumulate the resulting steps.

**Rationale**: `DeathSkillHandler` is already the canonical handler for "on-death side effects". Adding end event cleanup there keeps all death-triggered logic in one place. `FightingCard.lifecycleEndEvents()` returns the end event names of lifecycle-limited skills that have not yet been exhausted — exactly the events that should fire on premature death.

**Alternatives considered**:
- Hook in `ActionStage.notifyDeath()` or `TurnManager.notifyDeath()` directly: rejected — duplicates logic; `DeathSkillHandler` already provides the `drainSteps()` contract
- New `CardDeathSubscriber` implementation: possible, but `DeathSkillHandler` is simpler to extend

---

### Decision 6: Refresh Semantics for Duplicate Event-Bound Buffs (FR-010)

**Decision**: In `FightingCard.applyBuff()`, when `terminationEvent` is provided and a buff of the same `type` and `terminationEvent` already exists, replace it in-place (refresh) rather than pushing a duplicate.

**Rationale**: FR-010 is explicit about refresh over stacking for event-bound buffs. Duration-only buffs are unaffected (no `terminationEvent`) — their existing stacking behaviour is preserved.

**Alternatives considered**:
- Always replace any buff of the same type: rejected — existing duration-only buff stacking is intentional and must not regress (SC-002)

---

### Decision 7: `BuffApplication` and DTO Extensions

**Decision**: Add optional `terminationEvent?: string` to `BuffApplication` constructor and propagate it through to `FightingCard.applyBuff()`. Extend `BuffApplicationDto` and `OtherSkillDto` with the same optional field. `OtherSkillDto` also gets `activationLimit?: number` and `endEvent?: string`.

**Rationale**: The DTO→domain factory pattern (hexagonal architecture, Principle I) keeps DTO concerns in the HTTP layer. Minimal field additions with `@IsOptional()` ensure no breaking changes to existing payloads.

---

### Decision 8: `duration` encoding for event-only buffs

**Decision**: When `terminationEvent` is set and no turn duration is specified (DTO field absent or `0`), the domain maps `duration` to `Number.POSITIVE_INFINITY`.

**Rationale**: `Infinity - 1 === Infinity` in JavaScript, so the existing `map(b => ({ ...b, duration: b.duration - 1 })).filter(b => b.duration > 0)` pipeline requires zero changes for infinite-duration buffs. Clean and pragmatic.
