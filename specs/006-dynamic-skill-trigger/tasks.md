# Tasks: Dynamic Skill Trigger

**Input**: Design documents from `/specs/006-dynamic-skill-trigger/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included (Constitution Principle II: Test-First Development is NON-NEGOTIABLE).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No setup needed — existing project, existing branch `006-dynamic-skill-trigger`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain trigger types that MUST be complete before any user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T001 [P] Unit test for EnemyDeath trigger in `src/fight/core/trigger/__tests__/enemy-death.spec.ts`: matches `enemy-death:<targetCardId>`, rejects other patterns
- [x] T002 [P] Unit test for DynamicTrigger in `src/fight/core/trigger/__tests__/dynamic-trigger.spec.ts`: starts dormant (isTriggered always false), activates when activation event is observed (returns false on activation call), delegates to replacement trigger after activation, activation is idempotent

### Implementation

- [x] T003 [P] Create EnemyDeath trigger class in `src/fight/core/trigger/enemy-death.ts` — mirrors AllyDeath, matches `enemy-death:<targetCardId>` pattern
- [x] T004 [P] Create DynamicTrigger class in `src/fight/core/trigger/dynamic-trigger.ts` — implements Trigger, composes activationTrigger + replacementTrigger, manages dormant→active state transition inside isTriggered()

**Checkpoint**: Both new trigger types pass their unit tests independently.

---

## Phase 3: User Story 1 — Dormant Skill Activation via Ally Death (Priority: P1) 🎯 MVP

**Goal**: A skill starts dormant, activates when a specific ally dies, then fires when a specific enemy dies.

**Independent Test**: Set up a battle where ally dies → verify dormant skill activates → verify skill fires on enemy death.

### Tests

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T005 Unit test for DeathSkillHandler enemy-death event firing in `src/fight/core/fight-simulator/__tests__/death-skill-handler.spec.ts`: when a card dies, `enemy-death:<deadCard.id>` triggers fire on opponent team's surviving cards
- [x] T006 Integration test for full dormant→active→fire flow in `src/fight/core/__tests__/dynamic-trigger-integration.spec.ts`: card with dormant healing skill → ally dies → trigger changes → enemy dies → healing skill fires

### Implementation

- [x] T007 [US1] Extract step-conversion logic in `src/fight/core/fight-simulator/death-skill-handler.ts` into a private helper method to avoid duplicating the switch logic for ally-death and enemy-death loops
- [x] T008 [US1] Extend `DeathSkillHandler.notifyDeath()` in `src/fight/core/fight-simulator/death-skill-handler.ts` to also fire `enemy-death:<deadCard.id>` on the opponent team's surviving cards using the extracted helper
- [x] T009 [US1] Add `DORMANT = 'dormant'` and `ENEMY_DEATH = 'enemy-death'` to TriggerEvent enum in `src/fight/http-api/dto/fight-data.dto.ts`
- [x] T010 [US1] Add optional DTO fields (`activationEvent`, `activationTargetCardId`, `replacementEvent`, `replacementTargetCardId`) to OtherSkillDto in `src/fight/http-api/dto/fight-data.dto.ts` with conditional validation (required when event is dormant)
- [x] T011 [US1] Extend `buildTriggerStrategy()` in `src/fight/http-api/trigger-factory.ts` to handle `ENEMY_DEATH` (create EnemyDeath with targetCardId) and `DORMANT` (create DynamicTrigger with activationTrigger + replacementTrigger built from activation/replacement fields)
- [x] T012 [US1] Add test helper support for dormant trigger skills in `test/helpers/fighting-card.ts` — allow creating cards with dormant-triggered skills for test setup

**Checkpoint**: User Story 1 is fully functional — dormant skills activate on ally death and fire on enemy death. All tests green.

---

## Phase 4: User Story 2 — Dormant Skill Remains Inactive (Priority: P2)

**Goal**: Verify dormant skills never fire when the activation condition is not met.

**Independent Test**: Run a battle where the activating ally survives or a different ally dies — verify the skill never activates.

### Tests

- [x] T013 [P] [US2] Test in `src/fight/core/__tests__/dynamic-trigger-integration.spec.ts`: dormant skill never fires when designated ally survives the entire battle
- [x] T014 [P] [US2] Test in `src/fight/core/__tests__/dynamic-trigger-integration.spec.ts`: dormant skill stays dormant when a different ally (not the designated one) dies

**Checkpoint**: User Stories 1 AND 2 are both independently verified. Dormant skills correctly remain inactive when conditions are not met.

---

## Phase 5: User Story 3 — Skill Owner Dies Before Activation (Priority: P3)

**Goal**: Verify that if the skill owner dies before the activation event, no trigger change occurs.

**Independent Test**: Kill the skill owner before the designated ally dies — verify no activation or skill firing occurs.

### Tests

- [x] T015 [US3] Test in `src/fight/core/__tests__/dynamic-trigger-integration.spec.ts`: card with dormant skill dies before the designated ally → skill never activates, no healing step produced

**Checkpoint**: All user stories verified. Edge case for dead skill owners handled correctly.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and documentation updates.

- [x] T016 Run quality gates: `npm run format && npm run lint && npm run test:cov && npm run build`
- [x] T017 Update memory bank documentation in `docs/memory-bank/backend/ARCHITECTURE.md` — add DynamicTrigger and EnemyDeath to trigger system documentation, update DeathSkillHandler description
- [x] T018 Update memory bank documentation in `docs/memory-bank/backend/API_DOCS.md` — add dormant trigger event, enemy-death trigger event, and new OtherSkillDto fields

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — can start immediately
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion (EnemyDeath + DynamicTrigger must exist)
- **User Story 2 (Phase 4)**: Depends on Phase 3 completion (needs working dormant trigger system)
- **User Story 3 (Phase 5)**: Depends on Phase 3 completion (needs working dormant trigger system)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) — Core feature
- **User Story 2 (P2)**: Depends on US1 — Tests negative cases of same system
- **User Story 3 (P3)**: Depends on US1 — Tests edge case of same system

### Within Each Phase

- Tests MUST be written and FAIL before implementation (Constitution Principle II)
- Implementation tasks follow dependency order (extract helper → extend handler → DTO → factory)
- Story complete before moving to next priority

### Parallel Opportunities

- T001 + T002 can run in parallel (different test files, different trigger classes)
- T003 + T004 can run in parallel (different source files, no dependencies)
- T013 + T014 can run in parallel (independent test cases in same file)

---

## Parallel Example: Phase 2

```bash
# Launch both foundational tests in parallel:
Task T001: "Unit test for EnemyDeath trigger in src/fight/core/trigger/__tests__/enemy-death.spec.ts"
Task T002: "Unit test for DynamicTrigger in src/fight/core/trigger/__tests__/dynamic-trigger.spec.ts"

# Then launch both implementations in parallel:
Task T003: "Create EnemyDeath trigger class in src/fight/core/trigger/enemy-death.ts"
Task T004: "Create DynamicTrigger class in src/fight/core/trigger/dynamic-trigger.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (EnemyDeath + DynamicTrigger)
2. Complete Phase 3: User Story 1 (DeathSkillHandler + DTO + Factory + integration test)
3. **STOP and VALIDATE**: Test full dormant→active→fire flow independently
4. Run quality gates

### Incremental Delivery

1. Phase 2 → Foundation ready (two new trigger types)
2. Phase 3 (US1) → Core feature works → Test independently (MVP!)
3. Phase 4 (US2) → Negative cases verified → Confidence in dormant behavior
4. Phase 5 (US3) → Edge case covered → Feature complete
5. Phase 6 → Quality gates + docs updated

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Constitution mandates TDD: write tests first, confirm they fail, then implement
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- DeathSkillHandler step-conversion extraction (T007) prevents code duplication when adding enemy-death loop (T008)
