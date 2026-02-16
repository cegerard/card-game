---
name: Multi-Damage Type System
description: Feature implementation plan
argument-hint: N/A
---

# Instruction: Implement Multi-Damage Type System with Elemental Matrix

## Feature

- **Summary**: Enable attacks to inflict multiple damage types simultaneously (physical + elemental) with element-based effectiveness matrix for damage calculation
- **Stack**: `TypeScript 5.x`, `NestJS 10.x`, `Jest 29.x`
- **Branch name**: `feat/multi-damage-type-system`

## Existing files

- @src/fight/core/cards/fighting-card.ts
- @src/fight/core/cards/skills/simple-attack.ts
- @src/fight/core/cards/skills/special-attack.ts
- @src/fight/core/cards/skills/skill.ts
- @src/fight/core/cards/@types/action-result/attack-result.ts
- @src/fight/core/fight-simulator/@types/damage-report.ts
- @src/fight/http-api/dto/fight-data.dto.ts
- @src/fight/http-api/fight.controller.ts

### New files to create

- src/fight/core/cards/@types/damage/damage-type.ts
- src/fight/core/cards/@types/damage/damage-composition.ts
- src/fight/core/cards/@types/damage/element.ts
- src/fight/core/cards/damage/elemental-matrix.ts
- src/fight/core/cards/damage/damage-calculator.ts

## Implementation phases

### Phase 1: Domain Model Foundation

> Add element property to FightingCard and create damage type value objects

1. Create enum for Element types (PHYSICAL, FIRE, WATER, EARTH, AIR) in element.ts
2. Create enum for DamageType matching Element values in damage-type.ts
3. Create DamageComposition value object with type and rate properties in damage-composition.ts
4. Add element property to FightingCard class with validation
5. Add element to CardDto with class-validator decorators
6. Update FightingCard constructor to accept element parameter
7. Write unit tests for FightingCard element property

### Phase 2: Elemental Matrix System

> Implement elemental effectiveness matrix and multi-damage calculation engine

1. Create ElementalMatrix class with hard-coded 5x5 multiplier matrix in elemental-matrix.ts
2. Implement getMultiplier(attackType: DamageType, defenderElement: Element) method
3. Create DamageCalculator class in damage-calculator.ts
4. Implement calculateDamage(damages: DamageComposition[], attackStat: number, defender: FightingCard) method
5. Implement per-type calculation flow (brute damage → matrix multiplier → defense → sum)
6. Add default behavior for empty damages array (100% physical)
7. Write unit tests for ElementalMatrix multiplier lookups
8. Write unit tests for DamageCalculator with various compositions

### Phase 3: Attack System Integration

> Modify SimpleAttack, Special, and Skill to use multi-damage calculation

1. Add damages property to SimpleAttack constructor replacing damageRate
2. Update SimpleAttack.launch() to use DamageCalculator instead of inline calculation
3. Update AttackResult type to include damageBreakdown: {type: DamageType, amount: number}[]
4. Add damages property to Special interface and SpecialAttack class
5. Update SpecialAttack damage computation to use DamageCalculator
6. Update Skill classes that deal damage to support damages composition
7. Ensure critical hit multiplier applies before type calculations
8. Ensure dodge mechanics work with new system
9. Ensure frozen state damage multiplier applies after summing all types
10. Write unit tests for SimpleAttack with single and dual damage types
11. Write unit tests for SpecialAttack with elemental interactions
12. Write integration tests for full attack flow with matrix multipliers

### Phase 4: API Layer & DTOs

> Update DTOs, validation, and factory functions for HTTP layer

1. Create DamageCompositionDto with type and rate properties
2. Add validation decorators (IsEnum, IsNumber, Min(0), Max with 1 decimal)
3. Replace damageRate with damages array in SimpleAttackDto
4. Replace rate with damages array in SpecialDto
5. Add ArrayMaxSize(2) validator to damages property
6. Update element property to CardDto with IsEnum validator
7. Update FightController card factory to map element from DTO
8. Update FightController attack factories to map damages compositions
9. Add default damages=[{type: PHYSICAL, rate: 100}] when damages is undefined
10. Update DamageReport type to include damage breakdown by type
11. Write HTTP integration tests with multi-damage DTOs

### Phase 5: Testing & Backward Compatibility

> Ensure existing tests pass and add comprehensive coverage

1. Update test helper functions to include element in card creation
2. Set default element to PHYSICAL for existing test cards
3. Update existing attack tests to use damages array instead of damageRate
4. Add test cases for each elemental interaction from matrix
5. Add test cases for edge cases (0% damage, >100% total, single type)
6. Add test cases for backward compatibility (missing damages field)
7. Add E2E test for full fight with elemental interactions
8. Run full test suite and fix any breaking changes
9. Verify test coverage meets project standards

## Reviewed implementation

- [x] Phase 1: Domain Model Foundation
- [x] Phase 2: Elemental Matrix System
- [ ] Phase 3: Attack System Integration
- [ ] Phase 4: API Layer & DTOs
- [ ] Phase 5: Testing & Backward Compatibility

## Validation flow

1. Create two cards with different elements via POST /fight endpoint
2. Configure first card with multi-damage attack (30% physical, 20% fire)
3. Configure second card as water element (should resist fire: 0.35x)
4. Execute fight and verify damage calculation in response
5. Confirm damage breakdown shows both physical and fire damage
6. Verify fire damage reduced by water resistance (0.35 multiplier)
7. Test backward compatibility by sending attack without damages field
8. Verify default 100% physical damage applied

## Estimations

- Confidence: 9/10
  - ✅ Clear requirements with specific matrix values
  - ✅ Existing architecture supports composition pattern
  - ✅ Factory pattern already established in codebase
  - ✅ Test infrastructure comprehensive
  - ✅ Backward compatibility well-defined
  - ❌ Risk: Integration with critical hit and frozen state multipliers needs careful ordering
- Complexity: Medium
- Estimated effort: 6-8 hours implementation + 2-3 hours testing
