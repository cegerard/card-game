# Card Game Battle Simulator

A turn-based card battle simulation engine built with NestJS. The system exposes a REST API that accepts battle configurations and returns complete, step-by-step fight logs covering every action, damage calculation, buff, and status effect.

## What it does

Two players, each with a deck of 1 to 5 fighting cards, are pitted against each other. The simulator resolves the full battle turn by turn and returns the detailed log. It is designed to be consumed by a game client that handles rendering and display.

```
POST /fight → complete fight log (JSON)
```

## Features

- Multi-card decks (1–5 cards per player)
- Two turn-order strategies: player-by-player or speed-weighted
- Simple attacks with multi-type damage (e.g. 70% physical + 30% fire)
- Multi-hit attacks with optional combo finisher and amplifier
- Special abilities (attack or healing variants) triggered by energy accumulation
- Elemental matrix: 5 elements × 5 damage types, affecting damage multipliers
- Status effects applied on hit: poison, burn, freeze (3 intensity levels), with optional triggered debuff on hit
- Buffs and debuffs with duration tracking, including conditional buff multipliers
- Event-bound buff and effect termination: buffs/effects tied to a named event are removed when the event fires
- Passive skills triggered at turn end, on next action, or on death events (ally-death, enemy-death)
- Conditional attack skills triggered by events, with interval and hit configuration
- Targeting override skills that redirect a card's attack to a specific target, removed by end event
- Dormant trigger: skills start inactive and activate mid-battle when a trigger event fires
- Composite powers (powerId): group multiple skills to share lifecycle and termination
- Multiple targeting strategies: position-based, all enemies, line-of-three, all allies, self, targeted-card
- Dodge behaviors: simple (agility-based) or random
- Battle time limit of 100 iterations with winner decided on remaining health

## Tech stack

| Layer            | Technology                           |
| ---------------- | ------------------------------------ |
| Runtime          | Node.js 24                           |
| Framework        | NestJS 11                            |
| Language         | TypeScript                           |
| Testing          | Jest 29, Supertest, @faker-js/faker  |
| Containerization | Docker (multi-stage, Node 24 Alpine) |
| CI/CD            | GitHub Actions → Heroku              |

## Getting started

### Prerequisites

- Node.js 24+
- npm

### Installation

```bash
npm install
```

### Running locally

```bash
# Development (watch mode)
npm run start:dev

# Production mode
npm run start
```

The server starts on `http://localhost:3000` by default. Override with the `PORT` environment variable.

### Running with Docker

```bash
docker build -t card-game .
docker run -p 3000:3000 card-game
```

## API

### `POST /fight`

Simulates a complete battle between two players.

**Request body**

```json
{
  "player1": {
    "name": "Alice",
    "deck": [
      /* 1–5 FightingCardDto */
    ]
  },
  "player2": {
    "name": "Bob",
    "deck": [
      /* 1–5 FightingCardDto */
    ]
  },
  "cardSelectorStrategy": "player-by-player"
}
```

**`cardSelectorStrategy`** values:

- `player-by-player` — cards alternate between the two players
- `speed-weighted` — cards act based on speed stat probability

**`FightingCardDto`**

```json
{
  "id": "sword-1",
  "name": "Sword",
  "attack": 25000,
  "defense": 6000,
  "health": 90000,
  "speed": 28,
  "agility": 10,
  "accuracy": 90,
  "criticalChance": 0.04,
  "element": "PHYSICAL",
  "skills": {
    "special": {
      "kind": "ATTACK",
      "name": "Double Strike",
      "rate": 2,
      "energy": 40,
      "targetingStrategy": "position-based",
      "effect": { "type": "BURN", "rate": 0.5, "level": 2 },
      "buffApplication": [
        {
          "type": "attack",
          "rate": 1.2,
          "duration": 2,
          "targetingStrategy": "all-allies"
        }
      ]
    },
    "simpleAttack": {
      "name": "Quick Slash",
      "damages": [
        { "type": "PHYSICAL", "rate": 0.7 },
        { "type": "FIRE", "rate": 0.3 }
      ],
      "targetingStrategy": "position-based"
    },
    "others": [
      {
        "kind": "BUFF",
        "name": "Rally",
        "rate": 1.1,
        "targetingStrategy": "self",
        "event": "turn-end",
        "buffType": "defense",
        "duration": 3
      }
    ]
  },
  "behaviors": {
    "dodge": "simple-dodge"
  }
}
```

Note: provide exactly one of `simpleAttack` or `multipleAttack` in `skills`.

**`multipleAttack`** (alternative to `simpleAttack`):

```json
{
  "name": "Rapid Flurry",
  "hits": 3,
  "damages": [{ "type": "PHYSICAL", "rate": 1.0 }],
  "targetingStrategy": "position-based",
  "amplifier": 1.1,
  "comboFinisher": [{ "type": "FIRE", "rate": 2.0 }]
}
```

**Enums**

| Field                       | Values                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `element`                   | `PHYSICAL`, `FIRE`, `WATER`, `EARTH`, `AIR`                                                         |
| `damages[].type`            | `PHYSICAL`, `FIRE`, `WATER`, `EARTH`, `AIR`                                                         |
| `special.kind`              | `ATTACK`, `HEALING`                                                                                 |
| `others[].kind`             | `HEALING`, `BUFF`, `DEBUFF`, `CONDITIONAL_ATTACK`, `TARGETING_OVERRIDE`                             |
| `others[].event`            | `turn-end`, `next-action`, `ally-death`, `enemy-death`, `dormant`                                   |
| `targetingStrategy`         | `position-based`, `target-all`, `line-three`, `all-owner-cards`, `all-allies`, `self`, `targeted-card` |
| `behaviors.dodge`           | `simple-dodge`, `random-dodge`                                                                      |
| `effect.type`               | `POISON`, `BURN`, `FREEZE`                                                                          |
| `effect.level`              | `1`, `2`, `3`                                                                                       |
| `buffApplication[].type`    | `attack`, `defense`, `agility`, `accuracy`                                                          |

**`others[].event` notes:**

- `ally-death` / `enemy-death` — requires `targetCardId` matching the card `id` whose death triggers the skill
- `dormant` — requires `activationEvent`, `activationTargetCardId`, and `replacementEvent`; the skill starts inactive and activates when the activation event fires

**`others[]` optional fields:**

| Field                    | Applies to                                    | Description                                                               |
| ------------------------ | --------------------------------------------- | ------------------------------------------------------------------------- |
| `terminationEvent`       | `BUFF`, `DEBUFF`, `TARGETING_OVERRIDE`        | Named event that removes this skill's effect when fired                   |
| `activationLimit`        | any                                           | Max activations before lifecycle ends (≥ 1)                               |
| `endEvent`               | any                                           | Event emitted when activation limit is reached                            |
| `powerId`                | any                                           | Groups multiple skills as a composite power (must share event + terminationEvent) |
| `activationCondition`    | any                                           | Condition that must be met for the skill to activate                      |

**Response**

A `FightResult` object: a map of step number to step detail. Each step has a `kind` field:

```
attack | special_attack | healing | status_change | state_effect | buff | debuff |
buff_removed | effect_removed | targeting_override | targeting_reverted | winner | fight_end
```

| Step kind            | Description                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| `attack`             | A card performs a basic attack                                                         |
| `special_attack`     | A card uses its special ability                                                        |
| `healing`            | A card heals itself or an ally                                                         |
| `status_change`      | A status effect (poison/burn/freeze) is applied to a card                              |
| `state_effect`       | A status effect deals damage at turn end                                               |
| `buff`               | A buff is applied to a card                                                            |
| `debuff`             | A debuff is applied to a card                                                          |
| `buff_removed`       | An event-bound buff is removed when its termination event fires                        |
| `effect_removed`     | An event-bound status effect is removed when its termination event fires               |
| `targeting_override` | A targeting override skill activates, redirecting the card's attacks                   |
| `targeting_reverted` | A targeting override is removed when its termination event fires                       |
| `winner`             | Battle result with winning player                                                      |
| `fight_end`          | Battle ended (time limit reached or all cards defeated)                                |

**Error responses**

- `400 Bad Request` — validation failure (invalid enum, missing required field, deck size out of bounds, etc.)
- `500 Internal Server Error` — unexpected runtime error

## Architecture

The project follows a hexagonal architecture. Domain logic lives in `src/fight/core/` and is completely decoupled from the HTTP layer in `src/fight/http-api/`.

```
src/
├── main.ts
├── app.module.ts
└── fight/
    ├── fight.module.ts
    ├── core/                        # Pure domain logic
    │   ├── player.ts
    │   ├── cards/
    │   │   ├── fighting-card.ts     # Card entity (stats, state, buffs, skills)
    │   │   ├── skills/              # SimpleAttack, MultipleAttack, Special, Skill (buff/heal/conditional/override)
    │   │   ├── behaviors/           # Dodge strategies
    │   │   └── damage/              # DamageCalculator + ElementalMatrix
    │   ├── fight-simulator/
    │   │   ├── fight.ts             # Main orchestrator
    │   │   ├── action_stage.ts      # Attack/special/heal resolution
    │   │   ├── turn-manager.ts      # Turn-end effects, buff duration
    │   │   ├── death-skill-handler.ts  # Fires ally/enemy-death skills on card death
    │   │   ├── end-event-processor.ts  # Removes event-bound buffs/effects when end event fires
    │   │   └── card-selectors/      # Turn order strategies
    │   ├── targeting-card-strategies/
    │   └── trigger/                 # Trigger system (turn-end, death, dynamic/dormant)
    └── http-api/                    # HTTP adapter
        ├── fight.controller.ts      # POST /fight
        ├── dto/                     # Validated request DTOs
        └── *-factory.ts             # DTO enum → domain object mappers
```

### Fight flow

1. The controller validates the request, converts DTOs to domain objects, and builds a `Fight` instance.
2. `Fight.start()` loops until a winner is found or 100 iterations are reached:
   - `CardSelector.nextCards()` picks which cards act this turn.
   - `ActionStage` resolves each non-frozen card's action (special if energy is ready, otherwise simple/multiple attack) and applies damage/healing to targets. Card deaths trigger `DeathSkillHandler`, which fires `ally-death` and `enemy-death` skills on surviving cards.
   - `TurnManager` processes turn-end: decrements buff/debuff durations, triggers passive skills, applies status effect damage (poison, burn, freeze). Deaths here also go through `DeathSkillHandler`.
3. `EndEventProcessor` removes event-bound buffs and status effects whenever a skill lifecycle ends.
4. The winner is the player with the highest total remaining health.

### Key design patterns

- **Strategy** — card selection, targeting, dodge behavior
- **Factory** — DTO-to-domain conversion, NestJS injectable fight builder
- **Observer** — `CardDeathSubscriber` for card death events (`DeathSkillHandler`)
- **Rich domain model** — `FightingCard` encapsulates all stat computation via `actual*` getters
- **Event-driven skills** — triggered by `turn-end`, `next-action`, `ally-death:<id>`, `enemy-death:<id>`
- **Dynamic trigger** — `DynamicTrigger` wraps a dormant skill that activates mid-battle on a specified event

## Testing

Unit tests are colocated with source files in `__tests__/` directories. End-to-end tests live in `test/`.

```bash
# All unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# End-to-end tests
npm run test:e2e

# Single test file
npm run test -- src/fight/core/__tests__/my-test.spec.ts
```

**Conventions:** one `expect` per `it` block, max 10 lines per `it` block.

## Code quality

```bash
npm run format    # Prettier
npm run lint      # ESLint with auto-fix
npm run test:cov  # Tests with coverage
npm run build     # Compile TypeScript
```

- ESLint with `@typescript-eslint/recommended`
- Prettier: single quotes, trailing commas
- Unused variables must use the `_` prefix

## Deployment

Pushes to `main` trigger a GitHub Actions workflow that builds a Docker image and deploys it to Heroku via the Container Registry.

Required GitHub secrets: `HEROKU_EMAIL`, `HEROKU_API_KEY`, `HEROKU_APP_NAME`.

The application reads `process.env.PORT` at startup (Heroku sets this automatically).
