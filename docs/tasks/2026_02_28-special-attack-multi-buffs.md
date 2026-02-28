# Instruction: Special Attack - Multiple Buffs Support

## Feature

- **Summary**: Allow a special attack to apply multiple buffs at once by turning `buffApplication` from a single object into an array, from API DTO all the way to the domain.
- **Stack**: `Node.js, NestJS, TypeScript, Jest`
- **Branch name**: `feat/special-attack-multi-buffs`

## Existing files

- @src/fight/http-api/dto/fight-data.dto.ts
- @src/fight/core/cards/skills/special-attack.ts
- @src/fight/http-api/fight.controller.ts
- @test/helpers/fighting-card.ts
- @src/fight/core/__tests__/special-attack.spec.ts
- @test/fight/special-attack-buffs.e2e-spec.ts
- @samples/cards.json

### New file to create

- none

## Implementation phases

### Phase 1 — API Contract

> Expose `buffApplication` as an array in the DTO.

1. In `SpecialDto`, replace `@ValidateNested()` with `@ValidateNested({ each: true })` and `@IsArray()`
2. Change property type from `BuffApplicationDto` to `BuffApplicationDto[]`

### Phase 2 — Domain

> Make `SpecialAttack` iterate over multiple `BuffApplication` entries.

1. Change constructor parameter `buffApplication?: BuffApplication` to `buffApplication?: BuffApplication[]`
2. In `applyBuffs()`, replace the single call with `flatMap` over the array

### Phase 3 — Controller mapping

> Map the DTO array to a domain array.

1. Replace single `BuffApplication` construction with `.map()` over `cardData.skills.special.buffApplication`
2. Pass the resulting array to `SpecialAttack` constructor

### Phase 4 — Tests & sample data

> Keep existing test coverage valid under the new array contract.

1. Update `createSpecialAttack` helper in `test/helpers/fighting-card.ts` to accept array of buff params
2. Update `special-attack.spec.ts` buff test cases: wrap buff params in array
3. Update `special-attack-buffs.e2e-spec.ts`: wrap `buffApplication` payload in array
4. Add one test case with two distinct buffs applied simultaneously (e2e or unit)
5. Update `samples/cards.json`: wrap existing `buffApplication` value in an array

## Reviewed implementation

<!-- That section is filled by a review agent that ensures feature has been properly implemented -->

- [x] Phase 1 — API Contract
- [x] Phase 2 — Domain
- [x] Phase 3 — Controller mapping
- [x] Phase 4 — Tests & sample data

## Validation flow

1. `POST /fight` with `buffApplication` as an array of one entry behaves identically to the previous single-entry behavior
2. `POST /fight` with `buffApplication` containing two entries (e.g. attack + defense buff) applies both buffs to targets
3. `POST /fight` with `buffApplication: []` (empty array) applies no buffs, no error
4. `npm run test` passes with no regressions
5. `npm run test:e2e` passes with no regressions

## Estimations

- Confidence: 10/10
  - ✅ All affected files are identified and well understood
  - ✅ Change is purely additive — array is a superset of single value
  - ✅ No new abstractions required
- Time to implement: small (< 1h)
