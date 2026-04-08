# Tasks: Targeted Card Strategy — Dynamic Resolution (v2)

**Input**: Design documents from `/specs/005-targeted-card-strategy/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contract.md

**Tests**: Included per constitution principle II (Test-First Development).

**Organization**: Tasks grouped by user story. This is a v2 refactoring: the killer identity must flow through the death chain before any dynamic resolution works. Foundational phase is critical.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No project initialization needed — existing codebase. Skip to foundational.

*(No tasks)*

---

## Phase 2: Foundational (Killer Propagation Chain)

**Purpose**: Propagate the killer card identity through the death notification chain. This is the prerequisite for dynamic target resolution.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 Add optional `killerCard?: FightingCard` field to `FightingContext` type in `src/fight/core/cards/@types/fighting-context.ts`
- [X] T002 Add optional `killerCard?: FightingCard` parameter to `notifyDeath` in `CardDeathSubscriber` interface in `src/fight/core/fight-simulator/card-death-subscriber.ts`
- [X] T003 Update `ActionStage.handleAttackResult()` to accept an `attackerCard` parameter and pass it as `killerCard` to `notifyDeath()` when a defender dies — in `src/fight/core/card-action/action_stage.ts`
- [X] T004 Update `ActionStage.notifyDeath()` to accept and forward optional `killerCard` to subscribers — in `src/fight/core/card-action/action_stage.ts`
- [X] T005 Update `ActionStage.launchAttack()`, `computeSpecialAttackResult()`, and `launchNextActionSkills()` to pass the attacking card to `handleAttackResult()` — in `src/fight/core/card-action/action_stage.ts`
- [X] T006 Update `DeathSkillHandler.notifyDeath()` to accept optional `killerCard` and include it in the `FightingContext` passed to `card.launchSkills()` — in `src/fight/core/fight-simulator/death-skill-handler.ts`
- [X] T007 Update `TurnManager.notifyDeath()` to match the new `CardDeathSubscriber` signature (pass `undefined` as `killerCard`) — in `src/fight/core/fight-simulator/turn-manager.ts`

**Checkpoint**: Killer identity flows through the death chain. All existing tests still pass (optional parameter, no behavioral change yet).

---

## Phase 3: User Story 1 — Dynamic target resolution via killer identity (Priority: P1)

**Goal**: When a `targeted-card` override triggers on ally-death, it dynamically targets the card that killed the ally.

**Independent Test**: Configure a targeting override skill with `targeted-card`, trigger it via ally-death (combat kill), verify the card attacks only the killer.

### Tests for User Story 1

> **Write these tests FIRST, ensure they FAIL before implementation**

- [X] T008 [US1] Write unit test: `TargetingOverrideSkill` with a resolver builds the strategy from context at launch time — in `src/fight/core/__tests__/targeted-card.spec.ts`
- [X] T009 [US1] Write unit test: `TargetingOverrideSkill` with a resolver receiving `killerCard` in context produces a `TargetedCard` targeting the killer — in `src/fight/core/__tests__/targeted-card.spec.ts`

### Implementation for User Story 1

- [X] T010 [US1] Modify `TargetingOverrideSkill` constructor to accept an optional `strategyResolver: (context: FightingContext) => TargetingCardStrategy` — in `src/fight/core/cards/skills/targeting-override.ts`
- [X] T011 [US1] Modify `TargetingOverrideSkill.launch()` to call the resolver with context when present, falling back to static strategy otherwise — in `src/fight/core/cards/skills/targeting-override.ts`
- [X] T012 [US1] Update controller `TARGETING_OVERRIDE` case: when `targetingStrategy` is `targeted-card`, pass a resolver `(ctx) => new TargetedCard(ctx.killerCard?.id ?? '')` instead of a static `TargetedCard` instance — in `src/fight/http-api/fight.controller.ts`

**Checkpoint**: Unit tests for US1 pass. A card with targeted-card override dynamically resolves the killer as its target.

---

## Phase 4: User Story 2 — No target when killer is absent or dead (Priority: P1)

**Goal**: When the killer card dies or when the death was caused by a state-effect (no killer), the strategy returns an empty target list.

**Independent Test**: Trigger a targeted-card override from a state-effect death (no killer) and verify empty targets. Kill the resolved target mid-battle and verify empty targets.

### Tests for User Story 2

> **Write these tests FIRST, ensure they FAIL before implementation**

- [X] T013 [US2] Write unit test: resolver with `killerCard: undefined` produces a `TargetedCard('')` that returns `[]` — in `src/fight/core/__tests__/targeted-card.spec.ts`

### Implementation for User Story 2

*(No additional implementation needed — already handled by the resolver fallback `ctx.killerCard?.id ?? ''` from T012 and the existing `TargetedCard` behavior for dead/missing targets.)*

**Checkpoint**: Unit tests for US2 pass. No-killer scenario returns empty targets.

---

## Phase 5: User Story 3 — DTO cleanup and validation (Priority: P1)

**Goal**: Remove the now-unused `targetedCardId` field from the DTO and its validator. Validation that rejects `targeted-card` outside TARGETING_OVERRIDE remains unchanged.

### Tests for User Story 3

- [X] T014 [US3] Update E2E test: `TARGETING_OVERRIDE` with `targeted-card` no longer sends `targetedCardId` and still returns 200 — in `test/fight/targeted-card-strategy.e2e-spec.ts`

### Implementation for User Story 3

- [X] T015 [US3] Remove `targetedCardId` field and its decorators from `OtherSkillDto` — in `src/fight/http-api/dto/fight-data.dto.ts`
- [X] T016 [US3] Remove `TargetedCardIdRequiredConstraint` validator class and its `@Validate` decorator from `OtherSkillDto` — in `src/fight/http-api/dto/fight-data.dto.ts`

**Checkpoint**: DTO is clean. All validation E2E tests pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Full integration verification and sample data update.

- [X] T017 Update E2E test: full battle flow with `targeted-card` override — card attacks the killer of its ally, not a hardcoded target — in `test/fight/targeted-card-strategy.e2e-spec.ts`
- [X] T018 [P] Update sample card configuration to remove `targetedCardId` from targeted-card override — in `samples/cards.json`
- [X] T019 Run quality checklist: `npm run format && npm run lint && npm run test:cov && npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — can start immediately
- **US1 (Phase 3)**: Depends on Phase 2 (killer must flow through death chain before resolver can use it)
- **US2 (Phase 4)**: Depends on Phase 3 (resolver must exist to test the no-killer edge case)
- **US3 (Phase 5)**: Depends on Phase 2 only (DTO cleanup is independent of domain changes). Can run in parallel with US1/US2.
- **Polish (Phase 6)**: Depends on Phases 3, 4, and 5

### User Story Dependencies

- **US1 (Phase 3)**: Foundational → US1 (resolver + controller wiring)
- **US2 (Phase 4)**: US1 → US2 (tests the same resolver with undefined killer)
- **US3 (Phase 5)**: Foundational → US3 (DTO cleanup, independent of domain)

### Within Each Phase

- Tests MUST be written and FAIL before implementation
- T001–T007 are sequential (same files, progressive changes)
- T003–T005 touch the same file (`action_stage.ts`) — sequential
- T015–T016 touch the same file (`fight-data.dto.ts`) — sequential

### Parallel Opportunities

- **Phase 2**: T001 and T002 touch different files — parallel. T003–T005 same file — sequential.
- **Phase 3**: T008/T009 (tests) parallel. T010/T011 same file — sequential.
- **Phase 5**: Can run in parallel with Phase 3 (different files)
- **Phase 6**: T017 and T018 parallel

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 2: Foundational (killer propagation)
2. Complete Phase 3: US1 (dynamic resolution)
3. **STOP and VALIDATE**: Run unit tests — killer-based targeting works
4. Ready for manual testing via API

### Incremental Delivery

1. Foundational → killer flows through death chain (no behavioral change)
2. US1 → dynamic resolution works (core feature)
3. US2 → edge case (no killer) verified
4. US3 → DTO cleanup (API contract simplified)
5. Polish → full integration test + samples updated

### Single Developer Strategy

Execute sequentially: Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6. US3 can be interleaved with US1/US2 since it touches different files.
