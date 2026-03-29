# Quickstart: Composite Power

**Feature**: 003-composite-power | **Date**: 2026-03-29

## What is a Composite Power?

A composite power groups multiple existing skills (buff, debuff, healing, attack, targeting override) under a shared identifier (`powerId`). When the shared trigger fires, all grouped skills activate. When the shared termination event fires, all grouped effects are removed.

## How It Works

1. **Define skills with the same `powerId`** on a card's `others` array
2. All grouped skills must share the same `event` (trigger) and `terminationEvent`
3. One skill in the group should have an `activationLimit` + `endEvent` matching the `terminationEvent` — this controls the power's lifecycle
4. When the trigger fires, all skills in the group execute
5. When the end event fires, all event-bound effects (buffs, targeting overrides) are cleaned up

## Minimal Example

A 2-skill composite power: buff + targeting override, lasting 3 turns.

```json
{
  "others": [
    {
      "kind": "BUFF",
      "name": "Power Buff",
      "rate": 0.25,
      "targetingStrategy": "self",
      "event": "turn-end",
      "buffType": "attack",
      "duration": 0,
      "terminationEvent": "power-end",
      "activationLimit": 3,
      "endEvent": "power-end",
      "powerId": "my-power"
    },
    {
      "kind": "TARGETING_OVERRIDE",
      "name": "Power Targeting",
      "targetingStrategy": "target-all",
      "event": "turn-end",
      "terminationEvent": "power-end",
      "powerId": "my-power"
    }
  ]
}
```

**What happens**:
- Turn 1: Both skills fire — card gets +25% attack buff, attacks now target all enemies
- Turn 2: Both skills fire again — another buff layer applied
- Turn 3: Both skills fire — third buff applied. `activationLimit` reached → `power-end` event fires
- Cleanup: All buffs with `terminationEvent: "power-end"` are removed. Targeting reverts to original.

## Key Rules

- `powerId` is optional — skills without it behave exactly as before
- All skills sharing a `powerId` must have the same `event` and `terminationEvent`
- `TARGETING_OVERRIDE` is a new skill kind that only changes targeting (no damage, no healing)
- Multiple composite powers on the same card are independent (different `powerId` values)
- Fight log steps include `powerId` for client-side grouping
