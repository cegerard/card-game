# Quickstart: Targeted Card Strategy — Dynamic Resolution (v2)

## What This Feature Does

Adds a `targeted-card` targeting strategy that dynamically locks onto a specific enemy card at trigger time. The first resolution mode is "target the killer" — when an ally dies in combat, the card that dealt the lethal blow becomes the lock-on target. The strategy is only usable through targeting override skills.

## Key Change from v1

v1 used a static `targetedCardId` in the DTO. v2 resolves the target **dynamically at trigger time** by propagating the killer's identity through the death notification chain.

## Key Files to Read First

1. [fighting-context.ts](../../src/fight/core/cards/@types/fighting-context.ts) — Context type to extend with `killerCard`
2. [card-death-subscriber.ts](../../src/fight/core/fight-simulator/card-death-subscriber.ts) — Interface to extend with killer param
3. [action_stage.ts](../../src/fight/core/card-action/action_stage.ts) — Where killer is available on death
4. [death-skill-handler.ts](../../src/fight/core/fight-simulator/death-skill-handler.ts) — Where killer flows into skill context
5. [targeting-override.ts](../../src/fight/core/cards/skills/targeting-override.ts) — Where strategy is built lazily
6. [targeted-card.ts](../../src/fight/core/targeting-card-strategies/targeted-card.ts) — Unchanged strategy class

## Implementation Steps (High Level)

1. **FightingContext**: Add optional `killerCard?: FightingCard`
2. **CardDeathSubscriber**: Add optional `killerCard` param to `notifyDeath`
3. **ActionStage**: Pass attacker as `killerCard` when defender dies
4. **DeathSkillHandler**: Include `killerCard` in the context passed to skills
5. **TargetingOverrideSkill**: Accept optional resolver, call it in `launch()` to build strategy dynamically
6. **Controller**: Pass resolver `(ctx) => new TargetedCard(ctx.killerCard?.id ?? '')` for `targeted-card`
7. **DTO**: Remove `targetedCardId` field and its validator

## How to Verify

```bash
npm run test          # Unit tests pass
npm run test:e2e      # E2E tests pass
npm run lint          # No lint errors
npm run build         # Builds successfully
```

## Sample Configuration

```json
{
  "kind": "TARGETING_OVERRIDE",
  "name": "Vengeance",
  "targetingStrategy": "targeted-card",
  "event": "ally-death",
  "targetCardId": "kaelion",
  "terminationEvent": "lion-heritage-end",
  "powerId": "lion-heritage"
}
```

No `targetedCardId` needed — the target is the card that killed "kaelion".
