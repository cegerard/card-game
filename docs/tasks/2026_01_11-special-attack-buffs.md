# Instruction: Add Buff Application to Special Attacks

## Feature

- **Summary**: Enable special attacks to apply buffs to targeted cards after the attack. Example: after a special attack, a card can add attack and defense buffs to its allies.
- **Stack**: `Node.js 20`, `NestJS 10`, `TypeScript`, `Jest 29`, `class-validator 0.14.1`
- **Branch name**: `feature/special-attack-buffs`

## Existing files

- @src/fight/core/cards/skills/special-attack.ts
- @src/fight/core/cards/skills/special.ts
- @src/fight/core/cards/@types/action-result/special-result.ts
- @src/fight/core/card-action/action_stage.ts
- @src/fight/http-api/fight.controller.ts
- @src/fight/http-api/dto/fight-data.dto.ts
- @src/fight/core/cards/@types/buff/buff.ts
- @src/fight/core/cards/@types/buff/type.ts
- @src/fight/core/cards/fighting-card.ts
- @src/fight/core/targeting-card-strategies/targeting-card-strategy.ts

### New file to create

None - Feature extends existing architecture

## Implementation phases

### Phase 1: Extend Special Attack Domain Model

> Add buff configuration and application logic to SpecialAttack class

1. Add optional buff configuration to SpecialAttack constructor (buff type, rate, duration, targeting strategy)
2. Update SpecialAttack.launch() to apply buffs after damage calculation to targeted cards
3. Extend SpecialResult type to include optional buff application results
4. Add unit tests for SpecialAttack with buff application scenarios

### Phase 2: Update HTTP API Layer

> Enable API to accept buff configuration for special attacks

1. Extend SpecialDto in fight-data.dto.ts to include optional buff field (buffType, buffRate, buffDuration, buffTargetingStrategy)
2. Add validation decorators for buff field using class-validator
3. Update FightController.createSpecial() to instantiate SpecialAttack with buff configuration
4. Add unit tests for FightController with buff configuration in special attacks

### Phase 3: Integrate Buff Reporting in Combat Resolution

> Report buff application in fight result steps after special attacks

1. Update ActionStage.computeSpecialAttackResult() to extract and report buff results from special attack
2. Ensure buff application appears in fight result steps as BuffReport entries
3. Add e2e test validating complete flow: API request with special attack buffs → fight simulation → buff application in result
4. Verify buff duration decreases correctly in subsequent turns via TurnManager

## Reviewed implementation

- [ ] Phase 1: Extend Special Attack Domain Model
- [ ] Phase 2: Update HTTP API Layer
- [ ] Phase 3: Integrate Buff Reporting in Combat Resolution

## Validation flow

1. Send POST /fight request with special attack containing buff configuration (buffType: attack, buffRate: 0.2, buffDuration: 3, buffTargetingStrategy: all-allies)
2. Verify fight result includes special attack step followed by buff application steps
3. Confirm buffed cards show increased stats in subsequent turn actions
4. Validate buff duration decreases each turn until expiration
5. Check that multiple buffs from different sources stack correctly

## Estimations

- **Confidence**: 9/10
  - ✅ Existing buff system (BuffSkill) provides clear pattern to follow
  - ✅ SpecialAttack already handles optional effects (poison, burn, freeze) - same pattern applies
  - ✅ Targeting strategies and buff application logic already implemented
  - ✅ Test infrastructure (unit + e2e) already covers buff mechanics
  - ❌ Risk: Buff targeting strategy might differ from attack targeting (e.g., attack enemies, buff allies) - requires careful strategy parameter design
- **Time to implement**: 2-3 hours
  - Phase 1: 45 minutes
  - Phase 2: 45 minutes
  - Phase 3: 60-90 minutes (including comprehensive e2e testing)
