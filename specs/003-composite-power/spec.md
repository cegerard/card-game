# Feature Specification: Composite Power (Grouped Skills with Shared Identity)

**Feature Branch**: `003-composite-power`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "Ajouter un pouvoir qui regroupe plusieurs competences existantes via un identifiant commun. Quand le pouvoir se declenche, ses competences liees s'activent (buff, attaque avec effet, changement de ciblage). Quand le pouvoir prend fin, tous les effets lies disparaissent. L'identifiant de groupe permet aussi de gerer l'affichage cote client."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Group Existing Skills into a Composite Power (Priority: P1)

A game developer configures multiple skills on a fighting card (e.g., a buff, an attack with burn effect, a targeting override) and assigns them the same power identifier. The system recognizes these skills as belonging to the same composite power. When the trigger event fires, all grouped skills activate together. The fight log reports each effect individually but tags them with the shared power identifier so the client can group them visually.

**Why this priority**: This is the foundation — linking existing skills by a shared identifier is the core mechanism. Without it, there is no composite power.

**Independent Test**: Can be fully tested by configuring a card with 2+ skills sharing the same power identifier, triggering their event, and verifying all activate and appear in the fight log with the group identifier.

**Acceptance Scenarios**:

1. **Given** a card has two skills (a buff and a healing) sharing the same power identifier, **When** their trigger event fires, **Then** both skills activate in the same turn and the fight log steps include the shared power identifier.
2. **Given** a card has three skills grouped under the same power identifier, **When** the fight result is returned, **Then** each step produced by these skills carries the power identifier, enabling client-side grouping.
3. **Given** a card has skills with different power identifiers, **When** the trigger event fires, **Then** only skills matching the triggered group activate together.

---

### User Story 2 - Composite Power Expiration Cleans Up All Grouped Effects (Priority: P1)

When a composite power ends (via duration, activation limit, or termination event), all effects produced by skills in that group are removed. Buffs are removed, targeting overrides revert, and the power is considered expired. The cleanup leverages the existing event-bound buff mechanism — all skills in the group share the same termination event.

**Why this priority**: Equally critical — the defining value of composite powers is that grouped effects share a lifecycle. Without unified cleanup, individual skills would expire independently, defeating the purpose.

**Independent Test**: Can be tested by activating a composite power, advancing turns until expiration, and verifying all grouped effects are removed simultaneously.

**Acceptance Scenarios**:

1. **Given** a composite power has a buff and a targeting override grouped together with a shared termination event, **When** the power ends, **Then** the buff is removed and the targeting reverts to original in the same turn.
2. **Given** a composite power's lifecycle skill reaches its activation limit and emits the shared end event, **When** the end event fires, **Then** all event-bound buffs and effects tied to that event are cleaned up.
3. **Given** two separate composite powers are active on the same card (different power identifiers), **When** one power expires, **Then** only its grouped effects are removed; the other power's effects remain intact.

---

### User Story 3 - Targeting Strategy Override as a Grouped Skill (Priority: P2)

A game developer configures a skill within a composite power group that temporarily overrides the card's attack targeting strategy (e.g., switch from position-based to target-all). The override persists while the power is active and reverts when the power ends.

**Why this priority**: Targeting override is a new sub-effect type that extends the existing skill system. It depends on the grouping mechanism (P1) being in place first.

**Independent Test**: Can be tested by configuring a targeting override skill in a power group, activating it, verifying the card's attacks use the new targeting, then verifying revert after power expiration.

**Acceptance Scenarios**:

1. **Given** a composite power includes a targeting override skill (e.g., position-based to target-all), **When** the power activates, **Then** the card's simple attack uses the overridden targeting strategy.
2. **Given** a targeting override is active, **When** the card performs a simple attack, **Then** the attack targets according to the overridden strategy, not the original.
3. **Given** a targeting override is active, **When** the composite power expires, **Then** the card's simple attack reverts to its original targeting strategy.
4. **Given** a targeting override is configured, **When** the power activates, **Then** the override applies only to the card's base attacks (simple attack and special), not to other event-triggered skills.

---

### User Story 4 - Client-Side Display Grouping via Power Identifier (Priority: P2)

The fight log includes the power identifier on every step produced by grouped skills. This allows game clients to visually group effects under a single "power activation" or "power deactivation" display, rather than showing individual unrelated skill activations.

**Why this priority**: Display grouping is essential for user experience but secondary to the mechanics working correctly.

**Independent Test**: Can be tested by inspecting the fight result JSON and verifying that steps from grouped skills carry the power identifier field.

**Acceptance Scenarios**:

1. **Given** a composite power activates with 3 grouped skills, **When** the fight result is returned, **Then** each resulting step includes the power identifier field.
2. **Given** a composite power expires, **When** buff_removed and other cleanup steps are emitted, **Then** these steps also carry the power identifier.
3. **Given** a skill has no power identifier, **When** the fight result is returned, **Then** its steps do not include a power identifier field (backwards compatibility).

---

### Edge Cases

- What happens when a card dies while a composite power is active? All effects are implicitly cleaned up since dead cards are removed from play.
- What happens when skills in a group have different trigger events? This is not allowed — all skills sharing a power identifier must share the same trigger event. The API rejects mismatched triggers within a group.
- What happens when a composite power includes a buff and the card already has an identical buff from another source? Both buffs coexist; only the one tied to the power's termination event is removed on expiration.
- What happens when a power identifier is used on only one skill? It behaves as a normal skill with the identifier available for display purposes.
- What happens when the targeting override skill has no termination event? The override persists for the entire battle (same as duration 0 without termination event for buffs).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support an optional power identifier on skills, linking multiple skills as belonging to the same composite power.
- **FR-002**: The power identifier MUST be included in fight log steps produced by grouped skills, enabling client-side display grouping.
- **FR-003**: Skills sharing a power identifier MUST share the same termination event, ensuring unified lifecycle cleanup.
- **FR-004**: When a power's termination event fires, the system MUST remove all effects (buffs, debuffs, targeting overrides) bound to that event.
- **FR-005**: System MUST support a new skill effect type: targeting strategy override, which temporarily replaces a card's base attack targeting strategy.
- **FR-006**: When a targeting override expires (via the power's termination event), the system MUST restore the card's original targeting strategy.
- **FR-007**: Targeting overrides MUST apply only to the card's base attacks (simple attack and special), not to other event-triggered skills.
- **FR-008**: The API MUST accept a power identifier field on skill configurations.
- **FR-009**: The API MUST validate that all skills sharing a power identifier also share the same termination event and the same trigger event.
- **FR-010**: Multiple composite powers on the same card MUST operate independently based on their distinct power identifiers and termination events.
- **FR-011**: Skills without a power identifier MUST behave identically to current behavior (full backwards compatibility).
- **FR-012**: Cleanup steps (buff_removed, targeting revert) MUST include the power identifier for client-side grouping.

### Key Entities

- **Power Identifier**: A string tag assigned to one or more skills on a card, indicating they belong to the same composite power. Used for lifecycle grouping and display grouping.
- **Targeting Override**: A temporary replacement of a card's base attack targeting strategy. Stores the original strategy for restoration. Bound to a termination event like other power effects.

## Assumptions

- The power identifier is purely a grouping mechanism — it does not introduce a new skill type or change how individual skills are triggered and executed.
- Unified cleanup is achieved by ensuring all skills in a group share the same `terminationEvent` / `endEvent`, leveraging the existing `EndEventProcessor` mechanism.
- Targeting strategy override is the only truly new effect type; buff, debuff, healing, and attack effects already exist and just need the power identifier tag.
- The power identifier is a free-form string chosen by the API consumer (game developer), not auto-generated.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A composite power grouping 3 existing skills activates all grouped effects and each fight log step carries the power identifier for client-side grouping.
- **SC-002**: 100% of effects tied to a composite power's termination event are removed when the power expires, with no residual state on the card.
- **SC-003**: Existing fights without power identifiers produce identical results (zero regression).
- **SC-004**: A targeting override reverts the card's attack targeting to original within the same turn the power expires.
- **SC-005**: The API rejects configurations where skills sharing a power identifier have mismatched termination events.
