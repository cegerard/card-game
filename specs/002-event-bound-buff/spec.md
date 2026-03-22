# Feature Specification: Event-Bound Buff Termination

**Feature Branch**: `002-event-bound-buff`
**Created**: 2026-03-21
**Status**: Draft
**Input**: User description: "A buff should be tied to an event to be stopped. Example: Arionis has a skill named Lion's Inheritance that triggers a buff. Arionis gains a 40% attack bonus until the end of the lion's inheritance. The lion's inheritance triggers an event when the skill ends."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Skill Applies an Event-Bound Buff (Priority: P1)

A game designer configures a skill (e.g., "Lion's Inheritance") that grants a buff which persists until the skill itself ends. The buff has no fixed turn duration — it lasts exactly as long as the skill is active, and is automatically removed when the skill signals its end via an event.

**Why this priority**: This is the core mechanic of the feature. All other stories depend on this working correctly.

**Independent Test**: Can be tested by running a battle where a card has "Lion's Inheritance" (a skill with a finite number of activations), verifying the buff is present during active turns and absent after the skill ends.

**Acceptance Scenarios**:

1. **Given** a card has a skill that applies an event-bound buff, **When** the skill activates, **Then** the buff is applied to the card with no turn-count expiry.
2. **Given** a card has an active event-bound buff, **When** the linked skill fires its end event, **Then** the buff is immediately removed from the card.
3. **Given** a card has an active event-bound buff, **When** several turns pass without the end event firing, **Then** the buff remains active.

---

### User Story 2 - Skill Emits an End Event After Its Lifecycle Completes (Priority: P2)

A game designer configures a skill with a finite lifespan (e.g., activates for 3 turns). When the skill's last activation occurs, it emits a named end event (e.g., "lions-inheritance-end"). Any buffs bound to that event are then removed.

**Why this priority**: Required to actually terminate event-bound buffs. Without end event emission, the buff would never be removed.

**Independent Test**: Configure a skill with 3 activations, run a battle for more than 3 turns, and verify the end event appears in the fight log after the 3rd activation and the buff is gone.

**Acceptance Scenarios**:

1. **Given** a skill with a configured activation limit of N, **When** it activates for the N-th time, **Then** it emits its end event.
2. **Given** a skill that has emitted its end event, **When** subsequent turns pass, **Then** the skill no longer activates.
3. **Given** the end event fires mid-turn, **When** checking card stats after that step, **Then** the associated buff is no longer applied.

---

### User Story 3 - Card Death Cleans Up Event-Bound Buffs (Priority: P3)

When a card that owns a lifecycle-limited skill dies before the skill's activation limit is reached, the system still cleans up any event-bound buffs associated with that skill by emitting the end event at the moment of death.

**Why this priority**: Prevents orphaned buffs from persisting on other cards after the source card is dead, which would be a gameplay inconsistency.

**Independent Test**: Configure a card with a lifecycle skill that applies an event-bound buff to allies, kill that card before the skill limit is reached, and verify all allied buffs from that skill are removed.

**Acceptance Scenarios**:

1. **Given** a card with a lifecycle skill has applied an event-bound buff to allied cards, **When** the card dies before the activation limit is reached, **Then** the skill's end event fires immediately.
2. **Given** the end event fires due to card death, **When** checking allied cards, **Then** all buffs bound to that event are removed.

---

### Edge Cases

- What happens if the card that owns the skill dies before the skill's lifecycle ends? The end event fires immediately upon card death to prevent orphaned buffs persisting on other cards.
- What happens if an event-bound buff is applied multiple times (e.g., the skill triggers and the card already has the buff)? The duplicate application refreshes/resets the existing event-bound buff rather than stacking a second instance.
- What happens if a buff specifies both a turn duration and an event binding? The buff is removed whichever condition is met first (duration expires OR end event fires).
- What happens if the end event fires but the buff's target card is already dead? No action is taken — dead cards are not in play.
- What happens if two different skills share the same end event name? Both skills' lifecycles firing will trigger removal of all buffs bound to that event name.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A buff MUST be configurable with an optional named termination event that, when fired, causes the buff to be removed.
- **FR-002**: A skill MUST be configurable with an optional activation limit (maximum number of times it triggers before its lifecycle ends).
- **FR-003**: A skill MUST be configurable with an optional end event name emitted when its lifecycle completes (activation limit reached).
- **FR-004**: When a skill reaches its activation limit, the system MUST emit the skill's configured end event.
- **FR-005**: When an end event is emitted, the system MUST remove all buffs bound to that event name from all affected cards in the same step.
- **FR-006**: The removal of event-bound buffs MUST be recorded as a step in the fight result log.
- **FR-007**: When the card owning a lifecycle-limited skill dies before reaching its activation limit, the system MUST emit the skill's end event at the moment of death.
- **FR-008**: A buff configured with an event binding and no turn duration MUST remain active indefinitely until its bound event fires.
- **FR-009**: A buff configured with both a turn duration and an event binding MUST be removed when whichever condition is satisfied first.
- **FR-010**: Applying the same event-bound buff to a card that already holds it MUST refresh the existing buff rather than stack a duplicate.
- **FR-011**: A skill with no activation limit MUST continue to behave as it does today (infinite re-triggering, no end event).

### Key Entities

- **Skill Lifecycle**: A skill extended with an optional activation count and an associated end event name; tracks activations per battle.
- **Event-Bound Buff**: A buff carrying an optional named termination event instead of (or alongside) a turn-count duration.
- **End Event**: A named signal emitted by a skill when its lifecycle completes; consumed by the buff system to remove matching buffs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of event-bound buffs on all affected cards are removed within the same fight step as the end event — zero delayed or missed removals.
- **SC-002**: Buffs configured without an event binding continue to behave exactly as before — zero regressions in existing turn-duration buff behavior.
- **SC-003**: A skill with an activation limit of N fires its end event on exactly the N-th activation in 100% of tested scenarios.
- **SC-004**: All event-bound buff removals appear in the fight log, providing a complete auditable trail of every buff lifecycle change.
- **SC-005**: Card death with an active lifecycle skill triggers end event emission and buff cleanup in 100% of cases — zero orphaned buffs after card death.

## Assumptions

- A skill's end event name is defined by the game designer at configuration time and must match exactly the termination event name on associated buffs.
- Skills with no activation limit behave identically to today (no change to existing behavior).
- The activation limit applies per battle — it resets between battles (stateless simulation).
- A single skill emits at most one end event per battle (when it exhausts its activation count or when its owner dies — whichever comes first).
- Existing duration-based buff behavior is unchanged; this feature adds an opt-in event-binding mechanism alongside it.
