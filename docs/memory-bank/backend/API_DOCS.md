---
name: api-docs
description: API documentation and specifications
argument-hint: N/A
---

# API Documentation

This part provides a comprehensive reference for the API, including endpoints, request/response formats, validation, and error handling.

## Authentication & Authorization

Not implemented - API is currently open without authentication.

## Endpoints

- Controller file: @packages/combat-engine/src/fight/http-api/fight.controller.ts - Single endpoint for fight simulation
- Base URL: `http://localhost:3000` (default port, configurable via `PORT` env var)
- Versioning: None - Unversioned API
- Format: REST - Single POST endpoint
- Protocol: HTTP

## Request/Response Formats

- Request format: JSON - Validated using `class-validator` decorators
- Response format: JSON - Returns `FightResult` object with step-by-step battle log
- Validation: Global `ValidationPipe` with `transform: true`, `whitelist: true`, `forbidNonWhitelisted: true`

## Available Endpoints

### POST /fight

Simulates a turn-based card battle between two players.

**Request Body** (`FightDataDto`):

```typescript
{
  player1: {
    name: string,
    deck: FightingCardDto[] // 1-5 cards
  },
  player2: {
    name: string,
    deck: FightingCardDto[] // 1-5 cards
  },
  cardSelectorStrategy: "player-by-player" | "speed-weighted"
}
```

**FightingCardDto Structure**:

```typescript
{
  name: string,
  attack: number,
  defense: number,
  health: number,
  speed: number,
  agility: number,
  accuracy: number,
  criticalChance: number,
  skills: {
    special: SpecialDto,      // Ultimate ability (attack or healing)
    simpleAttack: SimpleAttackDto,  // Basic attack
    others: OtherSkillDto[]   // Additional skills (healing, buffs)
  },
  behaviors: {
    dodge: "simple-dodge" | "random-dodge"
  },
  image?: string,             // Optional card image
  cardDeckIdentity?: string,  // Optional identifier
  id: string                  // Unique card identifier (used for ally-death trigger targeting)
}
```

**SpecialDto**:

```typescript
{
  kind: "ATTACK" | "HEALING",
  name: string,
  rate: number,               // Damage/healing multiplier
  energy: number,             // Energy cost to use special
  targetingStrategy: TargetingStrategy,
  effect?: EffectDto,         // Optional status effect (poison, burn, freeze)
  buffApplication?: BuffApplicationDto,   // Optional buff application (for special attacks)
  shieldApplication?: ShieldApplicationDto  // Optional shield application (independent targeting)
}
```

**ShieldApplicationDto**:

```typescript
{
  rate: number,               // Shield points = rate * maxHealth of target
  duration: number,           // Number of turns shield lasts
  targetingStrategy: TargetingStrategy  // Cannot be targeted-card
}
```

**Note on Buff/Shield Application**: Buff and shield targeting is independent from the primary attack targeting, allowing combos like "attack all enemies while shielding all allies".

**SimpleAttackDto**:

```typescript
{
  name: string,
  damages: DamageCompositionDto[],  // Min 1 entry — multi-type damage compositions
  targetingStrategy: TargetingStrategy,
  effects?: EffectDto[]             // Optional array of status effects (poison, burn, freeze, stunt)
}
```

**MultipleAttackDto** (alternative to `simpleAttack`, for multi-hit attacks):

```typescript
{
  name: string,
  hits: number,                     // Number of hits
  damages: DamageCompositionDto[],  // Min 1 entry
  targetingStrategy: TargetingStrategy,
  amplifier?: number,               // Optional damage amplifier
  effects?: EffectDto[],            // Optional array of status effects
  comboFinisher?: DamageCompositionDto[]  // Optional finisher hit compositions
}
```

**Note**: `skills.simpleAttack` and `skills.multipleAttack` are both optional — provide exactly one.

**OtherSkillDto**:

```typescript
{
  kind: "HEALING" | "BUFF" | "CONDITIONAL_ATTACK" | "TARGETING_OVERRIDE" | "SHIELD" | "SURVIVE",
  name: string,
  rate?: number,                // Optional — not required for TARGETING_OVERRIDE or SURVIVE; required for SHIELD
  targetingStrategy?: TargetingStrategy,  // Not required for SHIELD or SURVIVE kinds
  event?: "turn-end" | "next-action" | "ally-death" | "ally-health-below",  // When skill triggers; NOT required for SHIELD or SURVIVE kinds
  targetCardId?: string,        // Required when event=ally-death or ally-health-below: id of the monitored card
  // SHIELD-specific fields:
  activationCondition?: { operator?: "below" | "above", threshold: number },  // Health ratio threshold (0–1) for SHIELD/ally-health-below activation
  buffType?: "attack" | "defense" | "agility" | "accuracy",  // Required if kind=BUFF
  duration?: number,            // Required if kind=BUFF (0 = infinite: permanent or event-bound)
  terminationEvent?: string,    // Event name that removes this skill's buff/targeting override when fired
  activationLimit?: number,     // Max activations (>=1) before skill lifecycle ends — supported for HEALING and TARGETING_OVERRIDE kinds
  endEvent?: string,            // Event emitted when activation limit is reached — supported for HEALING and TARGETING_OVERRIDE kinds
  powerId?: string,             // Groups multiple skills as a composite power (must share same event + terminationEvent)
  // DORMANT trigger fields (required when event="dormant"):
  activationEvent?: TriggerEvent, // Event that activates the dormant skill (e.g., "ally-death")
  activationTargetCardId?: string, // Card ID for the activation event trigger
  replacementEvent?: TriggerEvent, // Event to use after activation (e.g., "enemy-death"). Target card ID resolved dynamically from killer card at activation time
  // CONDITIONAL_ATTACK fields:
  damages?: DamageCompositionDto[],
  hits?: number,
  interval?: number,
  amplifier?: number,
  effect?: EffectDto,
  comboFinisher?: DamageCompositionDto[]
}
```

**EffectDto**:

```typescript
{
  type: "POISON" | "BURN" | "FREEZE" | "STUNT",
  rate: number,               // Damage coefficient per tick (unused for STUNT — no damage tick)
  level: 1 | 2 | 3,           // Duration: STUNT = 2*level-1 turns; others = level 1=1, 2=3, 3=5 ticks
  probability?: number,       // 0-1 chance to apply effect on hit; omit for guaranteed application
  triggeredDebuff?: {         // Optional debuff applied on effect hit (not supported on STUNT)
    debuffType: "attack" | "defense" | "agility" | "accuracy",
    debuffRate: number,
    duration: number,
    probability: number,
    terminationEvent?: string  // Event name that removes this triggered debuff when fired
  },
  terminationEvent?: string   // Event name that removes this effect when fired
}
```

**BuffApplicationDto**:

```typescript
{
  type: "attack" | "defense" | "agility" | "accuracy",
  rate: number,               // Buff strength multiplier
  duration: number,           // Number of turns buff lasts (0 = infinite: permanent if no terminationEvent, event-bound if terminationEvent is set)
  targetingStrategy: TargetingStrategy,
  condition?: BuffConditionDto,     // Optional conditional multiplier
  terminationEvent?: string         // Event name that removes this buff when fired
}
```

**Response** (`FightResult`):

```typescript
{
  [stepNumber: number]: {
    kind: "attack" | "special_attack" | "healing" | "status_change" | "state_effect" | "buff" | "debuff" | "buff_removed" | "debuff_removed" | "buff_expired" | "debuff_expired" | "effect_removed" | "targeting_override" | "targeting_reverted" | "shield_applied" | "shield_broken" | "shield_expired" | "survived" | "fight_end",
    // Additional properties vary by step kind
  }
}
```

**`attack` / `special_attack` step** (`DamageReport`): Emitted when a card attacks.
```typescript
{
  kind: "attack" | "special_attack",
  name?: string,         // Skill name that triggered the attack
  attacker: CardInfo,
  damages: { defender: CardInfo, damage: number, isCritical: boolean, dodge: boolean, remainingHealth: number, survived?: boolean, survivedSkillName?: string }[],
  energy: number
}
```

**`survived` step** (`SurvivedReport`): Emitted immediately after a fatal blow is intercepted by a SURVIVE skill.
```typescript
{
  kind: "survived",
  name: string,          // Name of the SURVIVE skill that triggered
  card: CardInfo         // Card that survived the fatal blow (left at 1 HP)
}
```

**`healing` step** (`HealingReport`): Emitted when a card heals.
```typescript
{
  kind: "healing",
  name?: string,         // Skill name that triggered the healing
  source: CardInfo,
  heal: { target: CardInfo, healed: number, remainingHealth: number }[],
  energy: number,
  powerId?: string
}
```

**`buff` step** (`BuffReport`): Emitted when a buff is applied.
```typescript
{
  kind: "buff",
  name?: string,         // Skill name that applied the buff
  source: CardInfo,
  buffs: { target: CardInfo, kind: BuffType, value: number, remainingTurns: number }[],
  energy: number,
  powerId?: string
}
```

**`debuff` step** (`DebuffReport`): Emitted when a debuff is applied.
```typescript
{
  kind: "debuff",
  name?: string,         // Skill name that applied the debuff
  source: CardInfo,
  debuffs: { target: CardInfo, kind: DebuffType, value: number, remainingTurns: number }[],
  energy: number,
  powerId?: string
}
```

**`buff_removed` step** (`BuffRemovedReport`): Emitted when a skill's end event fires and removes event-bound buffs.
```typescript
{
  kind: "buff_removed",
  source: CardInfo,      // Card whose skill emitted the end event
  eventName: string,     // The end event name that triggered removal
  removed: { target: CardInfo, kind: BuffType, value: number }[],
  powerId?: string       // Present if the skill that emitted the end event belongs to a composite power
}
```

**`debuff_removed` step** (`DebuffRemovedReport`): Emitted when a skill's end event fires and removes event-bound debuffs.
```typescript
{
  kind: "debuff_removed",
  source: CardInfo,      // Card whose skill emitted the end event
  eventName: string,     // The end event name that triggered removal
  removed: { target: CardInfo, kind: DebuffType, value: number }[],
  powerId?: string       // Present if the skill that emitted the end event belongs to a composite power
}
```

**`buff_expired` step** (`BuffExpiredReport`): Emitted at end of turn when a buff's duration reaches 0.
```typescript
{
  kind: "buff_expired",
  card: CardInfo,        // Card whose buff expired
  expired: { kind: BuffType, value: number }[]
}
```

**`debuff_expired` step** (`DebuffExpiredReport`): Emitted at end of turn when a debuff's duration reaches 0.
```typescript
{
  kind: "debuff_expired",
  card: CardInfo,        // Card whose debuff expired
  expired: { kind: DebuffType, value: number }[]
}
```

**`status_change` step** (`StatusChangeReport`): Emitted after an attack when a status effect is applied or the card dies.
```typescript
{
  kind: "status_change",
  card: CardInfo,
  status: "dead" | "poison" | "burn" | "freeze" | "stunt"
}
```

**`effect_removed` step** (`EffectRemovedReport`): Emitted when an end event fires and removes event-bound status effects (poison, burn, freeze, stunt).
```typescript
{
  kind: "effect_removed",
  source: CardInfo,      // Card whose skill emitted the end event
  eventName: string,     // The end event name that triggered removal
  removed: { target: CardInfo, effectType: string }[]
}
```

**`targeting_override` step** (`TargetingOverrideReport`): Emitted when a targeting override skill activates.
```typescript
{
  kind: "targeting_override",
  name?: string,                   // Skill name that pushed the override
  source: CardInfo,                // Card whose skill pushed the override
  previousStrategy: string,        // ID of the strategy before override
  newStrategy: string,             // ID of the new targeting strategy
  powerId?: string                 // Present if skill belongs to a composite power
}
```

**`targeting_reverted` step** (`TargetingRevertedReport`): Emitted when a targeting override is removed via end event.
```typescript
{
  kind: "targeting_reverted",
  source: CardInfo,                // Card whose override was reverted
  eventName: string,               // The end event name that triggered the revert
  revertedStrategy: string,        // ID of the strategy that was removed
  restoredStrategy: string,        // ID of the strategy restored
  powerId?: string                 // Present if triggered by a composite power end event
}
```

**`shield_applied` step** (`ShieldAppliedReport`): Emitted when a shield is applied to one or more cards.
```typescript
{
  kind: "shield_applied",
  name?: string,             // Skill name that applied the shield
  source: CardInfo,
  targets: { target: CardInfo, points: number }[]
}
```

**`shield_broken` step** (`ShieldBrokenReport`): Emitted when a shield's points are depleted mid-damage.
```typescript
{
  kind: "shield_broken",
  card: CardInfo
}
```

**`shield_expired` step** (`ShieldExpiredReport`): Emitted at turn-end when a shield's duration reaches 0.
```typescript
{
  kind: "shield_expired",
  card: CardInfo
}
```

**Note on `name`**: The `name?` field appears on `attack`, `special_attack`, `healing`, `buff`, `debuff`, `targeting_override`, and `shield_applied` step kinds, carrying the name of the skill that generated the step.

**Note on `powerId`**: The `powerId` field appears on `buff`, `debuff`, `healing`, `buff_removed`, `debuff_removed`, `targeting_override`, and `targeting_reverted` step kinds when the originating skill belongs to a composite power group.

## Enums

### CardSelectorStrategy

- `player-by-player`: Cards alternate between players
- `speed-weighted`: Cards act based on speed stat probability

### TargetingStrategy

- `position-based`: Targets opponent at same position
- `target-all`: Targets all opponents
- `line-three`: Targets 3 cards in a line
- `all-owner-cards`: Targets all cards belonging to owner
- `all-allies`: Targets all allied cards
- `self`: Targets the card itself
- `last-attacker-of-ally`: Targets the card that last attacked a specific ally (requires `targetCardId`); built inline in controller with `LastAttackerOfAllyTargetingStrategy`
- `linked-ally`: Targets a specific ally by ID (requires `targetCardId`); built inline in controller with `AlliedCardByIdStrategy`

### DodgeStrategy

- `simple-dodge`: Uses agility stat for dodge calculation
- `random-dodge`: Random dodge chance

### TriggerEvent

- `turn-end`: Skill triggers at end of turn
- `next-action`: Skill triggers on the next action turn
- `ally-death`: Skill triggers when a specific ally dies (requires `targetCardId` matching the dead card's `id`)
- `enemy-death`: Skill triggers when a specific enemy dies (requires `targetCardId` matching the dead card's `id`)
- `dormant`: Skill starts inactive; requires `activationEvent`, `activationTargetCardId`, and `replacementEvent` to define when and how the trigger activates mid-battle. The replacement trigger's target card ID is resolved dynamically at activation time from the killer card's ID
- `survived`: Skill triggers after the owning card survives a fatal blow via SURVIVE skill
- `ally-health-below`: Edge-triggered when a monitored ally's health ratio crosses `activationCondition.threshold` downward; requires `targetCardId` (the monitored ally's id) and `activationCondition.threshold`

### SpecialKind

- `ATTACK`: Special ability that deals damage
- `HEALING`: Special ability that heals

### SkillKind

- `HEALING`: Healing skill
- `BUFF`: Temporary stat boost
- `CONDITIONAL_ATTACK`: Attack skill triggered conditionally by an event
- `TARGETING_OVERRIDE`: Overrides the card's attack targeting strategy (requires `terminationEvent`)
- `SHIELD`: Health-reactive shield skill — no `event` field; triggers when card's health ratio crosses `activationCondition.threshold` downward (edge-triggered, rearms on recovery)
- `SURVIVE`: One-time fatal-blow interception — no `event`, no `targetingStrategy`; only `name` required; extracted from `others[]` before normal skill loop

### Effect

- `POISON`: Damage over time
- `BURN`: Damage over time
- `FREEZE`: Prevents action for 1-5 turns, increases damage taken by 20%
- `STUNT`: Prevents action for 1-5 turns (2*level-1), increases damage taken by 20%; no damage tick; does not stack with freeze (whichever is active takes precedence)

### BuffType

- `attack`: Increases attack stat
- `defense`: Increases defense stat
- `agility`: Increases agility stat
- `accuracy`: Increases accuracy stat

## Validation

All DTOs use `class-validator` decorators:

- `@IsString()`: Validates string fields
- `@IsNumber()`: Validates numeric fields
- `@IsEnum()`: Validates enum values
- `@IsArray()`: Validates array fields
- `@ArrayMinSize(1)`, `@ArrayMaxSize(5)`: Deck size constraints
- `@ValidateNested()`: Validates nested objects
- `@IsOptional()`: Marks optional fields
- `@IsNotEmpty()`: Ensures non-empty values

Validation errors return 400 Bad Request with detailed error messages.

## Error Handling

- **400 Bad Request**: Validation failures from `ValidationPipe`
- **500 Internal Server Error**: Runtime errors (e.g., unknown skill kind, missing buff properties)
- No custom error handling middleware - uses NestJS defaults

## Factory Functions

Three factory functions map DTO enums to domain implementations:

- `buildTargetingStrategy()` in @packages/combat-engine/src/fight/http-api/targeting-strategy-factory.ts - Maps `TargetingStrategy` enum to strategy objects
- `buildDodgeStrategy()` in @packages/combat-engine/src/fight/http-api/dodge-strategy-factory.ts - Maps `DodgeStrategy` enum to behavior objects
- `buildTriggerStrategy()` in @packages/combat-engine/src/fight/http-api/trigger-factory.ts - Maps `TriggerEvent` enum to trigger objects

## Response Types

See @packages/combat-engine/src/fight/core/fight-simulator/@types/ for complete type definitions:

- `FightResult`: Map of step numbers to `Step` objects
- `Step`: Union type with `kind` discriminator
- `DamageReport`, `HealingReport`, `BuffReport`, `DebuffReport`, `StateEffectReport`, `StatusChangeReport`, `WinnerReport`, `BuffRemovedReport`, `EffectRemovedReport`, `TargetingOverrideReport`, `TargetingRevertedReport`: Specific step types

## Dependencies

- `@nestjs/common` v10 - NestJS core framework
- `class-validator` v0.14 - DTO validation
- `class-transformer` v0.5 - DTO transformation
