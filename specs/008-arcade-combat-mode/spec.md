# Feature Specification: Arcade Combat Mode

**Feature Branch**: `008-arcade-combat-mode`  
**Created**: 2026-05-31  
**Status**: Draft  
**Input**: User description: "Ajouter un premier mode de jeu (combat arcade): Mise en place du premier mode de jeu. Il s'agit d'un mode arcade où l'on affronte des équipes adverses. À chaque victoire, on grimpe d'un niveau. Dans la première version, la progression du joueur ne sera pas conservée. Le mode arcade se présente sous la forme d'un enchaînement de combats contre des adversaires de plus en plus forts. Le joueur sélectionne le mode arcade dans le menu. Ce mode de jeu fait partie d'une nouvelle application cliente à ajouter dans clients/gasha"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Start an Arcade Session from the Menu (Priority: P1)

A player opens the Gasha client and is presented with a main menu. They select the arcade mode option, which launches the arcade game flow and presents the first combat encounter.

**Why this priority**: This is the entry point. Without a menu and a way to start the arcade mode, nothing else can be reached or tested.

**Independent Test**: Can be fully tested by opening the Gasha client, clicking "Arcade Mode" in the menu, and verifying a combat encounter is presented.

**Acceptance Scenarios**:

1. **Given** a player opens the Gasha client, **When** they view the main menu, **Then** an arcade mode option is clearly visible and selectable.
2. **Given** a player is on the main menu, **When** they select arcade mode, **Then** they are taken to the first combat encounter of the arcade sequence.
3. **Given** a player is in the middle of an arcade session, **When** they navigate back to the main menu, **Then** the current session ends and they return to the menu (no persistence).

---

### User Story 2 - Fight and Progress Through Levels (Priority: P1)

A player enters a combat encounter. The combat plays out with animations. Upon winning, the player advances to the next level featuring a stronger enemy team.

**Why this priority**: This is the core gameplay loop. Progression through fights is the defining mechanic of the arcade mode.

**Independent Test**: Can be fully tested by starting an arcade session, completing one combat, and verifying that a new (harder) combat is presented afterwards.

**Acceptance Scenarios**:

1. **Given** a player is in a combat encounter, **When** the combat ends with the player winning, **Then** a victory screen is shown and the player advances to the next level.
2. **Given** a player has just won a combat, **When** they proceed to the next level, **Then** the enemy team is visibly stronger than the previous one.
3. **Given** a player is at level N, **When** they win, **Then** the displayed level counter increments to N+1.
4. **Given** a player reaches the final level and wins, **When** the last combat ends, **Then** a final victory screen is shown before returning to the main menu.

---

### User Story 3 - Lose a Combat and Return to Menu (Priority: P2)

A player loses a combat during an arcade session. The session ends immediately, a game over screen is shown, and the player can return to the main menu without any saved progress.

**Why this priority**: Loss handling is essential for a complete game loop. Without it, the arcade mode has no meaningful stakes.

**Independent Test**: Can be tested by starting an arcade session, losing the first combat, and verifying the game over screen appears with a return-to-menu option.

**Acceptance Scenarios**:

1. **Given** a player is in a combat encounter, **When** all player cards are defeated, **Then** a game over screen is displayed.
2. **Given** the game over screen is displayed, **When** the player selects "return to menu", **Then** they are taken back to the main menu with no session data retained.
3. **Given** a player starts a new arcade session after a previous loss, **When** they enter the first combat, **Then** they always start at level 1 (no persistence from previous session).

---

### User Story 4 - View Current Arcade Level (Priority: P3)

During the arcade session, the player can see which level they are currently on, giving them a sense of progression and how far they have advanced.

**Why this priority**: Contextual information about progression enhances the gameplay experience, but the game is functional without it.

**Independent Test**: Can be tested by starting an arcade session, winning the first combat, and verifying the level indicator updates to reflect the new level.

**Acceptance Scenarios**:

1. **Given** a player starts an arcade session, **When** they are on the first combat, **Then** the current level (e.g., "Level 1") is displayed on screen.
2. **Given** a player has won two combats, **When** they are in the third combat, **Then** the level indicator shows level 3.

---

### Edge Cases

- What happens if the combat engine returns an error during a fight?
  - The session ends gracefully and the player is returned to the main menu with an error notification.
- What happens if the player refreshes the page mid-combat?
  - The session is lost (no persistence in v1); the player returns to the main menu on reload.
- What happens when the player wins the last defined level?
  - A final victory screen is displayed; the session ends and the player returns to the main menu.
- What if a combat results in a draw (both teams eliminated simultaneously)?
  - Counts as a loss for the player; game over screen is shown.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The Gasha client MUST present a main menu with an arcade mode entry point.
- **FR-002**: The arcade mode MUST consist of a sequence of combat encounters against progressively stronger enemy teams.
- **FR-003**: Each combat victory MUST advance the player to the next level.
- **FR-004**: The system MUST display the current level number to the player throughout the arcade session.
- **FR-005**: When all player cards are defeated, the arcade session MUST end and display a game over screen.
- **FR-006**: The game over screen MUST offer the player an option to return to the main menu.
- **FR-007**: The system MUST NOT persist any arcade session progress between sessions (v1 constraint).
- **FR-008**: Each new arcade session MUST start at level 1, regardless of prior sessions.
- **FR-009**: Enemy teams MUST increase in difficulty with each level (higher stats or more effective card configurations).
- **FR-010**: Combat encounters MUST be animated, leveraging the existing battle simulation engine for fight resolution.
- **FR-011**: Upon winning the final level, a final victory screen MUST be displayed before returning to the main menu.
- **FR-012**: In v1, the player MUST use a single predefined default team for all arcade combats (no deck selection or collection management). Team selection is explicitly deferred to a future version.
- **FR-013**: The arcade mode MUST define at least 5 distinct enemy levels with increasing difficulty.
- **FR-014**: A combat draw (simultaneous defeat) MUST be treated as a player loss.

### Key Entities

- **Arcade Session**: The current in-memory gameplay state. Tracks the current level index. Not persisted between sessions.
- **Level**: A stage in the arcade sequence. Each level defines a specific enemy team configuration and a difficulty tier.
- **Enemy Team**: A set of fighting cards configured as opponents for a specific level. Stats and skills scale with the level number.
- **Player Team**: The fixed set of fighting cards the player uses throughout the arcade session (predefined for v1).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A player can access the arcade mode from the main menu in 2 interactions or fewer.
- **SC-002**: A complete arcade session (start → game over or final victory) is playable end-to-end without errors.
- **SC-003**: Enemy difficulty is perceptibly higher between each level — verifiable by comparing total enemy health and stats across consecutive levels.
- **SC-004**: Combat animations play without visible lag or interruption on a standard desktop browser.
- **SC-005**: The transition between combat result (victory/game over) and the next screen completes in under 3 seconds.
- **SC-006**: Starting a new arcade session after a previous one always begins at level 1 with a completely fresh state.

## Assumptions

- The Gasha client (`clients/gasha`) does not yet exist and will be created as a new application for this feature.
- The battle simulation engine (`packages/combat-engine`) is used as-is via its existing REST API; no changes to combat logic are required.
- The player team is predefined and fixed for v1 — no card selection or collection management UI is in scope.
- A minimum of 5 levels are defined with hand-crafted enemy team configurations.
- The architectural choice of a hybrid SvelteKit + Phaser 3 client is a confirmed team design decision and not subject to this specification.
- "Stronger" enemy teams means higher base stats; advanced skill configurations may be introduced in later versions.
- No authentication or user accounts are required in v1.
- The client communicates with the combat engine over HTTP, consistent with existing client integrations.
