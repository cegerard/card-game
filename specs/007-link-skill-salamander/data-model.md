# Data Model: Kaelion Link Skill - Salamander Tears

## New Domain Concepts

### AllyHealthBelowThresholdTrigger (class)

Implements `ActivatableTrigger`. Edge-triggered: fires once when a specific ally's HP drops below a threshold, rearms when HP recovers above it.

| Field / Method | Type | Description |
| --- | --- | --- |
| `id` | `'ally-health-below-threshold'` | Stable trigger identity |
| `monitoredAllyId` | `string` | ID of the ally card to watch |
| `threshold` | `number` | HP ratio that triggers the skill (e.g. `0.3` for 30%) |
| `lastAttackerStrategy` | `LastAttackerOfAllyTargetingStrategy?` | Shared instance with the attack skill (optional — not used by buff skills) |
| *(private)* `wasAboveThreshold` | `boolean` | Arm state: `true` = above threshold, ready to fire |
| *(private)* `shouldFire` | `boolean` | Set to `true` only on a downward crossing detected in `activate()` |

**State transitions** (inside `activate(triggerId, context)`):

```
If triggerId does not match ally  → return (no-op)
Resolve ally from context.sourcePlayer.allCards
nowBelow = ally.healthRatio < threshold

Case 1: wasAboveThreshold=true  && nowBelow=true  → shouldFire=true,  wasAboveThreshold=false
                                                      (+ update lastAttackerStrategy)
Case 2: !nowBelow                                 → shouldFire=false, wasAboveThreshold=true
Case 3: wasAboveThreshold=false && nowBelow=true  → shouldFire=false  (already below, no re-fire)
```

**Event ID format**: `ally-health-${monitoredAllyId}` — dispatched by `ActionStage`.

---

### LastAttackerOfAllyTargetingStrategy (class)

Implements `TargetingCardStrategy`. Targets the enemy card that most recently hit the monitored ally.

| Field / Method | Type | Description |
| --- | --- | --- |
| `id` | `'last-attacker-of-ally'` | Strategy identity |
| `setLastAttacker(card)` | method | Updated by the trigger on threshold crossing |
| `targetedCards(...)` | method | Returns `[lastAttacker]` if alive, otherwise `[]` |

**Sharing**: one instance is created in the controller factory and injected into both `AllyHealthBelowThresholdTrigger` and the `SimpleAttack` inside `ConditionalAttack`.

---

### AlliedCardByIdStrategy (class)

Implements `TargetingCardStrategy`. Mirror of `TargetedCard` but searches `sourcePlayer` (ally) instead of `opponentPlayer` (enemy).

| Field | Type | Description |
| --- | --- | --- |
| `id` | `'allied-card-by-id'` | Strategy identity |
| `allyId` | `string` | ID of the allied card to target |

`targetedCards(_source, sourcePlayer, _opponentPlayer)`: finds `sourcePlayer.allCards.find(c => c.id === allyId)`. Returns `[]` if absent or dead.

---

## Modified Domain Concepts

### FightingContext (extended)

One new optional field:

| Field | Type | Description |
| --- | --- | --- |
| `lastAttacker?` | `FightingCard` | Enemy card that just hit the ally. Populated by `ActionStage` when dispatching `ally-health-<id>`. |

Same pattern as the existing `killerCard` — situational context passed to a trigger via `activate()`.

---

### ConditionalAttack (minimal changes)

Two additions only — constructor signature is unchanged:

1. **`AlwaysTrueAttackCondition`** (new file alongside existing condition implementations):
   ```typescript
   export class AlwaysTrueAttackCondition implements AttackCondition {
     isTriggered(): boolean { return true; }
     tick(): void {}
     reset(): void {}
   }
   ```
   The controller factory passes `new AlwaysTrueAttackCondition()` as the condition for Salamander Tears. No existing usages or tests are affected.

2. **`activate()` method**: identical delegation pattern to `AlterationSkill` — calls `(this.trigger as ActivatableTrigger).activate(triggerId, context)` if the trigger implements it.

---

## Composition in the Controller

For Kaelion's "Salamander Tears" skill, the factory creates **3 skills** inside `others`:

```
Skill 1: ConditionalAttack
  └─ name: "Salamander Tears"
  └─ attackSkill: SimpleAttack(name, [{FIRE, 2.0}], lastAttackerStrategy)
  └─ trigger: AllyHealthBelowThresholdTrigger(arionisId, 0.3, lastAttackerStrategy)
  └─ condition: none (omitted)
  └─ powerId: "salamander-tears"

Skill 2: AlterationSkill (attack buff)
  └─ polarity: 'buff', type: 'attack', rate: 0.1, duration: 5
  └─ trigger: AllyHealthBelowThresholdTrigger(arionisId, 0.3)
  └─ targetingStrategy: AlliedCardByIdStrategy(arionisId)
  └─ powerId: "salamander-tears"

Skill 3: AlterationSkill (defense buff)
  └─ polarity: 'buff', type: 'defense', rate: 0.2, duration: 5
  └─ trigger: AllyHealthBelowThresholdTrigger(arionisId, 0.3)
  └─ targetingStrategy: AlliedCardByIdStrategy(arionisId)
  └─ powerId: "salamander-tears"
```

`lastAttackerStrategy` is a **shared instance** between Skill 1 and its trigger.  
Each skill owns its **own trigger instance** (independent `wasAboveThreshold` state).

---

## Dispatch in ActionStage

After each non-dodged hit in `handleAttackResult()`:

```typescript
if (!damageDealt.dodge) {
  const damagedCardPlayer = this.player1.ownCard(defensiveCard) ? this.player1 : this.player2;
  const attackerPlayer = damagedCardPlayer === this.player1 ? this.player2 : this.player1;
  const allyHealthContext: FightingContext = {
    sourcePlayer: damagedCardPlayer,
    opponentPlayer: attackerPlayer,
    lastAttacker: attackerCard,
  };
  damagedCardPlayer.playableCards
    .filter((c) => c !== defensiveCard)
    .forEach((caster) => {
      const results = caster.launchSkills(`ally-health-${defensiveCard.id}`, allyHealthContext);
      report.statusChanges.push(...skillResultsToSteps(caster, results));
    });
}
```

No changes to `skill-results-to-steps.ts` — results are existing `SkillKind.Attack` and `SkillKind.Buff`.

---

## Fight Log Impact

No new `StepKind`. Existing step kinds are sufficient:

```
Step N:   { kind: 'attack', name: 'Salamander Tears', attacker: KaelionInfo, damages: [...], powerId: 'salamander-tears' }
Step N+1: { kind: 'buff',   name: 'Salamander Tears', source: KaelionInfo, alterations: [attack +X on Arionis], powerId: 'salamander-tears' }
Step N+2: { kind: 'buff',   name: 'Salamander Tears', source: KaelionInfo, alterations: [defense +Y on Arionis], powerId: 'salamander-tears' }
```

If the explosion is skipped (last attacker dead or absent), only steps N+1 and N+2 appear.

---

## DTO Layer

### New enum values

| Enum | Added value | Description |
| --- | --- | --- |
| `TriggerEvent` (DTO) | `ALLY_HEALTH_BELOW = 'ally-health-below'` | HP threshold event on an ally |
| `TargetingStrategy` (DTO) | `LAST_ATTACKER_OF_ALLY = 'last-attacker-of-ally'` | For the `CONDITIONAL_ATTACK` skill |
| `TargetingStrategy` (DTO) | `LINKED_ALLY = 'linked-ally'` | For the `ALTERATION` buff skills |

### OtherSkillDto — reused fields

No new DTO field required: `targetCardId` (already present, extended to cover `ALLY_HEALTH_BELOW`) and `activationCondition` (already present for `SHIELD`, reused here for the threshold).
