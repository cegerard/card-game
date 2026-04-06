# Quickstart: Targeted Card Strategy

## What This Feature Does

Adds a `targeted-card` targeting strategy that locks a card's attacks onto a specific enemy card by ID. When the target dies, attacks produce no damage. The strategy is only usable through targeting override skills.

## Key Files to Read First

1. [targeting-card-strategy.ts](../../src/fight/core/targeting-card-strategies/targeting-card-strategy.ts) — Interface to implement
2. [targeted-from-position.ts](../../src/fight/core/targeting-card-strategies/targeted-from-position.ts) — Reference implementation (similar pattern)
3. [targeting-override.ts](../../src/fight/core/cards/skills/targeting-override.ts) — How overrides use strategies
4. [fight-data.dto.ts](../../src/fight/http-api/dto/fight-data.dto.ts) — DTO enums and validation
5. [fight.controller.ts](../../src/fight/http-api/fight.controller.ts) — `createOtherSkill()` TARGETING_OVERRIDE case

## Implementation Steps (High Level)

1. **Domain**: Create `TargetedCard` class implementing `TargetingCardStrategy`
2. **DTO**: Add `TARGETED_CARD` enum value, add `targetedCardId` field to `OtherSkillDto`
3. **Validation**: Reject `targeted-card` in all non-override targeting contexts
4. **Controller**: Construct `TargetedCard` in `TARGETING_OVERRIDE` case when strategy is `targeted-card`
5. **Tests**: Unit tests for strategy, validation tests, E2E test

## How to Verify

```bash
npm run test          # Unit tests pass
npm run test:e2e      # E2E tests pass
npm run lint          # No lint errors
npm run build         # Builds successfully
```

## Sample Configuration

See [samples/cards.json](../../samples/cards.json) — the Arionis card has a `TARGETING_OVERRIDE` skill with `"targetingStrategy": "TODO"` that should use `"targeted-card"` with a `targetedCardId`.
