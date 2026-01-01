---
name: database
description: Database schema and management
argument-hint: N/A
---

# Database

This project does NOT use a database.

## Architecture

The application is a stateless battle simulator that operates entirely in-memory:

- Fight simulations are processed on-demand via HTTP API (`POST /fight`)
- All game state exists only during request processing
- No data persistence between requests
- DTOs are converted to domain objects, fight is simulated, results are returned

## Data Flow

1. Client sends `FightDataDto` with player decks
2. Factory functions convert DTOs to domain objects (`FightingCard`, `Player`, `Skill`)
3. `Fight` simulator processes battle in-memory
4. `FightResult` with step-by-step actions is returned
5. All objects are garbage collected after response

## Future Considerations

If database support is needed, consider:

- Player/deck persistence (user accounts)
- Fight history/replays
- Card collection management
- Leaderboards/statistics
