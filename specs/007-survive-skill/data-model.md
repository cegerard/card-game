# Data Model: Survive Skill

## New Entities

### `SurviveSkill`

A single-responsibility interceptor: prevents the first fatal blow from killing a card and sets HP to 1.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Display name used in the `SurvivedReport` battle log step |
| `consumed` | `boolean` (private) | Whether the skill has already fired; starts `false` |

**Invariants**:
- `tryConsume()` returns `true` at most once per instance
- Once consumed, all calls to `tryConsume()` return `false`

**Methods**:
- `tryConsume(): boolean` — atomically consumes and returns `true` if not yet used

*No `Alteration[]` field. No `launchBuffs()` method. Post-survival buffs are separate `AlterationSkill` instances in `skills.others` triggered by the `'survived'` event.*

---

### `SurvivedTrigger`

New trigger class matching the `'survived'` event string. Mirrors `TurnEnd`.

```typescript
class SurvivedTrigger implements Trigger {
  public id = 'survived';
  isTriggered(triggerId: string): boolean {
    return triggerId === this.id;
  }
}
```

---

### `SurvivedReport` (step type)

Emitted in the battle log when the Survive skill fires.

| Field | Type | Description |
|-------|------|-------------|
| `kind` | `StepKind.Survived` (`'survived'`) | Step discriminator |
| `name` | `string` | Name of the survive skill |
| `card` | `CardInfo` | The card that survived |

---

## Modified Entities

### `FightingCard`

| Change | Description |
|--------|-------------|
| New optional field `private surviveSkill: SurviveSkill \| null` | Stores the survive skill instance if configured |
| Constructor `skills.survive?: SurviveSkill` | Optional parameter, parallel to `skills.simpleAttack` and `skills.special` |
| `applyFinalDamage()` — extends return with `survived?` and `survivedSkillName?` | When a fatal blow is intercepted, caps damage so HP = 1 and returns the skill name |

**`applyFinalDamage()` modified return type** (`FinalDamageResult`):

```
FinalDamageResult = {
  damageToHealth: number;
  shieldAbsorbed: number;
  survived?: boolean;           // NEW — true when SurviveSkill intercepted this hit
  survivedSkillName?: string;   // NEW — name of the SurviveSkill (for SurvivedReport)
}
```

**Interception logic** (inside `applyFinalDamage`):
1. Compute `damageToHealth` as before (after shield absorption and freeze/stunt amplification)
2. If `actualHealth - damageToHealth <= 0` AND `surviveSkill?.tryConsume()`:
   - Set `damageToHealth = actualHealth - 1` (so remaining health = 1)
   - Return `{ damageToHealth, shieldAbsorbed, survived: true, survivedSkillName: surviveSkill.name }`

---

### `AttackResult`

| Change | Description |
|--------|-------------|
| `survived?: boolean` | Set to `true` when the defender survived a fatal blow via SurviveSkill |
| `survivedSkillName?: string` | Name of the SurviveSkill (only present when `survived: true`) |

---

### `ActionStage`

When processing an `AttackResult` with `survived: true` (in `handleAttackResult`):

1. Emit `SurvivedReport`
2. Call `card.launchSkills('survived', context)` — fires any `AlterationSkill` (or other skill) configured with `event: 'survived'`
3. Emit resulting steps via `skillResultsToSteps()`

The card is alive (not dead) at this point, so no `status_change: dead` is emitted.

---

### `StepKind` enum

| New value | String |
|-----------|--------|
| `Survived` | `'survived'` |

---

### `Step` union type

`SurvivedReport` added to the `Step` union.

---

### `TriggerEvent` enum (DTO)

| New value | String |
|-----------|--------|
| `SURVIVED` | `'survived'` |

---

## State Transitions

```
SurviveSkill state machine:

  READY ──(fatal blow)──► CONSUMED
    └─ tryConsume() → true      └─ tryConsume() → false
    └─ HP set to 1
    └─ 'survived' event fired
    └─ AlterationSkills with event:'survived' launch
```

```
FightingCard health on fatal blow (with survive):

  Before: health = H, incoming damage = D where D >= H
  After:  health = 1  (instead of 0)
  SurvivedReport emitted, then buff steps from any AlterationSkill(event:'survived')
```

## Ordering of Steps (battle log)

When Survive skill fires on a given hit:

```
[attack/special_attack step]
  → survived step      (new StepKind.Survived)
  → buff/debuff step(s) from AlterationSkills with event:'survived' (zero or more)
```

No `{ kind: "status_change", status: "dead" }` for this hit.
These steps are emitted inside `handleAttackResult` in `ActionStage`.
