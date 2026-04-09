# Data Model: Dynamic Skill Trigger

## New Entities

### DynamicTrigger

A trigger that starts dormant and activates when it observes a specific event.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Always `'dormant'` |
| activated | boolean | Internal state, starts `false` |
| activationTrigger | Trigger | Trigger that matches the activation event |
| replacementTrigger | Trigger | Trigger used after activation |

**Behavior**:
- `isTriggered(triggerId)`: If not activated, checks if `activationTrigger.isTriggered(triggerId)` — if yes, flips `activated` to true, returns false. If activated, delegates to `replacementTrigger.isTriggered(triggerId)`.

**Relationships**: Composes two existing `Trigger` instances (any combination of AllyDeath, EnemyDeath, TurnEnd, NextAction).

### EnemyDeath

A trigger that matches when a specific enemy card dies.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Always `'enemy-death'` |
| targetCardId | string | ID of the enemy card whose death triggers this |

**Behavior**:
- `isTriggered(triggerId)`: Returns true when `triggerId === 'enemy-death:<targetCardId>'`

**Relationships**: Mirrors `AllyDeath`. Used as a replacement trigger inside `DynamicTrigger`.

## Modified Entities

### OtherSkillDto (DTO layer)

New optional fields added:

| Field | Type | Description |
|-------|------|-------------|
| activationEvent | TriggerEvent | The event that activates a dormant skill |
| activationTargetCardId | string | Card ID for the activation event trigger |
| replacementEvent | TriggerEvent | The event to use after activation |
| replacementTargetCardId | string | Card ID for the replacement trigger |

**Constraints**: All four fields required when `event: 'dormant'`. None allowed when `event` is any other value.

### TriggerEvent (DTO enum)

New value: `DORMANT = 'dormant'`

### DeathSkillHandler (domain)

Modified to also fire `enemy-death:<deadCard.id>` on the opponent team's surviving cards after firing `ally-death:<deadCard.id>` on the owner's team.

## State Transitions

```
DynamicTrigger State Machine:

  [Dormant] ---(activation event observed)---> [Active]
       |                                           |
  isTriggered() → false                   isTriggered() → delegates to
  (checks activation trigger)             replacementTrigger
```

## Unchanged Entities

- `Trigger` interface — no changes
- `Skill` interface — no changes
- `FightingCard` — no changes (launchSkills already works generically)
- `Healing`, `AlterationSkill`, `ConditionalAttack` — no changes (they delegate to trigger)
- `AllyDeath`, `TurnEnd`, `NextAction` — unchanged
