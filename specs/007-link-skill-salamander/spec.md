# Feature Specification: Kaelion Link Skill - Salamander Tears

**Feature Branch**: `007-link-skill-salamander`  
**Created**: 2026-05-18  
**Status**: Draft  
**Input**: https://github.com/cegerard/card-game/issues/328

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Ally-Health Conditional Trigger (Priority: P1)

A game developer configures Kaelion with the "Salamander Tears" skill, specifying Arionis as the linked ally. When a battle simulation runs with both Kaelion and Arionis in the same team, and Arionis' HP drops below 30%, the system automatically triggers Kaelion's link skill. The skill fires exactly once per threshold crossing (edge-triggered) and does not fire again unless Arionis recovers above 30% and drops below again.

**Why this priority**: This is the core activation mechanism of the entire link skill. Without it, the other components cannot function. It defines a new category of skill trigger — monitoring an ally's health rather than reacting to the card's own state or a turn event.

**Independent Test**: Configure a battle with Kaelion (Salamander Tears skill linked to Arionis) and Arionis in the same deck. Have an enemy deal enough damage to bring Arionis below 30% HP. Verify that the Salamander Tears sequence appears in the fight log exactly once at that moment, and does not repeat on subsequent damage while Arionis remains below 30%.

**Acceptance Scenarios**:

1. **Given** Kaelion and Arionis are both in the team, **When** Arionis' HP drops below 30% for the first time, **Then** the Salamander Tears skill triggers and its steps appear immediately after the HP-crossing event in the fight log.
2. **Given** Arionis is already below 30% HP, **When** Arionis takes additional damage, **Then** the Salamander Tears skill does NOT trigger again.
3. **Given** Arionis' HP crossed below 30% and then was healed back above 30%, **When** Arionis takes damage and drops below 30% again, **Then** the Salamander Tears skill triggers a second time.
4. **Given** Arionis is NOT present in the team, **When** a battle is simulated with Kaelion only, **Then** the Salamander Tears skill does not exist / cannot fire.
5. **Given** Kaelion is dead before Arionis drops below 30%, **When** Arionis' HP crosses the threshold, **Then** the skill does NOT trigger (dead cards cannot act).

---

### User Story 2 - Massive Explosion: Fire Attack on Last Attacker (Priority: P2)

When Salamander Tears triggers, Kaelion unleashes a fire-based attack dealing 200% of his attack stat as fire-type damage against the enemy who most recently damaged Arionis.

**Why this priority**: This is the primary offensive component of the skill. It delivers the combat impact and tests a new targeting concept — resolving the "last attacker" of a specific ally — which is the main mechanical novelty.

**Independent Test**: Configure a battle where enemy card A attacks Arionis first and enemy card B attacks Arionis last before the threshold is crossed. Verify that only card B receives the 200% fire damage from Kaelion's Salamander Tears explosion.

**Acceptance Scenarios**:

1. **Given** multiple enemies have attacked Arionis, **When** Salamander Tears fires, **Then** the fire damage targets only the enemy card that most recently dealt damage to Arionis.
2. **Given** Salamander Tears fires, **When** the explosion step is emitted, **Then** it shows fire-type damage equal to 200% of Kaelion's attack stat, applied against the last attacker's element resistances.
3. **Given** the last enemy who attacked Arionis has already died, **When** Salamander Tears fires, **Then** the Massive Explosion step is skipped and only the Power Transfer buffs are applied.
4. **Given** no enemy has yet attacked Arionis when the threshold is crossed, **When** Salamander Tears fires, **Then** the Massive Explosion step is skipped and only the Power Transfer buffs are applied.

---

### User Story 3 - Power Transfer: Buff Arionis (Priority: P3)

After the fire explosion, Kaelion applies a +10% attack buff and a +20% defense buff specifically to Arionis, both associated with the "Salamander Tears" event name so they can be referenced or removed by event-bound mechanisms.

**Why this priority**: This is the support component of the skill that reinforces the narrative of Kaelion protecting and empowering his brother. It reuses existing buff mechanics and depends on the trigger already established in Story 1.

**Independent Test**: Configure a battle where Arionis drops below 30% HP (triggering Salamander Tears). Verify that two buff steps appear in the fight log after the explosion step: one granting Arionis +10% attack and one granting +20% defense, both tagged with the "Salamander Tears" event.

**Acceptance Scenarios**:

1. **Given** Salamander Tears triggers, **When** the buff steps are emitted, **Then** Arionis receives an attack buff of +10% and a defense buff of +20%, and both are tagged with the "Salamander Tears" event name.
2. **Given** Arionis is dead when the buff step would apply, **When** the buff step is processed, **Then** the buff is skipped (no dead-card buff).
3. **Given** the buffs last 3 turns, **When** five turns passed, **Then** the buffs are removed.

---

### Edge Cases

- What happens if Arionis and Kaelion are on opposing teams? The skill requires Arionis as a team ally; placing him on the enemy side MUST not activate the link.
- What if Arionis takes damage that kills him exactly at the 30% boundary in the same hit that would trigger the skill? The trigger condition is crossing below 30%; death below 30% should still be considered a threshold crossing for trigger evaluation, but Kaelion cannot buff a dead Arionis.
- What if Kaelion himself deals the last hit of damage to Arionis (e.g., via splash or AOE)? This would be a self-team damage edge case — Kaelion is an ally, not an enemy, so ally-sourced damage should not be tracked as "last attacker" for explosion targeting.
- What if multiple cards deal damage to Arionis in the same resolution step? The system must have a deterministic rule for which counts as "last" (e.g., ordering within the step).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The "Salamander Tears" skill MUST only activate if the card designated as the linked ally (identified by ID) is present in the same team at battle start.
- **FR-002**: The skill MUST monitor the linked ally's HP ratio and trigger once when that ratio crosses below a configurable threshold (defaulting to 30%), edge-triggered (one fire per downward crossing).
- **FR-003**: When triggered, the skill MUST deal fire-type damage equal to 200% of Kaelion's attack stat to the enemy card that most recently damaged the linked ally.
- **FR-004**: The system MUST track, per card, the identity of the last enemy that dealt damage to it throughout the battle, and expose this information for targeting resolution.
- **FR-005**: After the fire attack resolves, the skill MUST apply a +10% attack buff and a +20% defense buff to the linked ally.
- **FR-006**: Both buffs MUST last 5 turns (no termination event), applied directly to Arionis when the skill fires.
- **FR-007**: The skill MUST be grouped as a composite power (sharing the same `powerId` named "Salamander Tears") so that all its components (attack + buffs) are represented together in the fight log.
- **FR-008**: The skill MUST NOT trigger if Kaelion is dead at the time the linked ally's HP crosses the threshold.
- **FR-009**: The skill MUST re-arm after the linked ally's HP recovers above the threshold, enabling a second trigger if HP drops below again later in the battle.

### Key Entities

- **Link Skill**: A composite skill bound to a specific ally card by ID, monitoring that ally's HP rather than the caster's own HP. Combines an ally-HP threshold trigger with a conditional attack and buffing components.
- **Last Attacker Tracker**: A per-card record of the most recent enemy card that dealt damage to it. Updated on every damage event. Used as the targeting reference for the Massive Explosion component.
- **Ally-Health Trigger**: A trigger type that evaluates an ally card's HP ratio (rather than self or a game event) and fires on a downward threshold crossing.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A battle simulation with Kaelion + Arionis in the same team completes without errors when Arionis drops below 30% HP, and the Salamander Tears sequence (attack step + two buff steps) appears exactly once in the fight log at that point.
- **SC-002**: The fire damage step correctly targets the card that last attacked Arionis, verified across at least 3 distinct test scenarios with different attacker sequences.
- **SC-003**: The Salamander Tears skill does NOT appear in fight logs for battles where Arionis is absent from the team, confirming the ally-presence gate works.
- **SC-004**: The edge-trigger behavior is verified: the skill fires exactly once per downward HP crossing, and correctly re-arms and fires again if Arionis recovers and drops below 30% a second time.
- **SC-005**: Both buffs on Arionis are active from the moment Salamander Tears fires until five turn passed, verified by confirming buff expiration in the fight log.

## Assumptions

- Buff duration for the Power Transfer buffs last **five turns** (no termination event): +10% attack and +20% defense remain on Arionis for the next five turns.
- The "Salamander Tears" label in the issue refers to the `powerId` grouping the skill components for fight log reporting, not a buff termination event.
- "Last enemy who hurt Arionis" means the most recent enemy card to successfully deal damage (dodge events do not update the tracker).
- If no enemy has yet attacked Arionis when the threshold is crossed, the Massive Explosion step is skipped and only the buff component fires.
- If the last attacker of Arionis is already dead when the skill fires, the Massive Explosion step is also skipped.
- The skill is edge-triggered in the same manner as the existing SHIELD skill: one fire per downward crossing, rearms on upward crossing.
- The 200% fire damage uses Kaelion's current attack stat (after all active buffs/debuffs) at the moment the skill fires, consistent with how other attack skills compute damage.
