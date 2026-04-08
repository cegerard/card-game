# Research: Targeted Card Strategy — Dynamic Resolution (v2)

## R1: Where is the killer identity available when a card dies?

**Decision**: The killer is the attacking card — available in `ActionStage` methods (`launchAttack`, `launchSpecial`, `launchNextActionSkills`) that call `handleAttackResult`. The attacker `FightingCard` reference is in scope when `notifyDeath` is called inside `handleAttackResult`.

**Rationale**: In `ActionStage.handleAttackResult()`, each `AttackResult` contains the `defender` that took damage. When `defender.isDead()`, we call `this.notifyDeath(defensiveCard)`. The attacker is known from the calling method's context (it's the `card` parameter in `launchAttack`/`computeSpecialAttackResult`/`launchNextActionSkills`). We just need to pass it through.

For `TurnManager.processCardEffectStates()` — deaths from status effects (poison, burn, freeze) have no killer. This is correct: a state-effect death should not trigger a "target the killer" override, since there's no attacker. The `killerCard` parameter should be optional.

**Alternatives considered**:
- Storing the last attacker on the card itself: Creates coupling and mutable state — rejected per Constitution V.
- Tracking kill attribution separately in a service: Over-engineering — rejected per Constitution III.

## R2: How to propagate killer identity to skills?

**Decision**: Add an optional `killerCard?: FightingCard` field to `FightingContext`. The `DeathSkillHandler.notifyDeath()` already builds a `FightingContext` for `card.launchSkills()` — add the killer there.

**Rationale**: `FightingContext` is the existing context object passed to `Skill.launch()`. Adding a field there flows naturally through the existing interface without changing method signatures on `Skill`, `FightingCard.launchSkills()`, or any other skill implementation. Only `TargetingOverrideSkill` will use it — others ignore it.

The chain: `ActionStage.handleAttackResult` → `notifyDeath(deadCard, killerCard)` → `CardDeathSubscriber.notifyDeath(player, deadCard, killerCard)` → `DeathSkillHandler` builds context with `killerCard` → `card.launchSkills(trigger, context)` → `TargetingOverrideSkill.launch(source, context)` reads `context.killerCard`.

**Alternatives considered**:
- Passing killerCard as a separate parameter on `Skill.launch()`: Breaks the interface for all 6+ skill implementations that don't need it. Rejected per Constitution III (minimal change).
- Creating a separate `DeathContext` type: Unnecessary specialization — `FightingContext` is already the carrier. Rejected per Constitution III.

## R3: How should TargetingOverrideSkill resolve the strategy dynamically?

**Decision**: `TargetingOverrideSkill` accepts either a pre-built `TargetingCardStrategy` (existing behavior for non-targeted-card overrides) or a strategy resolver function `(context: FightingContext) => TargetingCardStrategy`. In `launch()`, if a resolver is present, it calls it with the context to produce the strategy.

**Rationale**: This is the minimal change that supports both static strategies (like `target-all` overrides that already work) and dynamic resolution (like `targeted-card` that needs the killer's ID). The resolver is a plain function — no new class, interface, or abstraction.

Concretely: the controller passes `(ctx) => new TargetedCard(ctx.killerCard.id)` as the resolver when `targetingStrategy` is `targeted-card`.

**Alternatives considered**:
- Always using a resolver (wrapping static strategies): Adds indirection to all existing overrides for no benefit. Rejected per Constitution III.
- Adding a `TargetResolutionMode` enum and switch in the skill: Creates coupling between the skill and specific resolution strategies. Rejected per Constitution I.

## R4: What happens to `targetedCardId` in the DTO?

**Decision**: Remove `targetedCardId` from `OtherSkillDto`. The target is no longer configured statically — it comes from the trigger context (killer identity). The DTO validation for `TARGETING_OVERRIDE` + `targeted-card` no longer needs a `targetedCardId` field.

**Rationale**: The `targetedCardId` field was designed for static resolution. With dynamic resolution, the target is determined at runtime. Keeping the field would be misleading and unused.

The `TargetedCardIdRequiredConstraint` validator should be removed since the field no longer exists.

**Alternatives considered**:
- Keeping `targetedCardId` as optional for future static-targeting use cases: YAGNI — rejected per Constitution III. Can be re-added if needed.

## R5: What if killerCard is undefined when a targeted-card override triggers?

**Decision**: If `context.killerCard` is undefined when the resolver runs, throw an error. This is a programming error — a `targeted-card` strategy triggered without a killer context means the trigger event doesn't support killer resolution (e.g., `turn-end` trigger, which makes no sense for "target the killer").

**Rationale**: Fail fast per Constitution IV. In practice, `targeted-card` overrides will use `ally-death` triggers where the killer is always known (from combat). State-effect deaths (no killer) don't trigger ally-death skills through `ActionStage.handleAttackResult` — they go through `TurnManager.processCardEffectStates`, which passes no killer, but only for the card itself (state effects kill the affected card, not an ally).

Wait — correction: state-effect deaths DO fire ally-death triggers via `TurnManager.notifyDeath()`. If an ally dies from poison and a surviving ally has a `targeted-card` override triggered by that death, there's no killer. In this case, the resolver should return a no-op strategy (empty targets) rather than throwing — the override activates but has no target. This is consistent with the spec's edge case: "targeted card ID does not exist → strategy returns no targets."

**Revised Decision**: If `context.killerCard` is undefined, construct a `TargetedCard` with an impossible ID (e.g., empty string), which will always return `[]` from `targetedCards()`. This silently produces "no target" without crashing.

**Alternatives considered**:
- Throwing an error: Too aggressive — state-effect deaths are a valid scenario where no killer exists.
- Not activating the override at all: The override skill still activates (the trigger matched), but the strategy simply has no valid target. This is more consistent.
