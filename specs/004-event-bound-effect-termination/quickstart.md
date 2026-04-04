# Quickstart: Event-Bound Effect Termination

**Date**: 2026-04-03
**Feature**: 004-event-bound-effect-termination

## What This Feature Does

Allows status effects (poison, burn, freeze) to be automatically removed when a named event fires during a fight. This uses the same event system that already removes buffs.

## Example: Burn removed when a skill ends

A card inflicts a burn effect with `terminationEvent: "fire-aura-end"`. Another card has a skill with `endEvent: "fire-aura-end"` and `activationLimit: 3`. After 3 activations, the skill emits `"fire-aura-end"`, which removes both the event-bound buffs **and** the event-bound burn from all cards.

### Request snippet

```json
{
  "skills": {
    "simpleAttack": {
      "name": "Fire Strike",
      "damages": [{ "type": "FIRE", "rate": 1.0 }],
      "targetingStrategy": "position-based",
      "effect": {
        "type": "BURN",
        "rate": 0.8,
        "level": 2,
        "terminationEvent": "fire-aura-end"
      }
    }
  }
}
```

### Expected fight log step on termination

```json
{
  "kind": "effect_removed",
  "source": { "name": "Fire Mage", "id": "fire-mage-1" },
  "eventName": "fire-aura-end",
  "removed": [
    { "target": { "name": "Warrior", "id": "warrior-1" }, "effectType": "burn" }
  ]
}
```

## Development

```bash
npm run test        # Run all tests
npm run test:cov    # Run with coverage
npm run test:e2e    # End-to-end tests
npm run build       # Build
```
