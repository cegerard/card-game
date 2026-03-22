# Quickstart: Event-Bound Buff Termination

**Branch**: `002-event-bound-buff`

## What This Feature Adds

A buff can now be bound to a named termination event. When that event fires (because a skill exhausted its activation limit or its owner died), all buffs with that event name are immediately removed from all cards.

## Minimum Working Example

Configure a card with "Lion's Inheritance" — a turn-end buff skill that activates 3 times, then stops:

```json
{
  "kind": "BUFF",
  "name": "Lion's Inheritance",
  "rate": 0.4,
  "targetingStrategy": "self",
  "event": "turn-end",
  "buffType": "attack",
  "duration": 0,
  "terminationEvent": "lions-inheritance-end",
  "activationLimit": 3,
  "endEvent": "lions-inheritance-end"
}
```

## What Happens

1. Turn 1–3: `Lion's Inheritance` fires at turn-end → applies a 40% attack buff to self (refreshes each time)
2. Turn 3 (3rd activation): skill emits `"lions-inheritance-end"` → all buffs with that event name are removed in the same step
3. Turn 4+: skill is exhausted, never fires again; buff is gone

## Fight Log Output

```
Step N: { kind: "buff", source: "arionis", buffs: [{ target: "arionis", kind: "attack", value: 120 }] }
Step N: { kind: "buff_removed", source: "arionis", eventName: "lions-inheritance-end", removed: [{ target: "arionis", kind: "attack", value: 120 }] }
```

## Running Tests

```bash
npm run test -- src/fight/core/cards/skills/__tests__/buff-skill.spec.ts
npm run test:cov
npm run test:e2e
```

## Quality Gates (must all pass before merge)

```bash
npm run format
npm run lint
npm run test:cov
npm run build
```
