# Feature Specification: Targeted Card Strategy

**Feature Branch**: `005-targeted-card-strategy`  
**Created**: 2026-04-06  
**Status**: Draft  
**Input**: User description: "Add a new targeting strategy to target a specific card by its ID. If the targeted card dies, the strategy returns no target. This strategy can only be used through a targeting override because the target card must be known at configuration time."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Target a specific enemy card via targeting override (Priority: P1)

A game developer configures a card with a targeting override skill that, when triggered, switches the card's attack targeting to focus on a specific enemy card identified by its ID. As long as the targeted card is alive, every attack from the overridden card hits that specific target. This enables tactical mechanics like "lock-on" or "vendetta" behaviors.

**Why this priority**: This is the core functionality of the feature. Without it, no other scenario is relevant.

**Independent Test**: Can be fully tested by configuring a targeting override skill with the new strategy, triggering it, and verifying the card attacks only the designated target.

**Acceptance Scenarios**:

1. **Given** a card with a targeting override skill using the targeted-card strategy pointing to an enemy card ID, **When** the override triggers, **Then** the card's attacks target only that specific enemy card.
2. **Given** the targeting override is active and the targeted card is alive, **When** the attacking card performs a simple attack, **Then** the attack hits the targeted card regardless of position.

---

### User Story 2 - Stop targeting when the designated card dies (Priority: P1)

When the specifically targeted card dies during battle, the targeting strategy returns an empty list of targets. The attacking card effectively has no valid target through this strategy until the override is reverted.

**Why this priority**: This is an essential part of the strategy's contract and ensures coherent battle behavior when the target no longer exists.

**Independent Test**: Can be tested by killing the targeted card mid-battle and verifying the strategy returns no targets on subsequent attacks.

**Acceptance Scenarios**:

1. **Given** the targeted card strategy is active, **When** the targeted card dies, **Then** the strategy returns no targets for subsequent attacks.
2. **Given** the targeted card is dead and the strategy returns no targets, **When** the override is eventually reverted (via termination event), **Then** the card resumes using its original targeting strategy.

---

### User Story 3 - Restrict strategy usage to targeting overrides only (Priority: P1)

The targeted-card strategy requires knowing the target card's ID at configuration time. This information is only available through the targeting override mechanism, which provides the necessary context to identify the target. The strategy must not be usable as a regular targeting strategy for simple attacks, specials, or other skills.

**Why this priority**: This constraint ensures the strategy is used correctly and prevents misconfiguration.

**Independent Test**: Can be tested by verifying that the strategy is only accepted in targeting override configurations and rejected in other contexts.

**Acceptance Scenarios**:

1. **Given** a battle configuration using the targeted-card strategy in a targeting override skill, **When** the configuration is validated, **Then** it is accepted as valid.
2. **Given** a battle configuration using the targeted-card strategy as a simple attack targeting, **When** the configuration is validated, **Then** it is rejected with a validation error.

---

### Edge Cases

- What happens when the targeted card ID does not exist in the opposing team? The strategy returns no targets from the start.
- What happens when multiple cards have targeting overrides pointing to the same target? Each card independently targets that card; when it dies, all of them lose their target.
- What happens when the override is reverted before the target dies? The card resumes its original targeting strategy normally.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a new targeting strategy that targets a single specific card identified by its unique ID.
- **FR-002**: The targeted-card strategy MUST return the targeted card as the sole target when it is alive.
- **FR-003**: The targeted-card strategy MUST return an empty target list when the targeted card is dead.
- **FR-004**: The targeted-card strategy MUST only be configurable through the targeting override skill mechanism.
- **FR-005**: The system MUST reject battle configurations that use the targeted-card strategy outside of a targeting override context (e.g., as a simple attack or special targeting strategy).
- **FR-006**: The targeting override skill using this strategy MUST specify the target card ID in its configuration.
- **FR-007**: The targeted-card strategy MUST work with the existing targeting override lifecycle (activation via event trigger, removal via termination event).

### Key Entities

- **Targeted Card Strategy**: A targeting strategy that holds a reference to a specific card ID and returns that card as the sole target if alive, or no targets if dead.
- **Target Card ID**: The unique identifier of the card to be targeted, provided at configuration time through the targeting override skill.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A card with an active targeted-card override hits the designated target 100% of the time while the target is alive.
- **SC-002**: When the targeted card dies, the attacking card performs no attack (no target available) until the override is reverted.
- **SC-003**: Battle configurations using the targeted-card strategy outside of targeting overrides are rejected during validation.
- **SC-004**: The feature integrates seamlessly with existing targeting override lifecycle (activation, termination event, revert).

## Assumptions

- The target card ID refers to a card in the opposing player's deck (enemy targeting). Targeting allied cards is not in scope for this strategy.
- The "no target" behavior when the targeted card is dead means the attack action is skipped for that card during that turn (consistent with existing behavior when no valid targets exist).
- The validation restriction (FR-005) applies at the input validation layer, preventing misconfiguration before the battle starts.
