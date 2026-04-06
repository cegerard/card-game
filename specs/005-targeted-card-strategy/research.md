# Research: Targeted Card Strategy

## R1: How do existing targeting strategies resolve targets?

**Decision**: Follow the established `TargetingCardStrategy` interface pattern — implement `targetedCards()` returning `FightingCard[]`.

**Rationale**: All six existing strategies implement this interface. Returning an empty array signals "no valid target" and is already handled by `SimpleAttack.executeAttack()` (the `.map()` over an empty array produces no attack results). No special handling needed.

**Alternatives considered**: None. The interface is fixed and all strategies conform to it.

## R2: How does the targeting override mechanism pass context to the strategy?

**Decision**: The `TargetedCard` strategy receives the target card ID at construction time (in the controller when building the `TargetingOverrideSkill`). It looks up the card from the defending player's deck at call time.

**Rationale**: The `TargetingOverrideSkill` is constructed with a `TargetingCardStrategy` instance in the controller. The controller has access to the DTO's `targetCardId` field. At execution time, the strategy receives `attackingPlayer` and `defendingPlayer` — it searches the defending player's `allCards` for the matching ID.

**Alternatives considered**:
- Passing the card reference directly: Rejected because at DTO-to-domain conversion time, the opposing player's cards may not be fully constructed yet, and holding a direct reference creates coupling.
- Resolving the ID at override activation time: Unnecessary complexity — the strategy can resolve it each call, which also correctly handles the "card is now dead" case.

## R3: How to restrict the strategy to targeting overrides only?

**Decision**: Add a `TARGETED_CARD` value to the `TargetingStrategy` enum but do NOT add it to the `STRATEGY_MAP` in `targeting-strategy-factory.ts`. Instead, handle it specially in the `TARGETING_OVERRIDE` case of `createOtherSkill()`. Use custom DTO validation to reject `TARGETED_CARD` in `SimpleAttackDto.targetingStrategy`, `MultipleAttackDto.targetingStrategy`, `SpecialDto.targetingStrategy`, `BuffApplicationDto.targetingStrategy`, and non-override `OtherSkillDto.targetingStrategy`.

**Rationale**: The `TargetedCard` strategy requires a `targetCardId` parameter that only exists on `OtherSkillDto`. The cleanest approach is validation at the DTO layer — use a custom validator or conditional enum validation to reject `targeted-card` in contexts where it makes no sense. This is consistent with Constitution Principle IV (Fail Fast — validate at system boundaries).

**Alternatives considered**:
- Runtime throw in `buildTargetingStrategy()`: Would defer the error to battle execution time rather than input validation — violates Fail Fast.
- Separate enum for override-only strategies: Over-engineering for a single value — violates Simplicity.

## R4: What `targetCardId` field to use?

**Decision**: Reuse the existing `targetCardId` field on `OtherSkillDto`. For `TARGETING_OVERRIDE` skills using `targeted-card` strategy, the `targetCardId` serves double duty: it identifies both the ally-death trigger target AND the card to lock onto. However, for non-ally-death triggers, a new interpretation is needed — the `targetCardId` identifies the enemy card to target.

**Rationale**: Looking at the samples file, the `TARGETING_OVERRIDE` with `targeted-card` uses `ally-death` as its trigger event and already has a `targetCardId` for the ally whose death triggers the override. The enemy card to lock onto needs a separate field.

**Revised Decision**: Add a `targetedCardId` field to `OtherSkillDto` — this is the ID of the enemy card the strategy targets. The existing `targetCardId` remains for ally-death trigger configuration. This keeps the two concepts (trigger target vs attack target) clearly separated.

**Alternatives considered**:
- Reusing `targetCardId` for both: Creates ambiguity when the trigger event is `ally-death` — which card does it refer to? Better to have explicit fields.
- Adding targetedCardId to the TargetingStrategy enum value: Enums can't carry data in TypeScript.
