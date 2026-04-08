# API Contract: Targeted Card Strategy — Dynamic Resolution (v2)

## Changes to POST /fight

### TargetingStrategy Enum

No change from v1 — `TARGETED_CARD = 'targeted-card'` remains in the enum.

### OtherSkillDto — Removed Field

```diff
- targetedCardId?: string   // REMOVED — target resolved dynamically at trigger time
```

The `targetedCardId` field is removed. The target is determined by the game engine at trigger time (e.g., the card that killed the ally).

### Validation Rules

| Context | `targeted-card` allowed? | Error |
|---------|-------------------------|-------|
| `SimpleAttackDto.targetingStrategy` | NO | 400 — "targeted-card strategy can only be used with targeting override skills" |
| `MultipleAttackDto.targetingStrategy` | NO | 400 — same |
| `SpecialDto.targetingStrategy` | NO | 400 — same |
| `BuffApplicationDto.targetingStrategy` | NO | 400 — same |
| `OtherSkillDto.targetingStrategy` (non-TARGETING_OVERRIDE) | NO | 400 — same |
| `OtherSkillDto.targetingStrategy` (TARGETING_OVERRIDE) | YES | — |

**Removed validation**: `TargetedCardIdRequiredConstraint` is removed since `targetedCardId` no longer exists.

### Example: Targeting Override with Targeted Card

```json
{
  "kind": "TARGETING_OVERRIDE",
  "name": "Vengeance",
  "targetingStrategy": "targeted-card",
  "event": "ally-death",
  "targetCardId": "kaelion",
  "terminationEvent": "lion-heritage-end",
  "powerId": "lion-heritage"
}
```

Note: No `targetedCardId` — the target is resolved dynamically (killer of the ally).

### Behavioral Contract

When `targeted-card` override is active:
- **Target alive**: Attack hits only the dynamically resolved target card
- **Target dead or not found**: Attack produces empty damages array (card effectively skips attack)
- **Override reverted** (via termination event): Card resumes original targeting strategy
- **Triggered by state-effect death** (no killer): Override activates but with no valid target — card skips attacks until override is reverted

### Response — No New Step Kinds

No changes to response format. Existing `targeting_override` and `targeting_reverted` steps cover the lifecycle.
