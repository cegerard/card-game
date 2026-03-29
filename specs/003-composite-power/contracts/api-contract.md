# API Contract: Composite Power

**Feature**: 003-composite-power | **Date**: 2026-03-29

## POST /fight — Updated Contract

### OtherSkillDto (updated)

New optional fields on all `OtherSkillDto` entries:

```json
{
  "kind": "BUFF",
  "name": "Rage Buff",
  "rate": 0.3,
  "targetingStrategy": "self",
  "event": "turn-end",
  "buffType": "attack",
  "duration": 0,
  "terminationEvent": "rage-end",
  "powerId": "rage-power"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| powerId | string | optional | Groups this skill with others sharing the same identifier into a composite power |

### New Skill Kind: TARGETING_OVERRIDE

```json
{
  "kind": "TARGETING_OVERRIDE",
  "name": "Rage Targeting",
  "targetingStrategy": "target-all",
  "event": "turn-end",
  "terminationEvent": "rage-end",
  "powerId": "rage-power"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| kind | "TARGETING_OVERRIDE" | required | Skill kind |
| name | string | required | Skill display name |
| targetingStrategy | TargetingStrategy | required | The new targeting strategy to apply |
| event | TriggerEvent | required | When this override activates |
| terminationEvent | string | required | Event that reverts the override |
| powerId | string | optional | Composite power group identifier |

**Note**: `rate` is not required for TARGETING_OVERRIDE (no numeric effect).

### Composite Power Example

A "Rage" composite power that on turn-end: buffs attack +30%, applies burn on next attack, and overrides targeting to target-all:

```json
{
  "others": [
    {
      "kind": "BUFF",
      "name": "Rage Attack Boost",
      "rate": 0.3,
      "targetingStrategy": "self",
      "event": "turn-end",
      "buffType": "attack",
      "duration": 0,
      "terminationEvent": "rage-end",
      "activationLimit": 3,
      "endEvent": "rage-end",
      "powerId": "rage-power"
    },
    {
      "kind": "TARGETING_OVERRIDE",
      "name": "Rage Targeting",
      "targetingStrategy": "target-all",
      "event": "turn-end",
      "terminationEvent": "rage-end",
      "powerId": "rage-power"
    }
  ]
}
```

**Validation rules**:
- All skills with the same `powerId` MUST have the same `event` value
- All skills with the same `powerId` MUST have the same `terminationEvent` value
- Violation returns HTTP 400 with a descriptive error message

### New Response Step Kinds

#### targeting_override

Emitted when a targeting override skill activates:

```json
{
  "kind": "targeting_override",
  "source": { "name": "CardName", "id": "card-1" },
  "previousStrategy": "position-based",
  "newStrategy": "target-all",
  "powerId": "rage-power"
}
```

#### targeting_reverted

Emitted when a targeting override is cleaned up:

```json
{
  "kind": "targeting_reverted",
  "source": { "name": "CardName", "id": "card-1" },
  "eventName": "rage-end",
  "revertedStrategy": "target-all",
  "restoredStrategy": "position-based",
  "powerId": "rage-power"
}
```

### Backwards Compatibility

- `powerId` is optional on all skill DTOs — omitting it preserves existing behavior
- Existing step kinds (`buff`, `debuff`, `healing`, `buff_removed`) gain an optional `powerId` field — absent when skill has no powerId
- No existing field semantics change
