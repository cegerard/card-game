---
name: architecture
description: Module architecture and structure
argument-hint: N/A
---

# Architecture

- [Architecture](#architecture)
  - [Language/Framework](#languageframework)
    - [Backend](#backend)
  - [Full project structure](#full-project-structure)
    - [Naming Conventions](#naming-conventions)
  - [Services communication](#services-communication)
    - [Fight Simulation Flow](#fight-simulation-flow)

## Language/Framework

### Backend

- **Language/Framework**: Node.js with NestJS 11 → @package.json
- **API Style**: REST - Single endpoint for fight simulation
- **Architecture**: Domain-Driven Design with hexagonal architecture - Core domain logic separated from HTTP layer
- **ORM**: None - No database, in-memory battle simulation
- **Schema path**: @src/fight/http-api/dto/fight-data.dto.ts - DTOs with class-validator decorators
- **Endpoints**: @src/fight/http-api/fight.controller.ts - Single POST /fight endpoint
- **Database**: None - Stateless battle simulator
- **Caching**: None
- **Testing**: Jest with unit tests alongside source files in `__tests__` directories

## Full project structure

```text
src/
├── main.ts                           # Application entry point with NestJS bootstrap
├── app.module.ts                     # Root module importing FightModule
├── logger-middleware.ts              # HTTP request logging middleware
└── fight/                            # Fight domain module
    ├── fight.module.ts               # NestJS module with DI configuration
    ├── http-api/                     # HTTP layer (adapters)
    │   ├── fight.controller.ts       # POST /fight endpoint
    │   ├── dto/
    │   │   └── fight-data.dto.ts     # Request DTOs with validation
    │   ├── targeting-strategy-factory.ts  # DTO enum → domain object mapping
    │   ├── dodge-strategy-factory.ts
    │   └── trigger-factory.ts
    ├── core/                         # Domain logic (pure business logic)
    │   ├── player.ts                 # Player entity managing deck of cards
    │   ├── randomizer.ts             # Random number generation interface
    │   ├── fight-simulator/          # Fight orchestration
    │   │   ├── fight.ts              # Main fight orchestrator
    │   │   ├── turn-manager.ts       # Turn-end effects processor
    │   │   ├── card-death-subscriber.ts  # Event listener interface
    │   │   ├── death-skill-handler.ts    # Triggers ally-death skills; accumulates + drains steps
    │   │   ├── end-event-processor.ts    # Removes event-bound buffs when a skill end event fires
    │   │   ├── skill-results-to-steps.ts # Standalone fn: SkillResults[] → Step[] (shared by ActionStage, TurnManager, DeathSkillHandler)
    │   │   ├── @types/               # Fight result types
    │   │   └── card-selectors/       # Turn order strategies
    │   │       ├── card-selector.ts
    │   │       ├── player-by-player.ts
    │   │       └── speed-weighted-card-pool.ts
    │   ├── card-action/
    │   │   └── action_stage.ts       # Action resolution logic
    │   ├── cards/                    # Card domain
    │   │   ├── fighting-card.ts      # Main card entity
    │   │   ├── @types/               # Card-related types
    │   │   │   ├── card-info.ts
    │   │   │   ├── fighting-context.ts
    │   │   │   ├── action-result/    # Action result types
    │   │   │   ├── attack/           # Attack effects (poison, burn, freeze, stunt)
    │   │   │   ├── state/            # Status effect state
    │   │   │   ├── buff/             # Buff/debuff types
    │   │   │   └── damage/           # Damage types (DamageType, DamageComposition, Element)
    │   │   ├── skills/               # Card abilities
    │   │   │   ├── simple-attack.ts
    │   │   │   ├── multiple-attack.ts    # Multi-hit attack
    │   │   │   ├── attack-skill.ts       # Base attack skill
    │   │   │   ├── alteration-skill.ts   # Stat alteration skill
    │   │   │   ├── special.ts        # Abstract special skill
    │   │   │   ├── special-attack.ts
    │   │   │   ├── special-healing.ts
    │   │   │   ├── skill.ts          # Event-triggered skill interface
    │   │   │   ├── healing.ts
    │   │   │   ├── conditional-attack.ts # Attack triggered conditionally by event
    │   │   │   ├── targeting-override.ts # Overrides card attack targeting strategy
    │   │   │   └── power-id-consistency.ts # Domain validation: skills with same powerId must share event + terminationEvent
    │   │   ├── behaviors/            # Card behaviors
    │   │   │   ├── dodge-behaviors.ts
    │   │   │   ├── simple-dodge.ts
    │   │   │   └── random-dodge.ts
    │   │   └── damage/              # Damage calculation engine
    │   │       ├── damage-calculator.ts   # Multi-type damage computation
    │   │       └── elemental-matrix.ts    # Element effectiveness multipliers
    │   ├── targeting-card-strategies/  # Targeting logic
    │   │   ├── targeting-card-strategy.ts
    │   │   ├── targeted-all.ts
    │   │   ├── targeted-from-position.ts
    │   │   ├── targeted-line-three.ts
    │   │   ├── all-owner-cards.ts
    │   │   ├── all-allies.ts
    │   │   └── launcher.ts
    │   └── trigger/                  # Skill trigger events
    │       ├── trigger.ts
    │       ├── activatable-trigger.ts  # Interface extending Trigger with activate(triggerId, context)
    │       ├── turn-end.ts
    │       ├── death-trigger.ts      # Parameterized trigger matching 'ally-death:<cardId>' or 'enemy-death:<cardId>'
    │       └── dynamic-trigger.ts    # Dormant→active trigger wrapper (composes activation + replacement triggers)
    └── tools/                        # Utility implementations
        └── math-randomizer.ts
```

### Naming Conventions

- **Files**: kebab-case
- **Classes**: PascalCase
- **Functions**: camelCase
- **Variables**: camelCase
- **Constants**: UPPER_CASE (for maps and enums)
- **Types/Interfaces**: PascalCase
- **Private methods**: camelCase with private keyword

## Services communication

### Fight Simulation Flow

HTTP Request flows from controller through domain layers using dependency injection and factory pattern.

```mermaid
sequenceDiagram
    participant Client
    participant Controller as FightController
    participant Factory as FIGHT_SIMULATOR_BUILDER
    participant Fight as Fight Orchestrator
    participant ActionStage as ActionStage
    participant TurnManager as TurnManager
    participant CardSelector as CardSelector
    participant Card as FightingCard
    participant DeathHandler as DeathSkillHandler

    Client->>Controller: POST /fight (FightDataDto)
    Controller->>Controller: Convert DTOs to domain objects
    Controller->>Controller: Create Players with decks
    Controller->>Factory: Build Fight instance
    Factory-->>Controller: Fight simulator
    Controller->>Fight: start()

    loop Until winner or 100 turns
        Fight->>CardSelector: nextCards()
        CardSelector-->>Fight: Selected cards

        Fight->>ActionStage: computeNextAction(cards)
        loop For each non-frozen card
            ActionStage->>Card: isSpecialReady() / launchAttack() / launchSpecial()
            Card-->>ActionStage: AttackResult[] / HealingResult[]
            ActionStage->>ActionStage: Apply damage/healing to targets
            ActionStage->>ActionStage: Check for deaths
            ActionStage->>DeathHandler: notifyDeath(player, deadCard)
            DeathHandler->>Card: launchSkill('ally-death:<id>') on survivors
            DeathHandler->>DeathHandler: processEndEvent() via EndEventProcessor (if skill emits endEvent)
            ActionStage->>DeathHandler: drainSteps()
            DeathHandler-->>ActionStage: Death-triggered skill steps + buff_removed steps
        end
        ActionStage-->>Fight: Action steps

        Fight->>TurnManager: endTurn(cards)
        loop For each card
            TurnManager->>Card: decreaseBuffAndDebuffDuration()
            TurnManager->>Card: launchSkill('turn-end')
            TurnManager->>Card: applyStateEffects() (poison, burn, freeze)
            TurnManager->>TurnManager: Check for deaths
            TurnManager->>DeathHandler: notifyDeath(player, deadCard)
            DeathHandler->>Card: launchSkill('ally-death:<id>') on survivors
            DeathHandler->>DeathHandler: processEndEvent() via EndEventProcessor (if skill emits endEvent)
            TurnManager->>DeathHandler: drainSteps()
            DeathHandler-->>TurnManager: Death-triggered skill steps + buff_removed steps
        end
        TurnManager-->>Fight: Turn-end steps

        Fight->>Fight: Append steps to FightResult
    end

    Fight->>Fight: computeWinner()
    Fight-->>Controller: FightResult
    Controller-->>Client: JSON response with step-by-step fight log
```

**Key architectural patterns:**

- **Hexagonal Architecture**: Core domain (`src/fight/core/`) isolated from HTTP layer (`src/fight/http-api/`)
- **Factory Pattern**: `FIGHT_SIMULATOR_BUILDER` injectable factory creates Fight instances with dependencies
- **Strategy Pattern**:
  - Card selection strategies (`PlayerByPlayerCardSelector`, `SpeedWeightedCardSelector`)
  - Targeting strategies (position-based, all-enemies, line-three, etc.)
  - Dodge behaviors (simple, random)
- **Observer Pattern**: `CardDeathSubscriber` interface for death notifications. `DeathSkillHandler` implements it: on each death it fires `ally-death:<cardId>` skill triggers on the dead card's team's surviving cards AND `enemy-death:<cardId>` triggers on the opponent team's surviving cards. Accumulates resulting steps and exposes `drainSteps()` for callers (`ActionStage`, `TurnManager`) to collect them immediately after each death event. Handles all three skill kinds: **Healing** → `StepKind.Healing`, **Buff** → `StepKind.Buff`, **Debuff** → `StepKind.Debuff`. Also processes `endEvent` from skill results via `EndEventProcessor`, emitting `buff_removed` steps inline
- **Dependency Injection**: NestJS provider system for `FIGHT_SIMULATOR_BUILDER`
- **Value Objects**: Immutable types for attack effects, buffs, debuffs, damage compositions
- **Rich Domain Model**: `FightingCard` encapsulates stats, behaviors, element, and state mutations
- **Multi-Damage System**: `DamageCalculator` computes damage from multiple `DamageComposition` entries (type + rate), applying `ElementalMatrix` multipliers based on attacker damage types vs defender element
- **Buff Condition System**: `BuffApplication` has optional `condition: BuffCondition` and `conditionMultiplier`. If the condition evaluates to true at buff application time, the rate is multiplied. `buff-condition-factory.ts` maps `BuffConditionType` enum → `BuffCondition` instance. First implementation: `AllyPresenceCondition` checks that a named ally is alive in the source player's team.
- **Event-Driven**: Skills triggered by events (`turn-end`, `next-action`, `ally-death:<cardId>`, `enemy-death:<cardId>`), extensible trigger system. `DeathTrigger` is a single parameterized class replacing the former `AllyDeath`/`EnemyDeath` classes — instantiated with a `DeathPrefix` (`'ally-death'` or `'enemy-death'`) and a `targetCardId`, matching the pattern `<prefix>:<targetCardId>`
- **Dynamic Trigger**: `DynamicTrigger` wraps an activation trigger and a replacement trigger. Starts dormant (all `isTriggered()` return false). When the activation event is observed, flips to active and delegates to the replacement trigger. Enables skills that start inactive and become triggered mid-battle (e.g., healing skill dormant until an ally dies, then triggers on enemy death)
- **Unified Special Result**: `Special.launch()` returns `SpecialResult` containing both `actionResults` (AttackResult[] or HealingResult[]) and `buffResults` (BuffResults) for consistent handling across attack and healing specials
- **Event-Bound Buff Termination**: `Buff` type has optional `terminationEvent?: string`. Skills have optional `activationLimit` and `endEvent`. When a skill reaches its activation limit (or its owner dies), it emits its `endEvent`. `EndEventProcessor` scans all playable cards and removes buffs matching that event name, emitting a `StepKind.BuffRemoved` step. `SkillResults` carries an optional `endEvent` field so callers know to trigger `EndEventProcessor`.
- **Event-Bound Effect Termination**: `CardState` (poison, burn, freeze) has optional `terminationEvent?: string`. When `EndEventProcessor` fires an end event, it also scans all living cards for status effects matching that event and removes them, emitting a `StepKind.EffectRemoved` step. The `terminationEvent` flows from `EffectDto` → `AttackEffect` → `CardState`.
- **Skill Lifecycle Interface**: `Skill` interface has two optional lifecycle methods: `tick?()` (advance internal state each turn) and `lifecycleEndEvent?()` (return end event name if skill is active and lifecycle-limited). `Healing` fully implements this: it tracks `activationCount`, stops triggering after `activationLimit` is reached, and emits `endEvent` on the last activation.
- **Skill `launch()` signature**: All `Skill` implementations accept an optional third parameter `targetingStrategy?: TargetingCardStrategy`. When provided, it overrides the skill's own default targeting strategy. Currently used to propagate active targeting overrides from `FightingCard` down to attack/skill launches.
- **`TargetingOverrideSkill` null-safe strategy resolution**: When the `strategyResolver` returns `null` (e.g., `killerCard` absent in context), the skill returns empty results instead of throwing. Callers must handle the no-op gracefully.
- **`ActionStage` constructor requires `DeathSkillHandler`**: `ActionStage` now receives `DeathSkillHandler` directly so it can drain death-skill steps inline after each kill, ensuring correct step ordering within the action phase.
- **`AttackResult.remainingHealth`**: `AttackResult` carries an explicit `remainingHealth` snapshot taken at damage-calculation time, used in reports instead of re-reading the card's current health (which may have been mutated by subsequent hits).
- **Multi-Effect Attack System**: `SimpleAttack` and `MultipleAttack` accept `effects?: AttackEffect[]` (array, replaces former single `effect?`). `SpecialAttack` retains a single `effect?: AttackEffect`. Each effect in the array is evaluated independently; effects with `probability` set are skipped when the random roll fails.
- **STUNT Status Effect**: `CardStateStunted` prevents the card from acting (same skip condition as freeze: `card.frozenLevel > 0 || card.isStunted`) and amplifies incoming damage by 20% via `applyDamageRate()`. No damage tick. Does not stack — `StuntAttackEffect.applyEffect()` returns early if the defender is already frozen or stunted. Duration: `2 * level - 1` turns.
- **`AttackEffect.probability`**: Optional `0-1` field on the `AttackEffect` interface. Effect classes guard `applyEffect()` with `if (probability !== undefined && randomizer.random() >= probability) return`. Randomizer is injected via constructor, not via `FightingContext`.
- **`skill-results-to-steps.ts`**: Standalone pure function extracted from `ActionStage`, mapping `SkillResults[]` to `Step[]` for reuse across `ActionStage`, `TurnManager`, and `DeathSkillHandler`.
- **Separation of Concerns**:
  - `Fight` orchestrates battle flow
  - `ActionStage` handles attack/heal resolution and extracts buff applications from special results
  - `TurnManager` handles turn-end effects
  - `CardSelector` determines turn order
  - `EndEventProcessor` handles event-bound buff and effect removal across all cards
  - `skillResultsToSteps()` converts skill results to report steps (shared utility)
