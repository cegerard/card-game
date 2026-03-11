# Instruction: Multiple Attack (Combo)

## Feature

- **Summary**: Add a `MultipleAttack` skill as an alternative to `SimpleAttack`, executing N consecutive hits against targets. Each hit independently computes critical/dodge. An optional amplifier increases the damage rate on each successive hit.
- **Stack**: `Node.js 20`, `NestJS 10`, `TypeScript`, `Jest 29`
- **Branch name**: `feat/multiple-attack`

## Existing files

- @src/fight/core/cards/skills/simple-attack.ts
- @src/fight/core/cards/fighting-card.ts
- @src/fight/http-api/dto/fight-data.dto.ts
- @src/fight/http-api/fight.controller.ts
- @test/helpers/fighting-card.ts

### New file to create

- `src/fight/core/cards/skills/attack-skill.ts` — interface `AttackSkill` with `launch(card, context): AttackResult[]`
- `src/fight/core/cards/skills/multiple-attack.ts` — `MultipleAttack` class implementing `AttackSkill`
- `src/fight/core/cards/__tests__/multiple-attack.spec.ts` — unit tests

## Implementation phases

### Phase 1: Domain — AttackSkill interface + MultipleAttack entity

> Extract a shared interface and implement the combo-attack logic.

1. Create `AttackSkill` interface in `attack-skill.ts` with single method `launch(card: FightingCard, context: FightingContext): AttackResult[]`
2. Make `SimpleAttack` implement `AttackSkill`
3. Create `MultipleAttack` implementing `AttackSkill`:
   - Constructor: `hits: number`, `damages: DamageComposition[]`, `targetingStrategy: TargetingCardStrategy`, `amplifier: number = 0`, `effect?: AttackEffect`
   - `launch()`: for each hit index `i` from `0` to `hits - 1`, attack power = `card.actualAttack * (1 + amplifier * i)`; for each target, resolve critical/dodge/damage independently; skip dead targets between hits
   - Return flat `AttackResult[]` (one entry per hit per target)
4. Update `FightingCard`: change `simpleAttack` property type and constructor parameter from `SimpleAttack` to `AttackSkill`

### Phase 2: HTTP API — DTO + Controller

> Expose `MultipleAttack` configuration via the REST API.

1. Add `MultipleAttackDto` class in `fight-data.dto.ts`:
   - `name: string`, `hits: number`, `damages: DamageCompositionDto[]`, `targetingStrategy: TargetingStrategy`, `amplifier?: number`, `effect?: EffectDto`
2. In `SkillsDto`, make `simpleAttack` optional (`@IsOptional()`) and add optional `multipleAttack: MultipleAttackDto`
3. In `fight.controller.ts`, build the attack skill: if `multipleAttack` is present, instantiate `MultipleAttack`; otherwise fall back to `SimpleAttack`

### Phase 3: Tests

> Cover MultipleAttack behavior with unit tests.

1. Test N hits without amplifier: all hits use base attack power
2. Test N hits with amplifier: each hit damage increases by `amplifier * hitIndex`
3. Test dodge on individual hit: dodged hits return `damage: 0`, non-dodged hits deal damage
4. Test dead target skipped between hits (if first hit kills, subsequent hits skip that target)
5. Update `createFightingCard()` helper if needed to support `MultipleAttack` as `simpleAttack`

## Reviewed implementation

- [ ] Phase 1 — Domain
- [ ] Phase 2 — HTTP API
- [ ] Phase 3 — Tests

## Validation flow

1. Send `POST /fight` with a card using `multipleAttack` (3 hits, amplifier 0.1)
2. Verify the fight result contains 3 separate attack steps for that card's turn
3. Verify each hit's damage increases progressively
4. Verify dodge and critical are resolved independently per hit
5. Run `npm run test:cov` and `npm run build` with no errors

## Estimations

- Confidence: 9/10
  - ✅ Pattern is consistent with existing `SimpleAttack` — minimal interface extraction
  - ✅ `action_stage.ts` already handles `AttackResult[]` — no changes needed there
  - ✅ DTO pattern (optional field + factory in controller) already used for conditional attacks
  - ❌ Minor risk: `class-transformer` validation for mutually exclusive fields (simpleAttack/multipleAttack) may need custom validator
- Time to implement: ~2h
