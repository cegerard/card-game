# API Contract: Dynamic Skill Trigger

## Changes to POST /fight

### New TriggerEvent Enum Value

```
"dormant" — Skill starts with no trigger; requires activation fields
```

### New DTO Fields on OtherSkillDto

When `event: "dormant"`, these fields become required:

```json
{
  "kind": "HEALING",
  "name": "Vengeance Heal",
  "rate": 0.5,
  "targetingStrategy": "self",
  "event": "dormant",
  "activationEvent": "ally-death",
  "activationTargetCardId": "warrior-01",
  "replacementEvent": "enemy-death"
}
```

| Field | Type | Required When | Description |
|-------|------|---------------|-------------|
| activationEvent | `"ally-death" \| "enemy-death"` | `event = "dormant"` | Event that activates the dormant skill |
| activationTargetCardId | string | `event = "dormant"` | Card ID for the activation event |
| replacementEvent | `"turn-end" \| "next-action" \| "ally-death" \| "enemy-death"` | `event = "dormant"` | Event to use after activation. For death events, the target card ID is resolved dynamically from the killer card at activation time |

### New TriggerEvent Value for Non-Dormant Skills

```
"enemy-death" — Triggers when a specific enemy card dies (requires targetCardId)
```

### Validation Rules

- `event = "dormant"` requires `activationEvent`, `activationTargetCardId`, `replacementEvent`
- `event = "enemy-death"` requires `targetCardId` (same pattern as `ally-death`)
- Dormant fields (`activationEvent`, `activationTargetCardId`, `replacementEvent`) must NOT be present when `event` is not `"dormant"`
- The replacement trigger's target card ID is resolved dynamically at activation time from the killer card's ID (not configured in the DTO)

### New Response Step Kind

No new step kinds. Dormant skills produce standard step kinds (`healing`, `buff`, `debuff`, etc.) when they activate and fire.

### Example: Full Card with Dormant Skill

```json
{
  "name": "Avenger",
  "id": "avenger-01",
  "attack": 50,
  "defense": 30,
  "health": 200,
  "speed": 40,
  "agility": 20,
  "accuracy": 80,
  "criticalChance": 10,
  "skills": {
    "simpleAttack": {
      "name": "Slash",
      "damages": [{ "type": "PHYSICAL", "rate": 1.0 }],
      "targetingStrategy": "position-based"
    },
    "special": {
      "kind": "ATTACK",
      "name": "Fury Strike",
      "rate": 2.0,
      "energy": 3,
      "targetingStrategy": "position-based"
    },
    "others": [
      {
        "kind": "HEALING",
        "name": "Vengeance Heal",
        "rate": 0.5,
        "targetingStrategy": "self",
        "event": "dormant",
        "activationEvent": "ally-death",
        "activationTargetCardId": "warrior-01",
        "replacementEvent": "enemy-death"
      }
    ]
  },
  "behaviors": {
    "dodge": "simple-dodge"
  }
}
```

### Backward Compatibility

- All existing `event` values (`turn-end`, `next-action`, `ally-death`) work unchanged
- New fields are only relevant for `event: "dormant"` and `event: "enemy-death"`
- No changes to response format
