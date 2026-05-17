# Research: Survive Skill

## Q1 — How should the fatal-blow interception integrate with the existing damage pipeline?

**Decision**: Intercept inside `FightingCard.applyFinalDamage()`.

**Rationale**: `applyFinalDamage` is the single point in the domain where health is actually decremented. Placing the interception there keeps the logic encapsulated in `FightingCard`, requires no coupling between `ActionStage` and the skill mechanism, and ensures it applies regardless of whether the kill comes from `SimpleAttack`, `MultipleAttack`, or `SpecialAttack`.

**Alternatives considered**:
- Intercept in `ActionStage.handleAttackResult` — would require `ActionStage` to know about the survive skill directly and duplicate the check across every code path that can kill a card.
- New `HealthReactiveSkill` variant — the existing `HealthReactiveSkill` triggers **after** health changes via `onHealthChanged()`; for survive we need to intercept **before** the death is committed, which is architecturally incompatible.

---

## Q2 — How should the optional post-survival buffs be launched?

**Decision**: Post-survival buffs are NOT embedded in `SurviveSkill`. Instead, `ActionStage` fires a `'survived'` event via `card.launchSkills('survived', context)` after intercepting the fatal blow. Any `AlterationSkill` (or other skill kind) configured with `event: 'survived'` in `skills.others` fires naturally through the existing event-trigger system.

**Rationale**: Embedding `Alteration[]` inside `SurviveSkill` and adding a `launchSurviveBuffs()` method to `FightingCard` would pollute all cards' public API for a concern that only exists when the survive skill is present. The existing event-driven architecture already solves exactly this problem: `TurnEnd` fires `'turn-end'`, `DeathTrigger` fires `'ally-death:<id>'` — adding a `'survived'` event follows the same pattern with zero new abstractions. `SurviveSkill` becomes a pure single-responsibility interceptor.

**What this requires**: a new `SurvivedTrigger` class (mirrors `TurnEnd`), `TriggerEvent.SURVIVED = 'survived'` in the DTO enum, and one entry in `trigger-factory.ts`'s strategy map.

**Alternatives considered**:
- `SurviveSkill` holds `Alteration[]` + `launchBuffs()` on `FightingCard` — functional but pollutes `FightingCard`'s public API with a method irrelevant to cards without the skill.
- Inline buff application in `applyFinalDamage` — impossible: `FightingContext` is not available inside `FightingCard`.

---

## Q3 — Where should `SurviveSkill` live in the `FightingCard` constructor?

**Decision**: `SurviveSkill` is an **optional named field** in the `skills` parameter object (`skills.survive?: SurviveSkill`), parallel to `skills.simpleAttack` and `skills.special`. It is NOT placed in `skills.others`.

**Rationale**: The survive skill has no event trigger and is never iterated by the `launchSkills` loop. Placing it in `others` would require special-casing or filtering it out there, which adds noise. Treating it as a dedicated optional field is consistent with how `simpleAttack` and `special` are handled — both are implicit mechanics, not event-triggered reactions.

**Alternatives considered**:
- In `others` array with a sentinel value — would require filtering out the survive skill from the event-trigger loop, which violates single-responsibility.

---

## Q4 — What new step kind should represent survival?

**Decision**: `StepKind.Survived = 'survived'`. Report type: `SurvivedReport = { kind: StepKind.Survived; name: string; card: CardInfo }`.

**Rationale**: Survival is a distinct event — the card did not die and did not receive a normal status change. A dedicated step kind keeps the battle log semantically clear; clients can detect survival unambiguously.

**Alternatives considered**:
- Reuse `StatusChangeReport` with a new `'survived'` status — muddies the status_change step which is currently used only for death and ailments.

---

## Q5 — How to model the DTO for survive skill buffs?

**Decision**: No new DTO fields needed for buffs. Post-survival buffs are configured as separate `OtherSkillDto` entries with `kind: ALTERATION` and `event: 'survived'`. The existing `ALTERATION` DTO shape covers all cases (type, rate, duration, targeting, polarity, terminationEvent).

**Rationale**: Piggybacks entirely on the existing event trigger system. Zero new DTO surface area for buffs; the user already knows how to configure `ALTERATION` skills.

**Alternatives considered**:
- `statAlterations?: StatAlterationDto[]` on `OtherSkillDto` — works but introduces a new optional field only meaningful for one skill kind, duplicating the semantics of separate ALTERATION skills.

---

## Q6 — Multi-hit attacks: which hit triggers survive?

**Decision**: The first hit in a multi-hit sequence that would be fatal triggers the survive skill. Subsequent hits in the same action proceed normally after the card survives at 1 HP.

**Rationale**: Natural consequence of interception inside `applyFinalDamage` — the skill is consumed on the first fatal application, and later hits see a live card at 1 HP.

**Implication**: `survived: true` is returned only on the hit that triggered survival. Subsequent hits that kill the card at 1 HP emit a normal death.
