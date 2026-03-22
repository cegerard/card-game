# API Contract Changes: Event-Bound Buff Termination

**Branch**: `002-event-bound-buff` | **Endpoint**: `POST /fight`

All changes are **additive** (new optional fields). No existing fields are modified or removed. Zero breaking changes to existing payloads.

---

## `OtherSkillDto` — new optional fields

```typescript
class OtherSkillDto {
  // existing fields unchanged...

  @IsOptional()
  @IsNumber()
  @Min(1)
  activationLimit?: number;    // Max times this skill triggers before lifecycle ends

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  endEvent?: string;           // Event name emitted when activationLimit is reached
}
```

**Usage rules**:
- `activationLimit` and `endEvent` are independent: either can be omitted
- If `activationLimit` is set without `endEvent`, the skill becomes inactive after N activations but emits no end event (no buff cleanup triggered)
- If `endEvent` is set without `activationLimit`, the skill fires indefinitely (same as today) but never emits the end event (no cleanup occurs)
- Both must be set together for FR-002/FR-003/FR-004 to apply

---

## `BuffApplicationDto` — new optional field

Used in `SpecialDto.buffApplication[]` (special attack buffs):

```typescript
class BuffApplicationDto {
  // existing fields unchanged...

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  terminationEvent?: string;   // Named event that removes this buff when fired
}
```

---

## `OtherSkillDto` (BUFF kind) — new optional field on existing struct

For `kind: BUFF` skills, the `rate` field now doubles as the buff rate and duration is now optionally `0` to mean "no turn limit":

```typescript
// Existing buffType, duration fields unchanged.
// New:
@IsOptional()
@IsString()
@IsNotEmpty()
terminationEvent?: string;     // Named event that removes this buff when fired
```

> **Note**: `duration: 0` in the DTO means "no turn-based expiry" when `terminationEvent` is set. The domain maps this to `Infinity`. Without `terminationEvent`, `duration` must remain `>= 1`.

---

## Response: new step kind `buff_removed`

When event-bound buffs are removed, the fight log includes new steps:

```typescript
{
  "42": {
    "kind": "buff_removed",
    "source": { "id": "arionis", "name": "Arionis", "deckIdentity": "player1-0" },
    "eventName": "lions-inheritance-end",
    "removed": [
      {
        "target": { "id": "arionis", "name": "Arionis", "deckIdentity": "player1-0" },
        "kind": "attack",
        "value": 120
      }
    ]
  }
}
```

**Fields**:
- `kind`: always `"buff_removed"`
- `source`: `CardInfo` of the card whose skill emitted the end event (or the dying card)
- `eventName`: the end event name that triggered removal
- `removed`: array of `{ target: CardInfo, kind: BuffType, value: number }` for each removed buff

---

## Example Payload: Lion's Inheritance skill

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

This skill:
1. Triggers at turn-end
2. Applies a 40% attack buff to self with no turn duration (event-only)
3. After 3 activations, emits `"lions-inheritance-end"`, removing all buffs bound to that event
