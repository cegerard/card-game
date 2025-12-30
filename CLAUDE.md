# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a card game battle simulator built with NestJS. The application simulates turn-based fights between two players, each with a deck of fighting cards that have various stats, skills, and behaviors.

## Development Commands

### Building and Running

```bash
npm run build              # Build the project
npm run start              # Start in production mode
npm run start:dev          # Start in development mode with watch
npm run start:debug        # Start in debug mode with watch
```

### Testing

```bash
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests
npm run test:debug         # Run tests in debug mode
```

### Code Quality

```bash
npm run lint               # Run ESLint with auto-fix
npm run format             # Format code with Prettier
```

### Running Single Tests

To run a specific test file, use:

```bash
npm run test -- path/to/test.spec.ts
```

## Architecture

### Core Domain Structure (`src/fight/core/`)

The fight simulation logic is organized into several key components:

**Fight Simulator (`fight-simulator/`)**

- `Fight` class orchestrates the entire battle simulation
- `ActionStage` handles action resolution (attacks, specials, healing)
- `TurnManager` manages turn-end effects and buff/debuff duration
- `CardSelector` determines which cards act each turn (strategies: player-by-player, speed-weighted)

**Fighting Cards (`cards/`)**

- `FightingCard` is the main entity representing a card in battle
- Cards have base stats (attack, defense, health, speed, agility, accuracy, criticalChance)
- Cards maintain dynamic state (damage taken, healing received, special energy, buffs/debuffs)
- Cards have status effects (poisoned, burned, frozen) that affect them over time

**Skills System (`cards/skills/`)**

- `SimpleAttack`: Basic attack action
- `Special`: Ultimate abilities (attack or healing variants)
- `Skill`: Additional abilities triggered by events (e.g., healing on turn-end, buffs)
- Skills can have different triggers (`TriggerEvent`) and targeting strategies

**Targeting Strategies (`targeting-card-strategies/`)**

- Determine which cards are affected by a skill or attack
- Variants: position-based, target-all, line-three, all-owner-cards, all-allies, self

**Effects System**

- Attack effects: poison, burn, freeze (applied on hit)
- Status effects: Apply damage or restrictions each turn
- Buffs/Debuffs: Temporary stat modifications with duration

**Player (`player.ts`)**

- Manages a deck of fighting cards (1-5 cards per player)
- Tracks card ownership and provides access to playable/dead cards

### HTTP API Layer (`src/fight/http-api/`)

**FightController**

- Single endpoint: `POST /fight`
- Accepts `FightDataDto` with two players and their decks
- Converts DTOs to domain objects using factory functions
- Returns `FightResult`: step-by-step record of the entire fight

**Factory Functions**

- `targeting-strategy-factory.ts`: Maps targeting strategy enums to implementations
- `dodge-strategy-factory.ts`: Maps dodge behavior enums to implementations
- `trigger-factory.ts`: Maps trigger event enums to implementations

### Module Setup (`src/fight/`)

The `FightModule` provides the fight simulator as an injectable dependency using a factory pattern. The `Fight` class is constructed with players and a card selector strategy.

## Key Concepts

### Fight Flow

1. Cards are selected based on the chosen strategy (player-by-player or speed-weighted)
2. Non-frozen cards execute actions (special if ready, otherwise simple attack)
3. Turn-end effects are applied (status effects, buff/debuff duration, skill triggers)
4. Loop continues until one player's cards are all dead or 100 iterations pass
5. Winner is determined by total remaining health

### Card Stats and Modifiers

- Base stats are set at card creation and don't change
- `actual*` getters compute modified stats by applying buffs and debuffs
- Buffs increase stats temporarily, debuffs decrease them
- Both have duration and are decremented each turn

### Status Effects

- **Poison**: Deals damage over time
- **Burn**: Deals damage over time
- **Freeze**: Prevents action and increases damage taken
- Effects have levels (1-3) affecting their potency and duration

### Special Energy System

- Cards gain energy each turn when using simple attacks
- Energy threshold determines when special moves can be used
- Special moves reset energy to 0 after use

## Testing Strategy

Tests are located alongside source files in `__tests__` directories. The codebase uses Jest with extensive unit tests covering:

- Individual skills and their effects
- Status effect mechanics
- Targeting strategies
- Card selectors
- Full fight simulations (1v1, 2v2, 5v5)

Mock implementations (e.g., `fight-simulator-stub.ts`) are used for HTTP controller tests.

## Technologies

- Stack Node.js with NestJS
- Containerization with Docker

## Important Notes

- The codebase uses NestJS decorators and dependency injection
- DTOs use `class-validator` and `class-transformer` for validation
- Test coverage excludes module files, middleware, and main.ts (see package.json jest config)
- TypeScript strict mode is disabled (strictNullChecks, noImplicitAny set to false)

## Code Conventions

- Indentation : 2 spaces
- variable name : camelCase
