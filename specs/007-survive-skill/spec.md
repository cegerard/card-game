# Feature Specification: Survive Skill

**Feature Branch**: `007-survive-skill`  
**Created**: 2026-05-16  
**Status**: Draft  
**Input**: User description: "We want to add a skill that allows a character to survive when he receives a deadly hit. Instead of dying, it drops to 1 HP. Example: When Kaelion receives a fatal blow for the first time, he narrowly avoids death thanks to his connection with the earth. He retains 1 HP, his defense increases by 100%, and his attack by 150% until the end of his next turn. This only works once."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Survive a Fatal Blow (Priority: P1)

A card configured with the Survive skill receives a hit that would reduce its health to 0 or below. Instead of dying, it survives with exactly 1 HP. The survival is recorded in the battle log so the player can see what happened.

**Why this priority**: This is the core mechanic of the feature. Without it, nothing else makes sense.

**Independent Test**: Configure a card with the Survive skill, deal enough damage to kill it in one hit, and verify it remains alive with 1 HP.

**Acceptance Scenarios**:

1. **Given** a card with the Survive skill and 50 HP receives a hit dealing 200 damage, **When** the damage is applied, **Then** the card survives with exactly 1 HP instead of dying.
2. **Given** a card with the Survive skill already used, **When** it receives another fatal blow, **Then** it dies normally (skill is single-use).
3. **Given** a card without the Survive skill, **When** it receives a fatal blow, **Then** it dies as usual (no change to existing behavior).

---

### User Story 2 - Survival Triggers Temporary Buffs (Priority: P2)

When the Survive skill activates, the surviving card immediately receives a set of temporary stat buffs (e.g., defense +100%, attack +150%) that last until the end of its next turn.

**Why this priority**: The buffs are part of the intended design and give the survivor a last-stand window, but the core survival mechanic is independently valuable.

**Independent Test**: Trigger the Survive skill, then observe the buff steps in the battle log and verify their values and duration.

**Acceptance Scenarios**:

1. **Given** the Survive skill activates on a card, **When** survival is resolved, **Then** the battle log records buff steps for all configured buffs applied to the surviving card.
2. **Given** the buffs from Survive have a duration tied to "end of next turn", **When** the surviving card completes its next turn, **Then** the buffs expire.
3. **Given** a card configured with Survive but no buffs, **When** the skill activates, **Then** the card still survives at 1 HP with no buff steps emitted.

---

### Edge Cases

- What happens if the card already has 1 HP when it receives a fatal blow? The skill still activates (the blow would still be fatal); the card remains at 1 HP.
- What happens if multiple fatal blows arrive in the same action phase (multi-hit attack)? The Survive skill activates on the first fatal hit; subsequent hits from the same multi-hit action proceed normally and may kill the card.
- What happens if multiple cards on the same team have the Survive skill? Each card's skill is independent; each can activate once.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A card MUST be configurable with a Survive skill via the fight request payload.
- **FR-002**: When a card with an unused Survive skill receives damage that would reduce its HP to 0 or below, the system MUST set its HP to exactly 1 instead of marking it dead.
- **FR-003**: The Survive skill MUST activate at most once per card per battle (single-use).
- **FR-004**: After the Survive skill activates, any configured temporary buffs MUST be immediately applied to the surviving card and recorded in the battle log.
- **FR-005**: The buffs granted on survival MUST expire at the end of the surviving card's next turn.
- **FR-006**: The battle log MUST include a step indicating that the Survive skill fired, distinct from a normal status change or buff step.
- **FR-007**: If the Survive skill has already been used, a subsequent fatal blow MUST kill the card normally.
- **FR-008**: The Survive skill MUST NOT interfere with cards that do not have it configured.

### Key Entities

- **Survive Skill**: A one-time reactive skill attached to a fighting card. Activates when incoming damage would be fatal. Sets HP to 1 and optionally applies temporary buffs. Tracks whether it has already been consumed.
- **Survival Buff**: A temporary stat modification (e.g., attack, defense) applied to the surviving card when the skill triggers. Uses the existing buff system with a duration expressed as turns remaining.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A card configured with the Survive skill survives 100% of first fatal blows and drops to exactly 1 HP every time.
- **SC-002**: The Survive skill never activates more than once per card per battle, across all tested scenarios.
- **SC-003**: Buffs applied on survival expire no later than the end of the surviving card's next turn in 100% of cases.
- **SC-004**: All existing fight simulations pass without regression — the Survive skill has zero impact on cards that do not have it.
- **SC-005**: The battle log always contains a traceable survival step when the skill fires, enabling clients to reconstruct the exact moment of survival.

## Assumptions

- The Survive skill reuses the existing health-reactive skill mechanism already used by the Shield skill, with an edge-triggered activation at the moment of fatal damage resolution.
- "End of next turn" is expressed as a buff duration of 1 turn in the existing buff system (applied immediately after survival, expires at the next turn-end tick).
- The buffs on survival are optional and configurable in the payload; the skill is valid with zero buffs.
- Multi-hit attacks resolve hits sequentially; the Survive skill activates on the first hit that would be fatal.
- The survival event is a new distinct step kind in the battle log (e.g., `survived`) to keep it clearly identifiable.
