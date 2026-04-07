# Data Model: Targeted Card Strategy — Dynamic Resolution (v2)

## Modified Entities

### FightingContext (Domain Type)

**Location**: `src/fight/core/cards/@types/fighting-context.ts`

| Change | Field | Type | Description |
|--------|-------|------|-------------|
| Add | `killerCard` | `FightingCard` (optional) | The card that dealt the lethal blow. Present on `ally-death` triggered by combat damage. Absent for state-effect deaths. |

### CardDeathSubscriber (Interface)

**Location**: `src/fight/core/fight-simulator/card-death-subscriber.ts`

| Change | Description |
|--------|-------------|
| Modify | `notifyDeath(player, card, killerCard?)` — add optional `killerCard: FightingCard` parameter |

### ActionStage (Fight Simulator)

**Location**: `src/fight/core/card-action/action_stage.ts`

| Change | Method | Description |
|--------|--------|-------------|
| Modify | `handleAttackResult()` | Accept attacker card, pass it to `notifyDeath` when defender dies |
| Modify | `notifyDeath()` | Accept optional `killerCard` and forward to subscribers |
| Modify | `launchAttack()`, `computeSpecialAttackResult()`, `launchNextActionSkills()` | Pass the attacking card to `handleAttackResult` |

### DeathSkillHandler (Fight Simulator)

**Location**: `src/fight/core/fight-simulator/death-skill-handler.ts`

| Change | Method | Description |
|--------|--------|-------------|
| Modify | `notifyDeath()` | Accept optional `killerCard`, include it in `FightingContext` passed to `card.launchSkills()` |

### TargetingOverrideSkill (Skill)

**Location**: `src/fight/core/cards/skills/targeting-override.ts`

| Change | Description |
|--------|-------------|
| Modify constructor | Accept optional `strategyResolver: (context: FightingContext) => TargetingCardStrategy` as alternative to static `targetingStrategy` |
| Modify `launch()` | If resolver is present, call it with context to produce the strategy. Otherwise, use the static strategy (existing behavior). |

### OtherSkillDto (DTO)

**Location**: `src/fight/http-api/dto/fight-data.dto.ts`

| Change | Field | Description |
|--------|-------|-------------|
| Remove | `targetedCardId` | No longer needed — target resolved dynamically |
| Remove | `TargetedCardIdRequiredConstraint` | Validator for removed field |

### FightController (HTTP Layer)

**Location**: `src/fight/http-api/fight.controller.ts`

| Change | Method | Description |
|--------|--------|-------------|
| Modify | `createOtherSkill()` | When `targetingStrategy=targeted-card`, pass a resolver function `(ctx) => new TargetedCard(ctx.killerCard?.id ?? '')` instead of a static instance |

## Unchanged Entities

### TargetedCard (Domain Strategy)

**Location**: `src/fight/core/targeting-card-strategies/targeted-card.ts`

No changes. Already correctly:
- Takes `targetCardId` in constructor
- Returns `[card]` if alive, `[]` if dead or not found
- Empty string ID will always return `[]` (no card matches)

### TurnManager

**Location**: `src/fight/core/fight-simulator/turn-manager.ts`

`notifyDeath()` signature changes but `killerCard` is **not passed** — state-effect deaths have no killer. The parameter is optional, so no behavioral change.

## State Transitions

```
[ally-death event with killer]
  → DeathSkillHandler.notifyDeath(player, deadCard, killerCard)
    → context = { sourcePlayer, opponentPlayer, killerCard }
      → card.launchSkills('ally-death:X', context)
        → TargetingOverrideSkill.launch(source, context)
          → resolver(context) → new TargetedCard(killerCard.id)
            → source.overrideAttackTargeting(strategy)

[ally-death event without killer (state-effect)]
  → DeathSkillHandler.notifyDeath(player, deadCard, undefined)
    → context = { sourcePlayer, opponentPlayer, killerCard: undefined }
      → TargetingOverrideSkill.launch(source, context)
        → resolver(context) → new TargetedCard('') → always returns []
```
