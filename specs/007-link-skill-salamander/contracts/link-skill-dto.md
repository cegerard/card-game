# Contract: Link Skill DTO (Salamander Tears)

## Context

Kaelion's "Salamander Tears" skill is configured as **3 separate skills** inside `FightingCardDto.skills.others[]`, all linked via `powerId`. This approach reuses the existing kinds (`CONDITIONAL_ATTACK` and `ALTERATION`) with a new event type.

## Full Configuration

```json
{
  "skills": {
    "others": [
      {
        "kind": "CONDITIONAL_ATTACK",
        "name": "Salamander Tears",
        "event": "ally-health-below",
        "targetCardId": "arionis-uuid",
        "activationCondition": {
          "type": "health-threshold",
          "operator": "below",
          "threshold": 0.3
        },
        "damages": [{ "type": "FIRE", "rate": 2.0 }],
        "targetingStrategy": "last-attacker-of-ally",
        "powerId": "salamander-tears"
      },
      {
        "kind": "ALTERATION",
        "name": "Salamander Tears",
        "event": "ally-health-below",
        "targetCardId": "arionis-uuid",
        "activationCondition": {
          "type": "health-threshold",
          "operator": "below",
          "threshold": 0.3
        },
        "polarity": "buff",
        "buffType": "attack",
        "rate": 0.1,
        "duration": 5,
        "targetingStrategy": "linked-ally",
        "powerId": "salamander-tears"
      },
      {
        "kind": "ALTERATION",
        "name": "Salamander Tears",
        "event": "ally-health-below",
        "targetCardId": "arionis-uuid",
        "activationCondition": {
          "type": "health-threshold",
          "operator": "below",
          "threshold": 0.3
        },
        "polarity": "buff",
        "buffType": "defense",
        "rate": 0.2,
        "duration": 5,
        "targetingStrategy": "linked-ally",
        "powerId": "salamander-tears"
      }
    ]
  }
}
```

## New Enum Values

### TriggerEvent

| Value | Description |
| --- | --- |
| `"ally-health-below"` | Fires when the HP of a specific ally (identified by `targetCardId`) drops below the threshold defined in `activationCondition.threshold`. Edge-triggered; rearms when HP recovers above the threshold. |

### TargetingStrategy (new values)

| Value | Applicable to | Description |
| --- | --- | --- |
| `"last-attacker-of-ally"` | `CONDITIONAL_ATTACK` with `ally-health-below` | Targets the last enemy that dealt damage to the monitored ally. Returns empty if that enemy is dead or absent. |
| `"linked-ally"` | `ALTERATION` with `ally-health-below` | Targets the ally specified by `targetCardId`. Searches in the caster's team. Returns empty if dead or absent. |

## Validation Rules

### Required fields when `event: "ally-health-below"`

| Field | Required | Rule |
| --- | --- | --- |
| `targetCardId` | Yes | ID of the ally to monitor (extended from ally-death / enemy-death) |
| `activationCondition` | Yes | Must be `type: "health-threshold"` with `operator` and `threshold` |
| `activationCondition.threshold` | Yes | Between 0 and 1 |

### Targeting rules

- `"last-attacker-of-ally"` is only valid with `CONDITIONAL_ATTACK` + `ally-health-below`
- `"linked-ally"` is only valid with `ALTERATION` + `ally-health-below`
- If `targetCardId` does not match any card in the team, the skill never fires (silent no-op)

### Note on `duration`

For `ALTERATION` skills with `ally-health-below`, `duration: 5` maps directly to 5 turns in the domain. The buff expires after 5 turns via the standard `decreaseBuffAndDebuffDuration()` mechanism.

## Fight Log Output

### Full trigger (last attacker alive)

```json
{
  "5": {
    "kind": "attack",
    "name": "Salamander Tears",
    "attacker": { "id": "kaelion-uuid", "name": "Kaelion", "deckIdentity": "player1-0" },
    "damages": [
      {
        "defender": { "id": "enemy-uuid", "name": "Enemy", "deckIdentity": "player2-0" },
        "damage": 350,
        "isCritical": false,
        "dodge": false,
        "remainingHealth": 150,
        "kind": ["FIRE"]
      }
    ],
    "energy": 2,
    "powerId": "salamander-tears"
  },
  "6": {
    "kind": "buff",
    "name": "Salamander Tears",
    "source": { "id": "kaelion-uuid", "name": "Kaelion", "deckIdentity": "player1-0" },
    "alterations": [
      {
        "target": { "id": "arionis-uuid", "name": "Arionis", "deckIdentity": "player1-1" },
        "kind": "attack",
        "value": 21,
        "remainingTurns": 5
      }
    ],
    "energy": 2,
    "powerId": "salamander-tears"
  },
  "7": {
    "kind": "buff",
    "name": "Salamander Tears",
    "source": { "id": "kaelion-uuid", "name": "Kaelion", "deckIdentity": "player1-0" },
    "alterations": [
      {
        "target": { "id": "arionis-uuid", "name": "Arionis", "deckIdentity": "player1-1" },
        "kind": "defense",
        "value": 40,
        "remainingTurns": 5
      }
    ],
    "energy": 2,
    "powerId": "salamander-tears"
  }
}
```

> `remainingTurns: 5` decrements each turn via the standard buff duration mechanism; the buff expires after 5 turns.

### Explosion skipped (last attacker dead or absent)

Only the buff steps (6 and 7 in the example above) appear.
