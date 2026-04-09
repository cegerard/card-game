# Research: Dynamic Skill Trigger

## R1: How to represent a dormant trigger

**Decision**: Create a `DynamicTrigger` class that implements `Trigger`. It starts dormant (all `isTriggered()` calls return false). When it observes the activation event, it flips to active and delegates subsequent checks to a replacement trigger.

**Rationale**: This keeps the change localized to the trigger layer. Skills don't need interface changes — they already delegate `isTriggered()` to their trigger. The `DynamicTrigger` encapsulates the state transition internally.

**Alternatives considered**:
- **Null trigger / `trigger: null`**: Would require null checks throughout every skill implementation and `launchSkills()`. Invasive.
- **Skill-level mutation with separate `activate()` method**: Requires modifying the `Skill` interface and adding orchestration code in `DeathSkillHandler` to call `activate()`. More coupling.
- **Separate `DormantTrigger` class + external activator**: Splits the activation logic across two components. Harder to reason about.

## R2: Side-effect in `isTriggered()` for activation

**Decision**: The `DynamicTrigger.isTriggered()` method has a controlled side-effect: when it detects the activation event, it flips `activated` to `true` but still returns `false` (the skill does not fire on the activation event itself — it fires on subsequent matching events).

**Rationale**: This avoids adding new methods to the `Trigger` or `Skill` interfaces. The side-effect is idempotent (once activated, subsequent calls to the activation event are no-ops). The existing call sites (`launchSkills()` in `FightingCard`) require zero changes.

**Alternatives considered**:
- **Separate `notify()` method on Trigger**: Would require `FightingCard.launchSkills()` to call both `isTriggered()` and `notify()`, changing the calling contract for all triggers. Invasive.
- **Observer pattern with DeathSkillHandler calling `trigger.activate()`**: Requires DeathSkillHandler to know about trigger internals. Breaks encapsulation.

## R3: Enemy death event type

**Decision**: Create an `EnemyDeath` trigger class (mirrors `AllyDeath`) matching `enemy-death:<cardId>`. Extend `DeathSkillHandler.notifyDeath()` to also fire `enemy-death:<deadCard.id>` on the **opponent's** surviving cards.

**Rationale**: The user's use case requires a card to react when an enemy dies. The existing system only notifies the dead card's own team (`ally-death`). Adding `enemy-death` is symmetric, backward-compatible (no existing skills use it), and follows the established pattern.

**Alternatives considered**:
- **Reuse `ally-death` with cross-team routing**: Confusing semantics — "ally-death" firing on the opponent team is misleading.
- **Generic `card-death` event on all cards**: Would fire on every card in both teams, requiring skills to filter by team. More complex, violates YAGNI since we only need opponent-side notification.

## R4: DTO representation for dormant skills

**Decision**: Add a new `TriggerEvent.DORMANT` enum value. When `event: 'dormant'`, the skill requires two additional fields:
- `activationEvent`: the trigger event that activates the skill (e.g., `'ally-death'`)
- `activationTargetCardId`: the card ID for the activation event
- `replacementEvent`: the trigger event to use after activation (e.g., `'enemy-death'`)
- `replacementTargetCardId`: the card ID for the replacement trigger

**Rationale**: Keeps the DTO flat and explicit. The factory function constructs the `DynamicTrigger` from these fields.

**Alternatives considered**:
- **Nested DTO object for trigger change rule**: Adds complexity with nested validation. The flat approach is simpler and consistent with how other optional fields (buffType, duration, etc.) are handled on `OtherSkillDto`.
- **Separate DTO class**: Over-engineering for 4 fields.

## R5: Integration with existing death handling flow

**Decision**: Modify `DeathSkillHandler.notifyDeath()` to add a second loop over the opponent's playable cards, firing `enemy-death:<deadCard.id>` triggers. Reuse existing step-conversion logic.

**Rationale**: Minimal change. The step conversion code for healing/buff/debuff/targeting-override already exists in `notifyDeath()`. Extracting the step-conversion into a shared helper avoids duplicating the switch logic.

**Alternatives considered**:
- **New subscriber for enemy-death**: Would add a second subscriber class with duplicated step-conversion logic. Violates DRY.
- **Separate method in DeathSkillHandler**: Possible but unnecessary separation for a single additional loop.
