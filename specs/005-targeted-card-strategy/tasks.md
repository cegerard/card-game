# Tasks: Targeted Card Strategy

**Input**: Design documents from `/specs/005-targeted-card-strategy/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contract.md

**Tests**: Included per constitution principle II (Test-First Development).

**Organization**: Tasks grouped by user story. All three stories are P1 but have natural ordering: US1 (core behavior) -> US2 (dead target behavior) -> US3 (validation restriction).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No project initialization needed — existing codebase. Skip to foundational.

*(No tasks)*

---

## Phase 2: Foundational (DTO Enum & Field)

**Purpose**: Add the `TARGETED_CARD` enum value and `targetedCardId` field to the DTO layer. These are shared prerequisites for all user stories.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Add `TARGETED_CARD = 'targeted-card'` to the `TargetingStrategy` enum in `src/fight/http-api/dto/fight-data.dto.ts`
- [x] T002 Add optional `targetedCardId` string field to `OtherSkillDto` with `@IsOptional()` and `@IsString()` validators in `src/fight/http-api/dto/fight-data.dto.ts`

**Checkpoint**: DTO layer has the new enum value and field. No behavioral changes yet.

---

## Phase 3: User Story 1 — Target a specific enemy card via targeting override (Priority: P1)

**Goal**: A card with an active `targeted-card` override hits the designated target while the target is alive.

**Independent Test**: Configure a targeting override skill with the `targeted-card` strategy, trigger it, verify the card attacks only the designated target.

### Tests for User Story 1

> **Write these tests FIRST, ensure they FAIL before implementation**

- [x] T003 [US1] Write unit test: `TargetedCard.targetedCards()` returns `[targetCard]` when target is alive in defending player's deck — in `src/fight/core/__tests__/targeted-card.spec.ts`
- [x] T004 [US1] Write unit test: `TargetedCard.id` returns `'targeted-card'` — in `src/fight/core/__tests__/targeted-card.spec.ts`

### Implementation for User Story 1

- [x] T005 [US1] Create `TargetedCard` class implementing `TargetingCardStrategy` with `targetCardId` constructor param and `targetedCards()` method that finds the card in `defendingPlayer.allCards` — in `src/fight/core/targeting-card-strategies/targeted-card.ts`
- [x] T006 [US1] Wire `TargetedCard` construction in the `TARGETING_OVERRIDE` case of `createOtherSkill()`: when `targetingStrategy` is `targeted-card`, construct `new TargetedCard(targetedCardId)` instead of using `buildTargetingStrategy()` — in `src/fight/http-api/fight.controller.ts`

**Checkpoint**: Unit tests for US1 pass. A card with targeted-card override hits the designated alive target.

---

## Phase 4: User Story 2 — Stop targeting when the designated card dies (Priority: P1)

**Goal**: When the targeted card is dead or not found, the strategy returns an empty target list.

**Independent Test**: Kill the targeted card mid-battle and verify the strategy returns `[]` on subsequent calls.

### Tests for User Story 2

> **Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [US2] Write unit test: `TargetedCard.targetedCards()` returns `[]` when target card is dead — in `src/fight/core/__tests__/targeted-card.spec.ts`
- [x] T008 [US2] Write unit test: `TargetedCard.targetedCards()` returns `[]` when target card ID does not exist in defending player's deck — in `src/fight/core/__tests__/targeted-card.spec.ts`

### Implementation for User Story 2

- [x] T009 [US2] Ensure `TargetedCard.targetedCards()` checks `isDead()` on the found card and returns `[]` if dead or not found — in `src/fight/core/targeting-card-strategies/targeted-card.ts`

**Checkpoint**: Unit tests for US2 pass. Dead/missing targets produce empty results.

---

## Phase 5: User Story 3 — Restrict strategy usage to targeting overrides only (Priority: P1)

**Goal**: The `targeted-card` strategy is rejected by validation when used outside of a `TARGETING_OVERRIDE` skill context.

**Independent Test**: Send battle configurations using `targeted-card` in simple attack, special, buff application, and non-override other skill targeting — all should return 400.

### Tests for User Story 3

> **Write these tests FIRST, ensure they FAIL before implementation**

- [x] T010 [P] [US3] Write E2E test: `targeted-card` in `SimpleAttackDto.targetingStrategy` returns 400 — in `test/fight/targeted-card-strategy.e2e-spec.ts`
- [x] T011 [P] [US3] Write E2E test: `targeted-card` in `SpecialDto.targetingStrategy` returns 400 — in `test/fight/targeted-card-strategy.e2e-spec.ts`
- [x] T012 [P] [US3] Write E2E test: `targeted-card` in `BuffApplicationDto.targetingStrategy` returns 400 — in `test/fight/targeted-card-strategy.e2e-spec.ts`
- [x] T013 [P] [US3] Write E2E test: `targeted-card` in non-TARGETING_OVERRIDE `OtherSkillDto` returns 400 — in `test/fight/targeted-card-strategy.e2e-spec.ts`
- [x] T014 [P] [US3] Write E2E test: `targeted-card` in `TARGETING_OVERRIDE` `OtherSkillDto` with valid `targetedCardId` is accepted (200) — in `test/fight/targeted-card-strategy.e2e-spec.ts`

### Implementation for User Story 3

- [x] T015 [US3] Add custom validation to reject `TARGETED_CARD` in `SimpleAttackDto.targetingStrategy` and `MultipleAttackDto.targetingStrategy` — in `src/fight/http-api/dto/fight-data.dto.ts`
- [x] T016 [US3] Add custom validation to reject `TARGETED_CARD` in `SpecialDto.targetingStrategy` — in `src/fight/http-api/dto/fight-data.dto.ts`
- [x] T017 [US3] Add custom validation to reject `TARGETED_CARD` in `BuffApplicationDto.targetingStrategy` — in `src/fight/http-api/dto/fight-data.dto.ts`
- [x] T018 [US3] Add custom validation to reject `TARGETED_CARD` in `OtherSkillDto.targetingStrategy` when `kind` is not `TARGETING_OVERRIDE` — in `src/fight/http-api/dto/fight-data.dto.ts`
- [x] T019 [US3] Add validation requiring `targetedCardId` when `kind=TARGETING_OVERRIDE` and `targetingStrategy=targeted-card` — in `src/fight/http-api/dto/fight-data.dto.ts`

**Checkpoint**: All validation E2E tests pass. Misconfigured strategies are rejected at the DTO boundary.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Full integration verification and sample data update.

- [x] T020 [P] Write E2E test: full battle flow with `targeted-card` override — card attacks designated target, target dies, card skips attacks, override reverts — in `test/fight/targeted-card-strategy.e2e-spec.ts`
- [x] T021 [P] Update sample card configuration to use `targeted-card` strategy with `targetedCardId` — in `samples/cards.json`
- [x] T022 Run quality checklist: `npm run format && npm run lint && npm run test:cov && npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — can start immediately
- **US1 (Phase 3)**: Depends on Phase 2 (enum + field must exist)
- **US2 (Phase 4)**: Depends on Phase 3 (strategy class must exist to add dead-check behavior)
- **US3 (Phase 5)**: Depends on Phase 2 (enum must exist for validation). Can run in parallel with US1/US2 since it only touches DTO validation.
- **Polish (Phase 6)**: Depends on Phases 3, 4, and 5

### User Story Dependencies

- **US1 (Phase 3)**: Foundational -> US1 (core strategy class + controller wiring)
- **US2 (Phase 4)**: US1 -> US2 (extends the same class with dead-target behavior)
- **US3 (Phase 5)**: Foundational -> US3 (DTO validation only, independent of domain class)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Domain class before controller wiring (US1)
- Validation rules before integration tests (US3)

### Parallel Opportunities

- **Phase 2**: T001 and T002 touch the same file — sequential
- **Phase 3**: T003/T004 (tests) parallel, then T005/T006 sequential
- **Phase 4**: T007/T008 (tests) parallel, then T009
- **Phase 5**: T010–T014 (E2E tests) all parallel. T015–T019 touch the same file — sequential
- **Phase 6**: T020 and T021 parallel

---

## Parallel Example: User Story 3

```bash
# Launch all E2E tests for US3 together:
Task: T010 "E2E test: targeted-card in SimpleAttackDto returns 400"
Task: T011 "E2E test: targeted-card in SpecialDto returns 400"
Task: T012 "E2E test: targeted-card in BuffApplicationDto returns 400"
Task: T013 "E2E test: targeted-card in non-override OtherSkillDto returns 400"
Task: T014 "E2E test: targeted-card in TARGETING_OVERRIDE is accepted"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete Phase 2: Foundational (enum + field)
2. Complete Phase 3: US1 (core targeting behavior)
3. Complete Phase 4: US2 (dead target handling)
4. **STOP and VALIDATE**: Run unit tests — strategy works correctly
5. Ready for manual testing via API

### Incremental Delivery

1. Foundational -> US1 + US2 -> Core targeting works (MVP)
2. Add US3 -> Validation rejects misconfiguration (safety layer)
3. Polish -> Full integration test + samples updated

### Single Developer Strategy

Execute sequentially: Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6. US3 (validation) can be interleaved with US1/US2 since it touches different files.
