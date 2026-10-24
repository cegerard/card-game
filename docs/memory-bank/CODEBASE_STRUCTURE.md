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
│   ├── fight-replayer/     # Static HTML/JS fight replay viewer (Vitest on the parser)
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
│   ├── special-attack.ts   # Offensive ultimate (optional hits, buff + shield application)
│   ├── special-healing.ts  # Healing ultimate
│   ├── special-stance.ts   # Special that strikes nobody: stance + alterations + shield + optional concealment of the caster
│   ├── skill.ts            # Event-triggered abilities + SkillKind enum (includes Shield)
│   ├── healing.ts          # Healing skill
│   ├── heal-basis.ts       # applyHealing(), shared with SpecialHealing; reads RateBasis ('source-attack' | 'target-max-health', @types/rate-basis.ts, shared with BLEED)
│   ├── conditional-attack.ts  # Attack triggered conditionally by event
│   ├── targeting-override.ts  # Overrides card attack targeting strategy
│   ├── shield.ts           # SHIELD skill: health-reactive, edge-triggered on threshold cross
│   ├── protection.ts       # PROTECTION skill: guardian steps in front of one ally; attacks aimed at it hit the guardian
│   ├── reactive-skill.ts   # HealthReactiveSkill interface (isHealthReactive, onHealthChanged)
│   ├── survive.ts          # SurviveSkill: one-time fatal-blow interception; not a Skill implementor
│   ├── damage-reduction.ts # DamageReductionSkill: removes a share of each incoming hit; not a Skill implementor
│   ├── dodge-bonus-denial.ts # DodgeBonusDenialSkill: a bleeding defender dodges its owner without agility buffs; not a Skill implementor
│   ├── bleed-stack-scaling.ts    # BleedStackScalingSkill: attack bonus per bleed stack on the board, read through FightingCard.attackPower(); not a Skill implementor
│   ├── low-health-target-bonus.ts # LowHealthTargetBonusSkill: attack bonus against a defender under a health ratio, read through FightingCard.attackPower(context, defender); not a Skill implementor
│   ├── bleed-empowerment.ts # BleedEmpowermentSkill: extra stacks and a higher rate for its owner bleeds while a stance runs; not a Skill implementor
│   ├── bleed-explosion.ts  # BleedExplosionSkill (BLEED_DETONATION): every bleeding card takes a share of the source attack as real damage and loses its stacks
│   ├── buff-transfer.ts    # BuffTransferSkill: hands its owner buffs of one type, value, duration and stack pile kept, to the first card its targeting returns
│   ├── stance.ts           # StanceSkill: opens a stance on its owner when its event fires
│   ├── concealment.ts      # ConcealmentSkill: hides its owner from every enemy targeting until it attacks (or its duration runs out)
│   ├── concealment-duration.ts # assertConcealmentDuration(): a concealment lasts a non-negative integer of turns, or until its owner attacks
│   ├── transformation.ts   # TransformationSkill: one-shot health-reactive transformation
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
    ├── attack/             # Attack and effect types (attack-effect.ts, attack-poison-effect.ts, attack-burn-effect.ts, attack-freeze-effect.ts, attack-stunt-effect.ts, attack-mark-effect.ts, attack-bleed-effect.ts, damage-type-bonus.ts (base of bleed-stack-bonus.ts and concealed-bonus.ts), bleed-stack-bonus.ts, concealed-bonus.ts, energy-refund.ts, bleed-detonation.ts, splash.ts, low-health-debuff.ts, hit-alterations.ts, execution.ts)
    │   └── conditions/     # Attack conditions (always-true-attack-condition.ts)
    ├── alteration/         # Buff/debuff discriminated union
    │   ├── alteration-detail.ts     # AlterationDetail = Buff | Debuff (polarity: 'buff' | 'debuff')
    │   ├── alteration-type.ts       # AlterationType enum
    │   ├── alteration-condition.ts  # Condition interface for conditional buff multipliers
    │   ├── buff-application.ts      # Applies buff with optional condition + multiplier
    │   └── conditions/              # Condition implementations (ally-presence-condition.ts, health-threshold-condition.ts, probability-condition.ts)
    ├── mark/              # Elemental mark types
    │   ├── elemental-mark.ts        # ElementalMark: damageType + ratePerStack + maxStacks (cumulative, never expires)
    │   └── marked-target-bonus.ts   # MarkedTargetBonus: damage multiplier when the defender already carries a mark
    ├── shield/             # Shield types
    │   ├── shield.ts                # Shield value type: { points: number, duration: number }
    │   └── shield-application.ts    # Applies shield to targets via targeting strategy
    ├── stance/             # Stance types
    │   └── stance.ts                # Stance: name + remainingTurns + granted status immunities; StanceActivation
    ├── concealment/        # Concealment types
    │   └── concealment.ts           # Concealment: name + optional remainingTurns (none = until the card attacks)
    ├── skill-activation-conditions/  # Reactive skill activation conditions
    │   └── health-threshold-condition.ts  # HealthThresholdCondition: operator ('below'|'above') + threshold ratio
    ├── damage/             # Damage type definitions
    │   ├── damage-type.ts     # DamageType enum (PHYSICAL, FIRE, WATER, EARTH, AIR)
    │   ├── damage-composition.ts # Value object: type + rate pair
    │   └── element.ts         # Element enum for card affinity
    └── state/              # Card state types (card-state-frozen.ts, card-state-stunted.ts, card-state-bleeding.ts) + status-category.ts (control vs damage-over-time)
```

Mechanics (special results, alterations, stances, bleed, shield, protection, death cascade…) are described once, in [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md).

#### Fight Simulator (`packages/combat-engine/src/fight/core/fight-simulator/`)

```
fight-simulator/
├── fight.ts                # Main fight orchestrator
├── turn-manager.ts         # Turn-end effects: buff/debuff duration, regeneration, state effects, shield duration
├── action_stage.ts         # Action resolution (attacks, specials, healing); triggers reactive skills after HP changes; dispatches damage-taken + ally-health events
├── card-death-subscriber.ts # Card death event handling interface
├── death-skill-handler.ts  # Triggers ally-death skills on surviving cards; drainable steps
├── end-event-processor.ts  # Removes event-bound buffs when a skill end event fires; emits buff_removed steps
├── skill-results-to-steps.ts # Pure fn: SkillResults[] → Step[]; shared by ActionStage, TurnManager, DeathSkillHandler
├── effect-results-to-steps.ts # Pure fn: EffectResult[] → Step[] (mark_applied vs status_change + triggered debuff); shared by ActionStage and skillResultsToSteps
├── reactive-skill-checker.ts # Pure fn: triggers HealthReactiveSkills after HP changes → ShieldSkillResults[]
├── concealment-steps.ts    # revealAttacker() + concealmentEndedReport(): ends a concealment and reports it
├── stance-steps.ts         # stanceStartedReport() + stanceEndedReport(): report a stance opened or closed, shared by ActionStage and TurnManager
├── execution-steps.ts      # executionSteps(): an executed step per defender, then survived when SURVIVE held
├── card-selectors/         # Turn order strategies
│   ├── card-selector.ts    # Selector interface
│   ├── player-by-player.ts # Alternating player strategy
│   └── speed-weighted-card-pool.ts # Speed-based selection
└── @types/                 # Fight result types
    ├── fight-result.ts     # Complete fight outcome
    ├── fight-start-report.ts # FightStartReport: step 0, every card with its maxHealth
    ├── step.ts             # Turn step recording (includes shield_applied, shield_broken, shield_expired, damage_mitigated, mark_applied, regenerated)
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
    ├── mark-report.ts      # MarkAppliedReport: { kind: 'mark_applied', card, damageType, stacks }
    ├── regeneration-report.ts # RegeneratedReport: { kind: 'regenerated', card, healed, remainingHealth }
    ├── protection-report.ts # ProtectionStartedReport + ProtectionEndedReport + AttackInterceptedReport
    ├── transformation-report.ts # TransformationStartedReport + TransformationEndedReport (healthCost on exit)
    ├── concealment-report.ts # ConcealmentStartedReport + ConcealmentEndedReport (reason: attacked | expired)
    ├── special-stance-report.ts # SpecialStanceReport (special_stance step) + SpecialStanceActionReport (step + follow-ups)
    ├── survived-report.ts  # SurvivedReport: { kind: 'survived', name, card }
    ├── damage-mitigated-report.ts # DamageMitigatedReport: { kind: 'damage_mitigated', name, card }
    ├── buff-transferred-report.ts # BuffTransferredReport: { kind: 'buff_transferred', name, source, target, alterations }
    ├── executed-report.ts  # ExecutedReport: { kind: 'executed', name, attacker, card }
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
├── last-attacker-of-ally.ts   # Targets the last card that attacked a specific ally (returns [] if dead)
├── most-wounded-ally.ts       # Targets the caster ally in the worst shape below a threshold (excludes the caster)
├── protected-ally.ts          # Targets the ally the caster stands in front of; empty outside a protection
├── fastest-ally.ts            # Targets the caster's fastest living ally, buffs included; resolves with a dead caster
├── first-bleeding-enemy.ts    # Targets the first enemy in deck order carrying N bleed stacks
└── target-and-neighbors.ts    # Targets a card chosen at runtime and its two deck neighbors (living only)
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
- @Dockerfile - Multi-stage Docker build (Node 26 Alpine)

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
    │   └── RosterCard.svelte   # Presentational card tile (role=button) with selected/disabled state; reuses CardHeader
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
        └── composites/         # CardHeader.svelte (element gradient + totem + badge + optional corner snippet), CharacterCard.svelte (built from primitives + CardHeader)
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

## Fight Replayer (`clients/fight-replayer/`)

Static ES-module app, served with `pnpm replayer`; the fight JSON is pasted in.
No build step. `js/parser.js` turns a raw report into `events`, `snapshots`
(card state after each step), `teams` and `cardsMeta`, and is the only part
with real logic — hence its Vitest suite (`js/__tests__/parser.spec.js`),
which makes the replayer a workspace package covered by `pnpm -r test`.
`js/__tests__/describe-event.spec.js` reads the engine `StepKind` enum from
`step.ts` and fails when a step kind has no icon in `describeEvent()`.

`snapshots` carry every buffer a card holds: `shield`, `stance`, `concealment`, `protecting`,
`transformation`, `marks`, `bleedStacks`, `statuses`, `buffs`/`debuffs`. Death clears them all.
The shield is drawn down per hit from `Damage.shieldAbsorbed` — the report's
`damage` is the total dealt, so without that field the buffer stayed frozen at
its applied value (issue #326). Likewise a hit carrying `consumedBleedStacks`
(Scythra's detonation and legacy explosion) clears the target's bleed.
The `fight_start` step (step 0) is read as the initial state, not replayed as an
event: it lists every card with its `maxHealth`. Without it (older reports) a
card is sized from its first hit, and one never hit fell back to 1000. `js/icons.js` must carry an icon and a colour
for every `StepKind`, otherwise `describeEvent()` falls back to a bare `•` and
the event log row loses its label.

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
