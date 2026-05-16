# API Contract: Survive Skill

**Endpoint**: `POST /fight`  
**Change type**: Additive (backward-compatible)

---

## Request Changes

### `SkillKind` enum — new value

```typescript
enum SkillKind {
  HEALING           = 'HEALING',
  ALTERATION        = 'ALTERATION',
  CONDITIONAL_ATTACK = 'CONDITIONAL_ATTACK',
  TARGETING_OVERRIDE = 'TARGETING_OVERRIDE',
  SHIELD            = 'SHIELD',
  SURVIVE           = 'SURVIVE',   // NEW
}
```

### `TriggerEvent` enum — new value

```typescript
enum TriggerEvent {
  TURN_END    = 'turn-end',
  NEXT_ACTION = 'next-action',
  ALLY_DEATH  = 'ally-death',
  ENEMY_DEATH = 'enemy-death',
  DORMANT     = 'dormant',
  SURVIVED    = 'survived',   // NEW — fired when SurviveSkill intercepts a fatal blow
}
```

### `OtherSkillDto` validation rules for `SURVIVE` kind

| Field | Required? | Constraint |
|-------|-----------|------------|
| `kind` | yes | `"SURVIVE"` |
| `name` | yes | non-empty string |
| `event` | **NO** | Must be absent — SURVIVE has no event trigger (interceptor, not event-driven) |
| `targetingStrategy` | yes | Ignored at runtime for SURVIVE (required by DTO shape); `"self"` recommended |
| All other fields | no | Unused for SURVIVE |

*No new fields added to `OtherSkillDto`.* Post-survival buffs are separate `ALTERATION` entries.

### Example: Survive skill with post-survival buffs

```json
{
  "skills": {
    "others": [
      {
        "kind": "SURVIVE",
        "name": "Earth's Embrace",
        "targetingStrategy": "self"
      },
      {
        "kind": "ALTERATION",
        "name": "Earth's Embrace",
        "event": "survived",
        "buffType": "defense",
        "rate": 1.0,
        "duration": 1,
        "targetingStrategy": "self",
        "polarity": "buff"
      },
      {
        "kind": "ALTERATION",
        "name": "Earth's Embrace",
        "event": "survived",
        "buffType": "attack",
        "rate": 1.5,
        "duration": 1,
        "targetingStrategy": "self",
        "polarity": "buff"
      }
    ]
  }
}
```

*Note*: `duration: 1` means the buff expires at the end of the surviving card's next turn (two turn-end decrements: 1 → 0 → expired at next decrement).

---

## Response Changes

### New step kind: `survived`

```typescript
{
  kind: "survived",
  name: string,   // skill name
  card: CardInfo  // the card that survived
}
```

### Step ordering when Survive fires

After the `attack` or `special_attack` step for the fatal hit:

```
{ "kind": "attack", ... }
{ "kind": "survived", "name": "Earth's Embrace", "card": { "id": "kaelion", ... } }
{ "kind": "buff", "name": "Earth's Embrace", "source": { "id": "kaelion", ... }, "alterations": [...] }
{ "kind": "buff", "name": "Earth's Embrace", "source": { "id": "kaelion", ... }, "alterations": [...] }
```

No `{ "kind": "status_change", "status": "dead" }` is emitted for this hit.

---

## Backward Compatibility

- Existing payloads without `SURVIVE` skills are unaffected.
- The new `SURVIVED` `TriggerEvent` value is ignored if not referenced.
- The new `survived` step kind is additive; existing clients that handle unknown step kinds gracefully are unaffected.
