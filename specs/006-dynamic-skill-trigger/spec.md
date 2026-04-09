# Feature Specification: Dynamic Skill Trigger

**Feature Branch**: `006-dynamic-skill-trigger`
**Created**: 2026-04-08
**Status**: Draft
**Input**: User description: "We want a skill that can have no trigger at the beginning of the battle and can be changed during the battle. A character has a healing skill that can not be triggered by default. When a specific ally dies (identify with its ID), the trigger is changed to launch the skill on a specific enemy (identify with its ID) die event."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dormant Skill Activation via Ally Death (Priority: P1)

A game developer configures a fighting card with a skill that starts dormant (no trigger). The skill cannot activate during battle until a specific event changes its trigger. When a designated ally dies, the skill's trigger is reassigned to fire on a specific enemy's death event. From that point on, the skill activates whenever that enemy dies (or on subsequent relevant triggers).

**Why this priority**: This is the core mechanic — a skill that transitions from inactive to active based on an in-battle event. Without this, the feature has no value.

**Independent Test**: Can be fully tested by setting up a battle where an ally dies and verifying that the previously dormant skill begins triggering on the designated enemy death event.

**Acceptance Scenarios**:

1. **Given** a card has a dormant healing skill with no trigger, **When** the battle begins and turns pass, **Then** the skill never activates.
2. **Given** a card has a dormant healing skill configured to activate on a specific ally's death, **When** that ally dies, **Then** the skill's trigger changes to fire on a specific enemy's death event.
3. **Given** a skill's trigger has been changed to an enemy death event, **When** that enemy dies, **Then** the skill activates and performs its healing effect.

---

### User Story 2 - Dormant Skill Remains Inactive When Activation Condition Is Not Met (Priority: P2)

A game developer configures a card with a dormant skill. The designated ally never dies during the battle (battle ends before the ally is killed). The skill remains dormant for the entire fight.

**Why this priority**: Ensures the dormant state is respected and no unintended activation occurs — critical for correctness.

**Independent Test**: Can be tested by running a battle where the activating ally survives the entire fight and verifying the skill never fires.

**Acceptance Scenarios**:

1. **Given** a card has a dormant skill waiting for ally "A" to die, **When** ally "A" survives the entire battle, **Then** the skill never activates.
2. **Given** a card has a dormant skill waiting for ally "A" to die, **When** a different ally "B" dies, **Then** the skill remains dormant.

---

### User Story 3 - Skill Owner Dies Before Trigger Activation (Priority: P3)

A game developer configures a card with a dormant skill. The card owning the dormant skill dies before the activation condition (ally death) is met. The trigger change never occurs because the skill owner is no longer alive.

**Why this priority**: Edge case for correctness — dead cards should not have their skills modified or triggered.

**Independent Test**: Can be tested by killing the skill owner before the designated ally dies and verifying no trigger change or skill activation occurs.

**Acceptance Scenarios**:

1. **Given** card "C" has a dormant skill waiting for ally "A" to die, **When** card "C" dies before ally "A", **Then** no trigger change occurs and the skill is never activated.

---

### Edge Cases

- What happens when the skill owner and the activating ally die in the same turn? The skill should not activate since the owner is also dead.
- What happens when the enemy whose death should trigger the skill is already dead when the trigger is changed? The skill should wait for valid future trigger events (it does not retroactively fire).
- What happens when multiple cards have dormant skills waiting for the same ally to die? All surviving cards with such skills should have their triggers updated.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support skills configured with no trigger (dormant state) that cannot activate during battle.
- **FR-002**: System MUST support a trigger change definition that specifies: (a) the activation event (a specific ally's death by card ID), and (b) the new trigger to assign (e.g., a specific enemy's death event by card ID).
- **FR-003**: When the activation event occurs, the system MUST change the skill's trigger to the specified new trigger on all surviving cards that have a matching dormant skill configuration.
- **FR-004**: After trigger reassignment, the skill MUST activate normally when the new trigger event fires.
- **FR-005**: A dormant skill MUST NOT activate before its trigger is changed.
- **FR-006**: If the skill owner dies before the activation event, the system MUST NOT change the trigger or activate the skill.
- **FR-007**: The trigger change mechanism MUST work with any existing skill kind (healing, buff, debuff, attack).

### Key Entities

- **Dormant Skill**: A skill that starts with no trigger and cannot activate until a trigger is assigned during battle. It holds a trigger change rule defining when and how activation occurs.
- **Trigger Change Rule**: A configuration composed of an activation event (the event that causes the trigger change, identified by card ID) and a replacement trigger (the new trigger to assign to the skill, identified by card ID and event type).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A skill configured as dormant never activates during a battle where no trigger change event occurs.
- **SC-002**: When the activation event fires, the skill's trigger is correctly reassigned and the skill activates on the next matching event.
- **SC-003**: All existing skill kinds (healing, buff, debuff, attack) work correctly with the dormant-to-active trigger change mechanism.
- **SC-004**: All existing tests continue to pass without modification (backward compatibility).

## Assumptions

- The activation event for trigger change is limited to death events (ally or enemy death by card ID), consistent with the existing event system.
- A skill can only have one trigger change rule (one activation event leading to one replacement trigger).
- The replacement trigger follows the same patterns as existing triggers (e.g., `ally-death:<cardId>`, `turn-end`, etc.).
- The dormant state is represented by the absence of a trigger, not a special "no-op" trigger type.
