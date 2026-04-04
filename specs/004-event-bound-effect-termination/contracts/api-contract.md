# API Contract: Event-Bound Effect Termination

**Date**: 2026-04-03
**Feature**: 004-event-bound-effect-termination

## Modified Contract: POST /fight

### EffectDto — updated

```json
{
  "type": "BURN",
  "rate": 0.3,
  "level": 2,
  "terminationEvent": "fire-shield-end",
  "triggeredDebuff": {
    "debuffType": "defense",
    "debuffRate": 0.1,
    "duration": 2,
    "probability": 0.5
  }
}
```

**New field**: `terminationEvent` (optional string). When present, the effect will be removed from the affected card when the named event fires during the fight.

### New response step: effect_removed

```json
{
  "kind": "effect_removed",
  "source": {
    "name": "Healer",
    "id": "healer-1"
  },
  "eventName": "fire-shield-end",
  "removed": [
    {
      "target": {
        "name": "Warrior",
        "id": "warrior-1"
      },
      "effectType": "burn"
    }
  ]
}
```

**When emitted**: During end event processing, after a skill emits its `endEvent`. Appears alongside existing `buff_removed` steps in the same processing pass.

## Backwards Compatibility

- `terminationEvent` is optional — omitting it preserves existing behavior (duration-based expiration only)
- Existing payloads without `terminationEvent` continue to work identically
- New `effect_removed` steps only appear when event-bound effects are configured and terminated
