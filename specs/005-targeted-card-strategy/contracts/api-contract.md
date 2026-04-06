# API Contract: Targeted Card Strategy

## Changes to POST /fight

### TargetingStrategy Enum

Add new value:

```typescript
enum TargetingStrategy {
  // ... existing values ...
  TARGETED_CARD = 'targeted-card',
}
```

**Restriction**: `targeted-card` is only valid in `OtherSkillDto` when `kind` is `TARGETING_OVERRIDE`. Using it in any other targeting strategy field returns **400 Bad Request**.

### OtherSkillDto — New Field

```typescript
{
  kind: "TARGETING_OVERRIDE",
  name: string,
  targetingStrategy: "targeted-card",
  event: "ally-death" | "turn-end" | "next-action",
  targetCardId?: string,          // existing: for ally-death trigger
  targetedCardId: string,         // NEW: ID of enemy card to lock onto
  terminationEvent: string,       // required for TARGETING_OVERRIDE
  powerId?: string
}
```

### Validation Rules

| Context | `targeted-card` allowed? | Error |
|---------|-------------------------|-------|
| `SimpleAttackDto.targetingStrategy` | NO | 400 — "targeted-card strategy can only be used with targeting override skills" |
| `MultipleAttackDto.targetingStrategy` | NO | 400 — same |
| `SpecialDto.targetingStrategy` | NO | 400 — same |
| `BuffApplicationDto.targetingStrategy` | NO | 400 — same |
| `OtherSkillDto.targetingStrategy` (non-TARGETING_OVERRIDE) | NO | 400 — same |
| `OtherSkillDto.targetingStrategy` (TARGETING_OVERRIDE) | YES | — |

### Example: Targeting Override with Targeted Card

```json
{
  "kind": "TARGETING_OVERRIDE",
  "name": "Vengeance",
  "targetingStrategy": "targeted-card",
  "event": "ally-death",
  "targetCardId": "kaelion",
  "targetedCardId": "enemy-card-id",
  "terminationEvent": "lion-heritage-end",
  "powerId": "lion-heritage"
}
```

### Behavioral Contract

When `targeted-card` override is active:
- **Target alive**: Attack hits only that specific card (regardless of position)
- **Target dead or not found**: Attack produces empty damages array (card effectively skips attack)
- **Override reverted** (via termination event): Card resumes original targeting strategy

### Response — No New Step Kinds

No new step kinds are introduced. Existing `targeting_override` and `targeting_reverted` steps cover the lifecycle. The attack step will simply have an empty `damages` array when the targeted card is dead.
