# Feature Specification: Event-Bound Effect Termination

**Feature Branch**: `004-event-bound-effect-termination`  
**Created**: 2026-04-03  
**Status**: Draft  
**Input**: User description: "Ajoute une condition d'arret aux effets. Par exemple je veux pouvoir être en mesure de stopper un effet de brulure lorsqu'un événement particulier est émis."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove a status effect when a named event fires (Priority: P1)

As a game designer configuring a battle, I want to attach a termination event name to a status effect (poison, burn, or freeze) so that when that event is emitted during the fight, the effect is automatically removed from the affected card. This enables rich combat interactions such as a healer skill that "cleanses" burn from allies when it activates, or a burn that only persists while a specific buff skill is active.

**Why this priority**: This is the core mechanic — without event-bound termination on effects, the entire feature has no value.

**Independent Test**: Can be fully tested by configuring a card with a burn effect that has a termination event, triggering that event via a skill lifecycle, and verifying the burn is removed from the card.

**Acceptance Scenarios**:

1. **Given** a card has a burn effect with `terminationEvent: "fire-shield-end"`, **When** the event `"fire-shield-end"` is fired, **Then** the burn effect is removed from the card and a step is emitted in the fight log recording the removal.
2. **Given** a card has a poison effect with `terminationEvent: "cleanse"`, **When** the event `"cleanse"` is fired, **Then** the poison effect is removed and the card no longer takes poison damage on subsequent turns.
3. **Given** a card has a freeze effect with no termination event, **When** any event is fired, **Then** the freeze effect continues to apply normally (backwards compatibility).

---

### User Story 2 - Attach termination event to effects via the API (Priority: P1)

As a developer integrating with the battle API, I want to specify an optional `terminationEvent` field on an effect definition in the fight request payload so that the simulator knows which event should remove that effect.

**Why this priority**: Without API support, the feature cannot be used by consumers. Equal priority to the core mechanic.

**Independent Test**: Can be tested by sending a POST /fight request with a status effect that includes a `terminationEvent` field and verifying the request is accepted and the effect behaves accordingly.

**Acceptance Scenarios**:

1. **Given** a fight request with an effect containing `terminationEvent: "heal-wave"`, **When** the request is validated, **Then** it is accepted without error.
2. **Given** a fight request with an effect that omits `terminationEvent`, **When** the request is validated, **Then** it is accepted (field is optional, backwards compatible).

---

### User Story 3 - Fight log reports effect removal (Priority: P2)

As a game client developer, I want the fight result to include a dedicated step when a status effect is removed by an event so that I can display the removal animation and inform the player.

**Why this priority**: Observability of the removal in the fight log is important for client rendering but secondary to the core mechanic working correctly.

**Independent Test**: Can be tested by running a fight where an event-bound effect is terminated, then inspecting the fight result for a step of the appropriate kind with correct metadata (card identity, effect type, event name).

**Acceptance Scenarios**:

1. **Given** a card's burn effect is removed by event `"fire-shield-end"`, **When** the fight result is inspected, **Then** a step with kind `"effect_removed"` is present, containing the card identity, effect type (`"burn"`), and the event name.
2. **Given** multiple cards have effects bound to the same event, **When** that event fires, **Then** one `"effect_removed"` step is emitted per card whose effect was removed.

---

### Edge Cases

- What happens when a card has an event-bound effect but the termination event never fires during the fight? The effect expires naturally via its `remainingTurns` duration as it does today.
- What happens when the termination event fires but the card's effect has already expired naturally? No removal step is emitted for that card (nothing to remove).
- What happens when the termination event fires but the card is already dead? Dead cards are not processed — no removal step emitted.
- What happens when a card has multiple different effects (e.g., burn + poison) and both are bound to the same termination event? Both effects are removed and a removal step is emitted for each.
- What happens when the same effect type is re-applied after event-bound removal? The new effect applies normally with its own configuration (may or may not have a termination event).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support an optional `terminationEvent` field on status effects (poison, burn, freeze) that names the event which will remove the effect.
- **FR-002**: When an event matching a status effect's `terminationEvent` is fired, the system MUST remove that effect from all affected living cards.
- **FR-003**: Removal of an event-bound effect MUST produce a dedicated step in the fight log with the card identity, effect type, and the event name that triggered removal.
- **FR-004**: Status effects without a `terminationEvent` MUST continue to behave exactly as they do today (duration-based expiration only).
- **FR-005**: The API MUST accept an optional `terminationEvent` string field on effect definitions in the fight request payload.
- **FR-006**: The event-bound effect removal MUST be processed by the same mechanism that handles event-bound buff removal, extended to also scan for matching effects.
- **FR-007**: If a card is dead or the effect has already expired when the termination event fires, the system MUST NOT emit a removal step for that card/effect.

### Key Entities

- **Status Effect (CardState)**: Gains an optional `terminationEvent` string field alongside its existing `type`, `level`, and `remainingTurns`.
- **Effect Removal Step**: New fight log step kind (`effect_removed`) containing card identity, effect type, and event name.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of event-bound effects are correctly removed when their termination event fires during battle simulation.
- **SC-002**: Zero breaking changes — all existing fight configurations without `terminationEvent` produce identical results.
- **SC-003**: Fight logs contain one `effect_removed` step per card per effect removed by an event, with complete metadata.
- **SC-004**: The API accepts and validates the new optional `terminationEvent` field on effects without rejecting existing payloads.

## Assumptions

- The termination event name follows the same string convention as existing buff `terminationEvent` values (free-form string, matched exactly).
- The `EndEventProcessor` (which already handles buff removal) is the natural place to extend for effect removal, ensuring a single pass when an event fires.
- Effect removal by event happens at the same processing point as buff removal by event — when a skill emits its `endEvent`.
