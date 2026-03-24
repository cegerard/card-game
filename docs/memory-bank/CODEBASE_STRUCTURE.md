---
name: codebase-structure
description: Project structure documentation
argument-hint: N/A
---

# Codebase Structure

## Root Structure

```
card-game/
├── src/                    # Application source code
├── test/                   # End-to-end tests
├── doc/                    # Documentation and diagrams
├── samples/                # Sample JSON files (cards, payloads, results)
├── .aidd/                  # AI-driven development configuration
├── .claude/                # Claude AI commands and configuration
├── .github/                # GitHub workflows and CI/CD
├── .vscode/                # VSCode editor settings
└── dist/                   # Compiled output (generated)
```

## Source Code Organization (`src/`)

```
src/
├── main.ts                 # Application entry point with NestJS bootstrap
├── app.module.ts           # Root NestJS module
├── logger-middleware.ts    # Request logging middleware
└── fight/                  # Fight simulation feature module
    ├── fight.module.ts     # Fight feature module configuration
    ├── core/               # Domain logic and business rules
    ├── http-api/           # REST API layer
    └── tools/              # Shared utilities
```

### Core Domain (`src/fight/core/`)

Domain-driven design structure containing all fight simulation logic:

```
core/
├── player.ts               # Player entity managing card decks
├── randomizer.ts           # Randomization abstraction
├── cards/                  # Fighting card entities and types
├── card-action/            # Action resolution logic
├── fight-simulator/        # Fight orchestration and simulation
├── targeting-card-strategies/  # Skill targeting implementations
├── trigger/                # Event trigger system
└── __tests__/              # Core domain tests
```

#### Cards System (`src/fight/core/cards/`)

```
cards/
├── fighting-card.ts        # Main card entity with stats and state
├── skills/                 # Card abilities
│   ├── simple-attack.ts    # Basic attack action
│   ├── special.ts          # Ultimate abilities base class
│   ├── special-attack.ts   # Offensive ultimate (supports optional buff application)
│   ├── special-healing.ts  # Healing ultimate
│   ├── skill.ts            # Event-triggered abilities
│   ├── healing.ts          # Healing skill
│   ├── buff-skill.ts       # Buff application skill
│   └── debuff-skill.ts     # Debuff application skill
├── behaviors/              # Card behavior patterns
│   ├── dodge-behaviors.ts  # Dodge behavior interface
│   ├── simple-dodge.ts     # Standard dodge implementation
│   └── random-dodge.ts     # Probabilistic dodge
├── damage/                 # Damage calculation engine
│   ├── damage-calculator.ts   # Multi-type damage computation
│   └── elemental-matrix.ts    # Element effectiveness multipliers (5x5 matrix)
└── @types/                 # Type definitions
    ├── action-result/      # Action outcome types
    │   ├── special-result.ts # Unified result: { actionResults, buffResults }
    │   ├── attack-result.ts
    │   ├── healing-result.ts
    │   └── buff-results.ts
    ├── attack/             # Attack and effect types
    ├── buff/               # Buff/debuff types
    │   ├── buff-application.ts  # Applies buff with optional condition + multiplier
    │   ├── buff-condition.ts    # BuffCondition interface (id, evaluate())
    │   └── conditions/          # Condition implementations
    │       └── ally-presence-condition.ts  # True if named ally is alive
    ├── damage/             # Damage type definitions
    │   ├── damage-type.ts     # DamageType enum (PHYSICAL, FIRE, WATER, EARTH, AIR)
    │   ├── damage-composition.ts # Value object: type + rate pair
    │   └── element.ts         # Element enum for card affinity
    └── state/              # Card state types
```

**Special Skills Pattern**: Both `SpecialAttack` and `SpecialHealing` implement the `Special` interface with a unified return type `SpecialResult` containing:
- `actionResults`: Array of `AttackResult[]` or `HealingResult[]`
- `buffResults`: Array of buff applications (can be empty)

This allows special attacks to perform their primary action (damage/healing) while optionally applying buffs to a separate set of targets using independent targeting strategies.

**Buff Type**: `Buff` has an optional `terminationEvent?: string` field. A buff with this set persists until the named event fires (instead of, or in addition to, a turn duration).

**Skill Lifecycle Pattern**: The `Skill` interface includes optional `tick?()` and `lifecycleEndEvent?()` methods. Skills with a finite `activationLimit` track their count via `tick()` and emit an `endEvent` string via `lifecycleEndEvent()` when exhausted. `SkillResults` carries an optional `endEvent` field so callers (`TurnManager`, `ActionStage`) can invoke `EndEventProcessor` to remove all matching event-bound buffs.

#### Fight Simulator (`src/fight/core/fight-simulator/`)

```
fight-simulator/
├── fight.ts                # Main fight orchestrator
├── turn-manager.ts         # Turn-end effects and buff/debuff management
├── action_stage.ts         # Action resolution (attacks, specials, healing)
├── card-death-subscriber.ts # Card death event handling interface
├── death-skill-handler.ts  # Triggers ally-death skills on surviving cards; drainable steps
├── end-event-processor.ts  # Removes event-bound buffs when a skill end event fires; emits buff_removed steps
├── card-selectors/         # Turn order strategies
│   ├── card-selector.ts    # Selector interface
│   ├── player-by-player.ts # Alternating player strategy
│   └── speed-weighted-card-pool.ts # Speed-based selection
└── @types/                 # Fight result types
    ├── fight-result.ts     # Complete fight outcome
    ├── step.ts             # Turn step recording
    ├── action-report.ts    # Action reporting
    ├── attack-report.ts    # Attack details
    ├── healing-report.ts   # Healing details
    ├── buff-report.ts      # Buff application
    ├── buff-removed-report.ts # Event-bound buff removal
    ├── debuff-report.ts    # Debuff application
    ├── state-effect-report.ts # Status effects
    ├── damage-report.ts    # Damage calculation
    ├── status-change-report.ts # Status changes
    └── winner-report.ts    # Victory determination
```

#### Targeting Strategies (`src/fight/core/targeting-card-strategies/`)

```
targeting-card-strategies/
├── targeting-card-strategy.ts # Strategy interface
├── targeted-from-position.ts  # Position-based targeting
├── targeted-all.ts            # Target all enemies
├── targeted-line-three.ts     # Line-of-three targeting
├── all-owner-cards.ts         # Target own cards
├── all-allies.ts              # Target all allies
└── launcher.ts                # Self-targeting
```

### HTTP API Layer (`src/fight/http-api/`)

```
http-api/
├── fight.controller.ts     # REST endpoint (POST /fight)
├── dto/                    # Data transfer objects
│   └── fight-data.dto.ts   # Fight request validation
├── dodge-strategy-factory.ts # DTO to dodge behavior mapper
├── targeting-strategy-factory.ts # DTO to targeting strategy mapper
├── trigger-factory.ts      # DTO to trigger event mapper
└── buff-condition-factory.ts # BuffConditionType enum → BuffCondition instance
```

### Tools (`src/fight/tools/`)

```
tools/
└── math-randomizer.ts      # Math.random() implementation
```

## Test Structure (`test/`)

End-to-end tests organized by feature:

```
test/
├── jest-e2e.json           # E2E test configuration
├── fight/                  # Fight simulation E2E tests
└── helpers/                # Test helper utilities
```

Unit tests are colocated with source files in `__tests__/` directories.

## Configuration Files

### Build & Runtime
- @package.json - Dependencies and scripts
- @tsconfig.json - TypeScript compiler configuration
- @tsconfig.build.json - Production build configuration
- @nest-cli.json - NestJS CLI configuration

### Code Quality
- @.eslintrc.js - ESLint rules with TypeScript support
- @.prettierrc - Code formatting (single quotes, trailing commas)

### Containerization
- @Dockerfile - Multi-stage Docker build (Node 20 Alpine)

### CI/CD
- @.github/workflows/heroku.yml - Heroku deployment workflow

### AI Development
- `.aidd/` - AI-driven development prompts and templates
  - `prompts/` - Categorized AI prompts (00-10 numbered categories)
  - `templates/` - Memory bank and document templates
  - `agents/` - Custom agent configurations
- `.claude/` - Claude AI integration
  - @.claude/CLAUDE.md - Project-specific Claude instructions
  - `commands/` - Claude command definitions

### Editor
- @.vscode/settings.json - VSCode workspace settings

## Key Patterns

### Module Organization
- Feature-based modules (fight module)
- Domain logic separated from HTTP layer
- Factory pattern for DTO-to-domain conversion

### Testing
- Unit tests colocated with source (`__tests__/` directories)
- E2E tests in separate `test/` directory
- Jest configuration with coverage exclusions (modules, middleware, main)

### Type System
- `@types/` directories for domain type definitions
- Organized by concept (action-result, attack, buff, state)
- TypeScript with strict mode disabled (strictNullChecks, noImplicitAny off)

### Dependency Injection
- NestJS modules and providers
- Factory providers for fight simulator
- Injectable services and controllers
