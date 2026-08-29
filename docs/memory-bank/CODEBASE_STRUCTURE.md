---
name: codebase-structure
description: Project structure documentation
argument-hint: N/A
---

# Codebase Structure

## Root Structure

```
card-game/                  # Mono-repo root (pnpm 11 workspace)
├── packages/
│   ├── combat-engine/      # NestJS fight simulation backend
│   └── shared-types/       # Shared TypeScript types (stub)
├── clients/
│   ├── fight-replayer/     # Static HTML/JS fight replay viewer
│   └── gasha/              # SvelteKit arcade client (Phaser + Web renderer)
├── docs/                   # Documentation and memory bank
├── specs/                  # Feature specifications
├── .claude/                # Claude AI commands, configuration and templates
├── .github/                # GitHub workflows and CI/CD
├── pnpm-workspace.yaml     # pnpm workspace config
└── package.json            # Root workspace scripts
```

## Source Code Organization (`packages/combat-engine/src/`)

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

### Core Domain (`packages/combat-engine/src/fight/core/`)

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

#### Cards System (`packages/combat-engine/src/fight/core/cards/`)

```
cards/
├── fighting-card.ts        # Main card entity with stats and state
├── skills/                 # Card abilities
│   ├── simple-attack.ts    # Basic attack action
│   ├── multiple-attack.ts  # Multi-hit attack
│   ├── attack-skill.ts     # Base attack skill
│   ├── alteration-skill.ts # Stat alteration skill
│   ├── special.ts          # Ultimate abilities base class
│   ├── special-attack.ts   # Offensive ultimate (supports optional buff + shield application)
│   ├── special-healing.ts  # Healing ultimate
│   ├── skill.ts            # Event-triggered abilities + SkillKind enum (includes Shield)
│   ├── healing.ts          # Healing skill
│   ├── conditional-attack.ts  # Attack triggered conditionally by event
│   ├── targeting-override.ts  # Overrides card attack targeting strategy
│   ├── shield.ts           # SHIELD skill: health-reactive, edge-triggered on threshold cross
│   ├── reactive-skill.ts   # HealthReactiveSkill interface (isHealthReactive, onHealthChanged)
│   ├── survive.ts          # SurviveSkill: one-time fatal-blow interception; not a Skill implementor
│   └── power-id-consistency.ts  # Domain validation for composite power groups
├── behaviors/              # Card behavior patterns
│   ├── dodge-behaviors.ts  # Dodge behavior interface
│   ├── simple-dodge.ts     # Standard dodge implementation
│   └── random-dodge.ts     # Probabilistic dodge
├── damage/                 # Damage calculation engine
│   ├── damage-calculator.ts   # Multi-type damage computation
│   └── elemental-matrix.ts    # Element effectiveness multipliers (5x5 matrix)
└── @types/                 # Type definitions
    ├── action-result/      # Action outcome types
    │   ├── special-result.ts        # Unified result: { name, actionResults, buffResults }
    │   ├── attack-result.ts         # Includes remainingHealth snapshot + effects?: EffectResult[] + survived?: boolean + survivedSkillName?: string
    │   ├── named-attack-result.ts   # { name: string; results: AttackResult[] }
    │   ├── healing-result.ts
    │   ├── buff-results.ts
    │   └── shield-result.ts         # { target: CardInfo; shield: Shield }
    ├── attack/             # Attack and effect types (attack-effect.ts, attack-poison-effect.ts, attack-burn-effect.ts, attack-freeze-effect.ts, attack-stunt-effect.ts)
    │   └── conditions/     # Attack conditions (always-true-attack-condition.ts)
    ├── alteration/         # Buff/debuff discriminated union
    │   ├── alteration-detail.ts     # AlterationDetail = Buff | Debuff (polarity: 'buff' | 'debuff')
    │   ├── alteration-type.ts       # AlterationType enum
    │   ├── alteration-condition.ts  # Condition interface for conditional buff multipliers
    │   ├── buff-application.ts      # Applies buff with optional condition + multiplier
    │   └── conditions/              # Condition implementations (ally-presence-condition.ts)
    ├── shield/             # Shield types
    │   ├── shield.ts                # Shield value type: { points: number, duration: number }
    │   └── shield-application.ts    # Applies shield to targets via targeting strategy
    ├── skill-activation-conditions/  # Reactive skill activation conditions
    │   └── health-threshold-condition.ts  # HealthThresholdCondition: operator ('below'|'above') + threshold ratio
    ├── damage/             # Damage type definitions
    │   ├── damage-type.ts     # DamageType enum (PHYSICAL, FIRE, WATER, EARTH, AIR)
    │   ├── damage-composition.ts # Value object: type + rate pair
    │   └── element.ts         # Element enum for card affinity
    └── state/              # Card state types (card-state-frozen.ts, card-state-stunted.ts)
```

**Special Skills Pattern**: Both `SpecialAttack` and `SpecialHealing` implement the `Special` interface with a unified return type `SpecialResult` containing:
- `name`: Skill name (required)
- `actionResults`: Array of `AttackResult[]` or `HealingResult[]`
- `buffResults`: Array of buff applications (can be empty)

This allows special attacks to perform their primary action (damage/healing) while optionally applying buffs to a separate set of targets using independent targeting strategies.

**AlterationDetail Discriminated Union**: `Buff` and `Debuff` are members of `AlterationDetail` discriminated by `polarity: 'buff' | 'debuff'`. Both share `AlterationDetailBase` (type, value, duration, terminationEvent?, powerId?). Located in `@types/alteration/alteration-detail.ts` (not `@types/buff/`).

**Buff Type**: `Buff` has an optional `terminationEvent?: string` field. A buff with this set persists until the named event fires (instead of, or in addition to, a turn duration).

**Skill Lifecycle Pattern**: The `Skill` interface includes optional `tick?()` and `lifecycleEndEvent?()` methods. Skills with a finite `activationLimit` track their count via `tick()` and emit an `endEvent` string via `lifecycleEndEvent()` when exhausted. `SkillResults` carries an optional `endEvent` field so callers (`TurnManager`, `ActionStage`) can invoke `EndEventProcessor` to remove all matching event-bound buffs.

**Multi-Effect Attack Pattern**: `SimpleAttack` and `MultipleAttack` accept `effects?: AttackEffect[]`. Each effect is evaluated independently per hit; effects with `probability` roll a random check. `SpecialAttack` retains a single `effect?: AttackEffect`. `AttackResult.effects` is `EffectResult[]` to carry all applied effects per hit.

**STUNT State Pattern**: `CardStateStunted` (like `CardStateFrozen`) skips action and applies +20% incoming damage via `applyDamageRate()`. No damage tick. Skip condition: `card.frozenLevel > 0 || card.isStunted`. Does not stack — `StuntAttackEffect` returns early if defender is already frozen or stunted.

**Shield Mechanic**: `FightingCard` has an optional shield buffer (`applyShield(rate, duration)` computes `points = rate * maxHealth`). Damage first absorbs shield points before hitting health (`applyFinalDamage()` returns `{ damageToHealth, shieldAbsorbed }`). Shield breaks when points hit 0 → `shield_broken` step. `TurnManager` decrements shield duration each turn; reaching 0 → `shield_expired` step. Special skills can include a `shieldApplication?: ShieldApplicationDto` to apply shields post-action to a separate set of targets.

**SHIELD Skill Kind (Reactive)**: `ShieldSkill` implements `HealthReactiveSkill` (interface: `isHealthReactive: true`, `onHealthChanged(card): boolean`). It is edge-triggered: fires once when `card.healthRatio` crosses the `HealthThresholdCondition` threshold downward, then rearms when health goes back above. `OtherSkillDto.event` is **optional** — SHIELD kind has no trigger event. After each HP change, `triggerReactiveSkills()` (in `reactive-skill-checker.ts`) checks all `HealthReactiveSkill` instances on the damaged card and fires those that return `true` from `onHealthChanged()`.

#### Fight Simulator (`packages/combat-engine/src/fight/core/fight-simulator/`)

```
fight-simulator/
├── fight.ts                # Main fight orchestrator
├── turn-manager.ts         # Turn-end effects: buff/debuff duration, state effects, shield duration
├── action_stage.ts         # Action resolution (attacks, specials, healing); triggers reactive skills after HP changes
├── card-death-subscriber.ts # Card death event handling interface
├── death-skill-handler.ts  # Triggers ally-death skills on surviving cards; drainable steps
├── end-event-processor.ts  # Removes event-bound buffs when a skill end event fires; emits buff_removed steps
├── skill-results-to-steps.ts # Pure fn: SkillResults[] → Step[]; shared by ActionStage, TurnManager, DeathSkillHandler
├── reactive-skill-checker.ts # Pure fn: triggers HealthReactiveSkills after HP changes → ShieldSkillResults[]
├── card-selectors/         # Turn order strategies
│   ├── card-selector.ts    # Selector interface
│   ├── player-by-player.ts # Alternating player strategy
│   └── speed-weighted-card-pool.ts # Speed-based selection
└── @types/                 # Fight result types
    ├── fight-result.ts     # Complete fight outcome
    ├── step.ts             # Turn step recording (includes shield_applied, shield_broken, shield_expired)
    ├── action-report.ts    # Action reporting
    ├── attack-report.ts    # Attack details
    ├── healing-report.ts   # Healing details
    ├── buff-report.ts      # Buff application
    ├── buff-removed-report.ts # Event-bound buff removal
    ├── effect-removed-report.ts # Event-bound effect removal
    ├── debuff-report.ts    # Debuff application
    ├── state-effect-report.ts # Status effects
    ├── damage-report.ts    # Damage calculation
    ├── status-change-report.ts # Status changes
    ├── shield-report.ts    # ShieldAppliedReport, ShieldBrokenReport, ShieldExpiredReport
    ├── survived-report.ts  # SurvivedReport: { kind: 'survived', name, card }
    └── winner-report.ts    # Victory determination
```

#### Targeting Strategies (`packages/combat-engine/src/fight/core/targeting-card-strategies/`)

```
targeting-card-strategies/
├── targeting-card-strategy.ts # Strategy interface
├── targeted-from-position.ts  # Position-based targeting
├── targeted-all.ts            # Target all enemies
├── targeted-line-three.ts     # Line-of-three targeting
├── all-owner-cards.ts         # Target own cards
├── all-allies.ts              # Target all allies
├── launcher.ts                # Self-targeting
├── allied-card-by-id.ts       # Targets a specific ally by ID (returns [] if dead)
└── last-attacker-of-ally.ts   # Targets the last card that attacked a specific ally (returns [] if dead)
```

### HTTP API Layer (`packages/combat-engine/src/fight/http-api/`)

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

### Tools (`packages/combat-engine/src/fight/tools/`)

```
tools/
└── math-randomizer.ts      # Math.random() implementation
```

## Test Structure (`packages/combat-engine/test/`)

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
- @packages/combat-engine/package.json - Dependencies and scripts
- @packages/combat-engine/tsconfig.json - TypeScript compiler configuration
- @packages/combat-engine/tsconfig.build.json - Production build configuration
- @packages/combat-engine/nest-cli.json - NestJS CLI configuration

### Code Quality
- @packages/combat-engine/eslint.config.js - ESLint rules with TypeScript support
- @packages/combat-engine/.prettierrc - Code formatting (single quotes, trailing commas)

### Containerization
- @packages/combat-engine/Dockerfile - Multi-stage Docker build (Node 26 Alpine)

### CI/CD
- @.github/workflows/heroku.yml - Heroku deployment workflow

### AI Development
- `.claude/` - Claude AI integration
  - @.claude/CLAUDE.md - Project-specific Claude instructions
  - `commands/` - Claude command definitions
  - `templates/` - Memory bank and document templates
- @AGENTS.md - Cross-agent guidelines (repo overview, architecture boundaries, workflow) for AI coding agents other than Claude Code
- @.devcontainer/devcontainer.json - Dev container config so agents/contributors get a working repo environment out of the box

### Editor
- @.vscode/settings.json - VSCode workspace settings

## Gasha Client (`clients/gasha/`)

SvelteKit 2.x arcade client with Phaser 3 and Web renderer support.

```
clients/gasha/src/
├── app.html                    # HTML shell
├── routes/
│   ├── +layout.svelte          # Root layout
│   ├── +page.svelte            # Home page — links to Arcade Mode and Deck Builder
│   ├── arcade/
│   │   └── +page.svelte        # Arcade flow: fetch fight (uses selectedDeckCards), mount renderer, handle outcome
│   └── deck/
│       └── +page.svelte        # Deck Builder: browse roster, pick exactly 5 characters
└── lib/
    ├── arcade/                 # Arcade session state and data
    │   ├── session.ts          # Svelte writable store: phase, currentLevel, fightResult
    │   ├── levels.ts           # ARCADE_LEVELS: enemy decks per level
    │   └── types.ts            # CardConfig, EffectConfig, FightResult shared types
    ├── deck/                   # Player roster + selected deck (in-memory)
    │   ├── roster.ts           # CHARACTER_ROSTER (8 hard-coded cards), DEFAULT_DECK_IDS, findRosterCard()
    │   ├── deck-store.ts       # In-memory stores: selectedCardIds, selectedDeckCards, isDeckComplete; toggleCard(), resetDeck(), DECK_SIZE=5
    │   └── RosterCard.svelte   # Presentational card tile with selected/disabled state (built from Panel/Badge)
    ├── combat/                 # Fight rendering and engine integration
    │   ├── engine-client.ts    # fetchFight(): POST /fight → FightResult
    │   ├── outcome.ts          # detectOutcome(result, playerName): 'victory' | 'defeat'
    │   ├── rendererMode.ts     # getRendererMode(): reads ?mode query param; default = 'web'
    │   ├── combatStats.ts      # aggregateCombatStats(): per-card damageDealt/damageTaken/healingDone + winner from FightResult
    │   ├── CombatScene.ts      # Phaser 3 scene running the fight animation
    │   ├── PhaserRenderer.svelte      # Mounts Phaser.Game in a div; opt-in via ?mode=phaser
    │   └── CombatReportRenderer.svelte  # Default (?mode=web) — mobile-portrait combat report screen (per-card stats, dead cards grayed out); replaced WebRenderer.svelte
    ├── components/             # Shared UI components
    │   ├── VictoryScreen.svelte
    │   ├── LevelIndicator.svelte
    │   └── GameOverScreen.svelte
    └── design-system/          # Shared visual primitives/composites + design tokens
        ├── tokens.ts           # Design tokens (colors, spacing, etc.) + helpers (e.g. pct(), elementIndex())
        ├── tokens.css          # CSS custom properties
        ├── primitives/         # Button.svelte, Panel.svelte, Badge.svelte, StatBar.svelte, Overlay.svelte
        └── composites/         # CharacterCard.svelte (built from primitives)
```

### Dual Renderer Pattern

The arcade page supports two pluggable renderers selected at runtime via URL query param:

| URL param | Renderer | Description |
|-----------|----------|-------------|
| *(none)* | `CombatReportRenderer` | Default — mobile-portrait combat report (per-card damage/healing stats via `combatStats.ts`, dead cards grayed out) |
| `?mode=phaser` | `PhaserRenderer` | Full Phaser 3 animated combat scene |

`getRendererMode()` in `rendererMode.ts` reads `window.location.search`. SSR context returns `'phaser'` as a safe fallback (Phaser is lazy-imported on mount anyway). The arcade page conditionally renders one component:

```svelte
{#if rendererMode === 'web'}
  <CombatReportRenderer {fightResult} playerName="Player" playerCardIds={$selectedDeckCards.map((c) => c.id)} oncomplete={handleCombatComplete} />
{:else}
  <PhaserRenderer {fightResult} playerName="Player" oncomplete={handleCombatComplete} />
{/if}
```

`PhaserRenderer` and `CombatReportRenderer` no longer share an identical `Props` interface — `CombatReportRenderer` additionally requires `playerCardIds: string[]` to partition cards into player/enemy for stat aggregation.

### Navigation
Home page uses `<a href="/arcade" role="button">` (and `/deck`) instead of `<button onclick={goto}>` — avoids JS dependency for basic navigation.

### Deck Builder
`/deck` lets the player pick **exactly 5** characters from `CHARACTER_ROSTER` (8 hard-coded cards in `lib/deck/roster.ts`). The selection lives in the module-scoped `selectedCardIds` writable (`lib/deck/deck-store.ts`) — it persists across client-side navigation between menu/deck/arcade (like the `session` store) but **not** across a hard page reload (no `localStorage`). `toggleCard()` enforces the 5-card cap. Arcade Mode fights with `get(selectedDeckCards)` instead of the former hard-coded `PLAYER_TEAM` (removed with `lib/arcade/player-team.ts`). Default deck = first 5 roster ids, so Arcade works out of the box.

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
