# Data Model: Targeted Card Strategy

## New Entity

### TargetedCard (Domain)

**Location**: `src/fight/core/targeting-card-strategies/targeted-card.ts`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (readonly) | `'targeted-card'` — strategy identifier |
| `targetCardId` | `string` (readonly, constructor) | ID of the enemy card to target |

**Interface**: Implements `TargetingCardStrategy`

**Behavior**:
- `targetedCards(attackingCard, attackingPlayer, defendingPlayer)`:
  - Finds the card with matching `targetCardId` in `defendingPlayer.allCards`
  - If found AND alive → returns `[card]`
  - If not found OR dead → returns `[]`

**Validation rules**: None at domain level — validated at DTO boundary.

## Modified Entities

### TargetingStrategy Enum (DTO)

**Location**: `src/fight/http-api/dto/fight-data.dto.ts`

| Change | Value |
|--------|-------|
| Add | `TARGETED_CARD = 'targeted-card'` |

**Validation**: `targeted-card` is only valid when used in `OtherSkillDto` with `kind: TARGETING_OVERRIDE`. Rejected in `SimpleAttackDto`, `MultipleAttackDto`, `SpecialDto`, and `BuffApplicationDto` targeting strategy fields.

### OtherSkillDto (DTO)

**Location**: `src/fight/http-api/dto/fight-data.dto.ts`

| Change | Field | Type | Description |
|--------|-------|------|-------------|
| Add | `targetedCardId` | `string` (optional) | ID of the enemy card to target. Required when `kind=TARGETING_OVERRIDE` and `targetingStrategy=targeted-card`. |

### FightController (HTTP Layer)

**Location**: `src/fight/http-api/fight.controller.ts`

| Change | Method | Description |
|--------|--------|-------------|
| Modify | `createOtherSkill()` | In `TARGETING_OVERRIDE` case: when `targetingStrategy` is `targeted-card`, construct `TargetedCard(targetedCardId)` directly instead of using `buildTargetingStrategy()`. |

### targeting-strategy-factory (HTTP Layer)

**Location**: `src/fight/http-api/targeting-strategy-factory.ts`

| Change | Description |
|--------|-------------|
| No change | `targeted-card` is NOT added to `STRATEGY_MAP`. It requires a parameter (`targetCardId`) that generic strategies don't need, so it's constructed directly in the controller. |

## State Transitions

No state transitions — `TargetedCard` is stateless. It evaluates the target's alive/dead status on each call.
