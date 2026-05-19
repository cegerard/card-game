# Research: Kaelion Link Skill - Salamander Tears

## Q1 — How to model the ally-health trigger without creating a new Skill interface?

**Decision**: Create a new `AllyHealthBelowThresholdTrigger` implementing `ActivatableTrigger`. Reuse `ConditionalAttack` and `AlterationSkill` unchanged.

**Rationale**: Triggering logic belongs in the `Trigger`, not in the `Skill`. All existing skills (`ConditionalAttack`, `AlterationSkill`) can change behavior simply by swapping their trigger. No new skill class is needed — only a new trigger type, which is the natural extension point of the current design (`DeathTrigger`, `DynamicTrigger` follow this same pattern).

**Alternatives rejected**:
- `AllyHealthReactiveSkill` interface + composite `SalamanderTearsSkill`: too many new concepts for a single skill. The trigger is the correct extension point.
- Encoding the threshold detection directly in `ActionStage`: mixes triggering logic with orchestration logic.

---

## Q2 — How to pass `lastAttacker` to the trigger at activation time?

**Decision**: Add `lastAttacker?: FightingCard` to `FightingContext`. `ActionStage` populates this field when dispatching the `ally-health-<id>` event after each non-dodged hit. `AllyHealthBelowThresholdTrigger.activate()` reads `context.lastAttacker` and updates `LastAttackerOfAllyTargetingStrategy`.

**Rationale**: `FightingContext.killerCard` already passes situational context to `DynamicTrigger`. `lastAttacker` follows the exact same pattern — situational context that a trigger must be able to read during `activate()`.

**Alternatives rejected**:
- Storing the last attacker on `FightingCard` (Arionis): exposes a skill implementation detail on the domain entity.
- Injecting the Arionis card reference into the trigger at construction time: requires a two-pass creation (create all cards, then rewire skills) in the controller.

---

## Q3 — How does the trigger know Arionis' HP without a direct card reference?

**Decision**: The trigger stores `monitoredAllyId` (string). In `activate(triggerId, context)`, it resolves the ally via `context.sourcePlayer.allCards.find(c => c.id === monitoredAllyId)`. The HP has already been updated by the time `activate()` is called.

**Rationale**: Avoids a two-pass construction in the controller. Resolution via context mirrors the pattern used by `TargetedCard` and `DynamicTrigger` (which use `context.killerCard`). The ally is always in `sourcePlayer` because `ActionStage` builds the context from the caster's (Kaelion's) perspective.

---

## Q4 — How is `LastAttackerOfAllyTargetingStrategy` shared between the trigger and the attack skill?

**Decision**: In the controller factory, for `CONDITIONAL_ATTACK` with event `ALLY_HEALTH_BELOW`, manually create a shared `LastAttackerOfAllyTargetingStrategy` instance, inject it into both the trigger and the `SimpleAttack`. The trigger calls `strategy.setLastAttacker(context.lastAttacker)` on threshold crossing.

**Rationale**: The factory is the right place for this wiring. It mirrors what the existing factory already does for `TARGETING_OVERRIDE` with `targeted-card` — it creates the `TargetedCard` strategy in a non-standard way. Same pattern here.

**Alternatives rejected**:
- Sharing one trigger instance across all 3 skills: `launchSkills()` calls `activate()` sequentially on each skill — the same shared trigger would receive 3 `activate()` calls, resetting `shouldFire` to `false` on the 2nd call. Incorrect behavior.
- Resolving the target inside `ConditionalAttack.launch()` via context: `AttackSkill.launch()` does not receive `lastAttacker` explicitly; would require changing the `TargetingCardStrategy` interface to accept context, impacting the entire system.

---

## Q5 — How to target Arionis specifically for the buffs?

**Decision**: Create `AlliedCardByIdStrategy(allyId: string)` — same pattern as `TargetedCard` but searches `sourcePlayer.allCards` instead of `opponentPlayer`. Returns `[]` if card is dead or absent.

**Rationale**: `TargetedCard` targets an enemy by ID. `AlliedCardByIdStrategy` targets an ally by ID. Minimal duplication — two mirror classes with one difference: `sourcePlayer` vs `opponentPlayer`.

---

## Q6 — How does `ConditionalAttack` support the new pattern?

**Decision**: Two minimal changes to `ConditionalAttack`:
1. Make `AttackCondition` optional (if absent, always `true`)
2. Add `activate()` delegating to the trigger if it implements `ActivatableTrigger` — same pattern as `AlterationSkill`

**Rationale**: For Salamander Tears, the condition IS the trigger (threshold crossing). No `EveryNTurnsCondition` needed. Making the condition optional avoids a useless `AlwaysTrueAttackCondition` class. Adding `activate()` is an exact copy of what `AlterationSkill` already does.

---

## Q7 — Where in `ActionStage` to dispatch the ally-health event?

**Decision**: In `handleAttackResult()`, after the shield-broken check and BEFORE the dead/alive branch split, if `!damageDealt.dodge`: dispatch `ally-health-${defensiveCard.id}` to all living cards on the same team as the damaged card (excluding the damaged card itself), with `lastAttacker = attackerCard` in the context.

**Rationale**: Must fire even if Arionis dies from the hit (spec edge case: "death below 30% counts as threshold crossing"). Dispatching before the dead/alive split covers both cases. The `!damageDealt.dodge` guard is correct — a dodge produces no HP change.

---

## Q8 — Do the 3 separate trigger instances all detect the crossing correctly?

**Decision**: Yes. Each skill owns its own `AllyHealthBelowThresholdTrigger` instance with independent `wasAboveThreshold` state. They all read the same Arionis HP during `activate()`. They all detect the same crossing simultaneously. `shouldFire` is reset to `false` in the non-crossing branches of `activate()`.

**Trigger state after each `activate(triggerId, context)` call**:

```
First hit BELOW threshold:              shouldFire=true,  wasAboveThreshold=false
Subsequent hits BELOW threshold:        shouldFire=false  (else branch — already below, no re-fire)
Hit bringing HP ABOVE threshold:        shouldFire=false, wasAboveThreshold=true  (rearm)
Next hit BELOW threshold (2nd crossing): shouldFire=true  ← fires again correctly
```
