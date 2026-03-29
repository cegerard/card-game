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

- Controller file: @src/fight/http-api/fight.controller.ts - Single endpoint for fight simulation
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
  buffApplication?: BuffApplicationDto // Optional buff application (for special attacks)
}
```

**Note on Buff Application**: When `buffType`, `buffRate`, `buffDuration`, and `buffTargetingStrategy` are all provided, the special attack will apply buffs after dealing damage. The buff targeting is independent from the attack targeting, allowing combos like "attack all enemies while buffing all allies".

**SimpleAttackDto**:

```typescript
{
  name: string,
  damages: DamageCompositionDto[],  // Min 1 entry — multi-type damage compositions
  targetingStrategy: TargetingStrategy,
  effect?: EffectDto
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
  effect?: EffectDto,
  comboFinisher?: DamageCompositionDto[]  // Optional finisher hit compositions
}
```

**Note**: `skills.simpleAttack` and `skills.multipleAttack` are both optional — provide exactly one.

**OtherSkillDto**:

```typescript
{
  kind: "HEALING" | "BUFF" | "CONDITIONAL_ATTACK",
  name: string,
  rate: number,
  targetingStrategy: TargetingStrategy,
  event: "turn-end" | "next-action" | "ally-death",  // When skill triggers
  targetCardId?: string,        // Required when event=ally-death: id of the ally whose death triggers this skill
  buffType?: "attack" | "defense" | "agility" | "accuracy",  // Required if kind=BUFF
  duration?: number,            // Required if kind=BUFF (0 = infinite: permanent or event-bound)
  terminationEvent?: string,    // Event name that removes this skill's buff when fired
  activationLimit?: number,     // Max activations (>=1) before skill lifecycle ends
  endEvent?: string,            // Event emitted when activation limit is reached
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
  type: "POISON" | "BURN" | "FREEZE",
  rate: number,               // Application chance (0-1)
  level: 1 | 2 | 3,           // Effect intensity
  triggeredDebuff?: {         // Optional debuff applied on effect hit
    debuffType: "attack" | "defense" | "agility" | "accuracy",
    debuffRate: number,
    duration: number,
    probability: number
  }
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
    kind: "attack" | "special_attack" | "healing" | "status_change" | "state_effect" | "buff" | "debuff" | "buff_removed" | "winner" | "fight_end",
    // Additional properties vary by step kind
  }
}
```

**`buff_removed` step** (`BuffRemovedReport`): Emitted when a skill's end event fires and removes event-bound buffs.
```typescript
{
  kind: "buff_removed",
  source: CardInfo,      // Card whose skill emitted the end event
  eventName: string,     // The end event name that triggered removal
  removed: { target: CardInfo, kind: BuffType, value: number }[]
}
```

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

### DodgeStrategy

- `simple-dodge`: Uses agility stat for dodge calculation
- `random-dodge`: Random dodge chance

### TriggerEvent

- `turn-end`: Skill triggers at end of turn
- `next-action`: Skill triggers on the next action turn
- `ally-death`: Skill triggers when a specific ally dies (requires `targetCardId` matching the dead card's `id`)

### SpecialKind

- `ATTACK`: Special ability that deals damage
- `HEALING`: Special ability that heals

### SkillKind

- `HEALING`: Healing skill
- `BUFF`: Temporary stat boost
- `CONDITIONAL_ATTACK`: Attack skill triggered conditionally by an event

### Effect

- `POISON`: Damage over time
- `BURN`: Damage over time
- `FREEZE`: Prevents action, increases damage taken

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

- `buildTargetingStrategy()` in @src/fight/http-api/targeting-strategy-factory.ts - Maps `TargetingStrategy` enum to strategy objects
- `buildDodgeStrategy()` in @src/fight/http-api/dodge-strategy-factory.ts - Maps `DodgeStrategy` enum to behavior objects
- `buildTriggerStrategy()` in @src/fight/http-api/trigger-factory.ts - Maps `TriggerEvent` enum to trigger objects

## Response Types

See @src/fight/core/fight-simulator/@types/ for complete type definitions:

- `FightResult`: Map of step numbers to `Step` objects
- `Step`: Union type with `kind` discriminator
- `DamageReport`, `HealingReport`, `BuffReport`, `DebuffReport`, `StateEffectReport`, `StatusChangeReport`, `WinnerReport`, `BuffRemovedReport`: Specific step types

## Dependencies

- `@nestjs/common` v10 - NestJS core framework
- `class-validator` v0.14 - DTO validation
- `class-transformer` v0.5 - DTO transformation
