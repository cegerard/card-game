# Tasks: Composite Power

**Input**: Design documents from `/specs/003-composite-power/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contract.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new project setup needed — existing project structure. This phase covers foundational type changes shared across all stories.

- [X] T001 Add optional `powerId` field to `SkillResults` type in `src/fight/core/cards/skills/skill.ts`
- [X] T002 [P] Add optional `powerId` field to `Buff` type in `src/fight/core/cards/@types/buff/buff.ts`
- [X] T003 [P] Add `TargetingOverride` and `TargetingReverted` values to `StepKind` enum in `src/fight/core/fight-simulator/@types/step.ts`
- [X] T004 [P] Create `TargetingOverrideReport` and `TargetingRevertedReport` types in `src/fight/core/fight-simulator/@types/targeting-override-report.ts`
- [X] T005 [P] Add optional `powerId` field to `BuffReport` in `src/fight/core/fight-simulator/@types/buff-report.ts`
- [X] T006 [P] Add optional `powerId` field to `DebuffReport` in `src/fight/core/fight-simulator/@types/debuff-report.ts`
- [X] T007 [P] Add optional `powerId` field to `HealingReport` in `src/fight/core/fight-simulator/@types/healing-report.ts`
- [X] T008 [P] Add optional `powerId` field to `BuffRemovedReport` in `src/fight/core/fight-simulator/@types/buff-removed-report.ts`
- [X] T009 Add new report types to `Step` union type in `src/fight/core/fight-simulator/@types/step.ts`

**Checkpoint**: All shared types are ready. No behavioral changes yet — existing tests must still pass.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain changes that all user stories depend on — `launchSkills` returning all matches and powerId propagation through skills.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T010 Change `FightingCard.launchSkill()` to `launchSkills()` returning `SkillResults[]` (filter instead of find) in `src/fight/core/cards/fighting-card.ts`
- [X] T011 Update `TurnManager.processCardSkill()` to iterate `SkillResults[]` from `launchSkills()` in `src/fight/core/fight-simulator/turn-manager.ts`
- [X] T012 Update `ActionStage.launchNextActionSkills()` to iterate `SkillResults[]` from `launchSkills()` in `src/fight/core/card-action/action_stage.ts`
- [X] T013 Update `DeathSkillHandler` to handle `SkillResults[]` from `launchSkills()` in `src/fight/core/fight-simulator/death-skill-handler.ts`
- [X] T014 Add optional `powerId` parameter to `AlterationSkill` constructor and propagate to `SkillResults` in `src/fight/core/cards/skills/alteration-skill.ts`
- [X] T015 [P] Add optional `powerId` parameter to `Healing` skill constructor and propagate to `SkillResults` in `src/fight/core/cards/skills/healing.ts`
- [X] T016 Propagate `powerId` from `SkillResults` into `BuffReport`, `DebuffReport`, `HealingReport` in `TurnManager` in `src/fight/core/fight-simulator/turn-manager.ts`
- [X] T017 Propagate `powerId` from `SkillResults` into step reports in `ActionStage` in `src/fight/core/card-action/action_stage.ts`
- [X] T018 Update test helper `createFightingCard()` to support `powerId` on skills in `test/helpers/fighting-card.ts`

**Checkpoint**: Foundation ready — `launchSkills()` fires all matching skills, powerId flows through domain. All existing tests must still pass.

---

## Phase 3: User Story 1 — Group Existing Skills into a Composite Power (Priority: P1) MVP

**Goal**: Multiple skills sharing the same `powerId` and trigger event all activate together, and the fight log steps carry the `powerId` for client-side grouping.

**Independent Test**: Configure a card with 2+ skills sharing a `powerId`, trigger their event, verify all activate and steps carry the `powerId`.

### Tests for User Story 1

- [X] T019 [US1] Write unit test: two skills with same powerId and trigger both fire on `launchSkills()` in `src/fight/core/cards/__tests__/fighting-card-composite-power.spec.ts`
- [X] T020 [US1] Write unit test: skills with different powerIds activate independently in `src/fight/core/cards/__tests__/fighting-card-composite-power.spec.ts`
- [X] T021 [US1] Write unit test: `TurnManager` produces steps with powerId for grouped buff+healing skills in `src/fight/core/fight-simulator/__tests__/turn-manager-composite-power.spec.ts`

### Implementation for User Story 1

- [X] T022 [US1] Add `powerId` field to `OtherSkillDto` in `src/fight/http-api/dto/fight-data.dto.ts`
- [X] T023 [US1] Pass `powerId` from `OtherSkillDto` through `createOtherSkill()` to domain skill constructors in `src/fight/http-api/fight.controller.ts`
- [X] T024 [US1] Write e2e test: composite power with buff+healing activates and steps carry powerId in `test/fight/composite-power.e2e-spec.ts`

**Checkpoint**: Composite power grouping works — multiple skills fire together, steps tagged with powerId.

---

## Phase 4: User Story 2 — Composite Power Expiration Cleans Up All Grouped Effects (Priority: P1)

**Goal**: When a power's termination event fires, all event-bound buffs and effects tied to that event are cleaned up simultaneously.

**Independent Test**: Activate a composite power with `activationLimit`, advance turns until expiration, verify all grouped buffs are removed.

### Tests for User Story 2

- [X] T025 [US2] Write unit test: `EndEventProcessor` removes all buffs with matching terminationEvent and propagates powerId in `src/fight/core/fight-simulator/__tests__/end-event-processor-composite.spec.ts`
- [X] T026 [US2] Write unit test: two composite powers on same card — expiring one does not affect the other in `src/fight/core/fight-simulator/__tests__/end-event-processor-composite.spec.ts`

### Implementation for User Story 2

- [X] T027 [US2] Propagate `powerId` in `EndEventProcessor.processEndEvent()` into `BuffRemovedReport` in `src/fight/core/fight-simulator/end-event-processor.ts`
- [X] T028 [US2] Pass `powerId` through buff creation in `AlterationSkill` so buffs carry it for cleanup reporting in `src/fight/core/cards/skills/alteration-skill.ts`
- [X] T029 [US2] Write e2e test: composite power expires after activationLimit and all buffs are removed in `test/fight/composite-power.e2e-spec.ts`

**Checkpoint**: Composite power lifecycle complete — activation and cleanup both work with powerId tracing.

---

## Phase 5: User Story 3 — Targeting Strategy Override (Priority: P2)

**Goal**: A new skill kind that temporarily overrides a card's base attack targeting strategy. Reverts on power expiration.

**Independent Test**: Configure a targeting override skill in a power group, verify the card's attacks use the overridden targeting, then verify revert on expiration.

### Tests for User Story 3

- [X] T030 [US3] Write unit test: `FightingCard.overrideAttackTargeting()` changes the targeting used by `launchAttack()` in `src/fight/core/cards/__tests__/fighting-card-targeting-override.spec.ts`
- [X] T031 [US3] Write unit test: `FightingCard.restoreAttackTargeting()` reverts to original targeting in `src/fight/core/cards/__tests__/fighting-card-targeting-override.spec.ts`
- [X] T032 [US3] Write unit test: `TargetingOverride` skill calls `overrideAttackTargeting()` on launch in `src/fight/core/cards/skills/__tests__/targeting-override.spec.ts`
- [X] T033 [US3] Write unit test: `EndEventProcessor` calls `restoreAttackTargeting()` and emits `TargetingReverted` step in `src/fight/core/fight-simulator/__tests__/end-event-processor-targeting.spec.ts`

### Implementation for User Story 3

- [X] T034 [US3] Add `targetingOverrides` stack, `overrideAttackTargeting()`, and `restoreAttackTargeting()` to `FightingCard` in `src/fight/core/cards/fighting-card.ts`
- [X] T035 [US3] Modify `FightingCard.launchAttack()` to use active targeting override if present in `src/fight/core/cards/fighting-card.ts`
- [X] T036 [US3] Add `launchWithTargeting()` method to `SimpleAttack` to accept external targeting strategy in `src/fight/core/cards/skills/simple-attack.ts`
- [X] T037 [US3] Create `TargetingOverride` skill implementing `Skill` interface in `src/fight/core/cards/skills/targeting-override.ts`
- [X] T038 [US3] Extend `EndEventProcessor.processEndEvent()` to call `restoreAttackTargeting()` and emit `TargetingRevertedReport` in `src/fight/core/fight-simulator/end-event-processor.ts`
- [X] T039 [US3] Add `TARGETING_OVERRIDE` to `SkillKind` enum in DTO and map in `createOtherSkill()` in `src/fight/http-api/dto/fight-data.dto.ts` and `src/fight/http-api/fight.controller.ts`
- [X] T040 [US3] Write e2e test: card with targeting override attacks all enemies, then reverts after power expiration in `test/fight/composite-power.e2e-spec.ts`

**Checkpoint**: Targeting override works as a grouped skill — overrides on activation, reverts on expiration.

---

## Phase 6: User Story 4 — API Validation & Client Display Grouping (Priority: P2)

**Goal**: API validates powerId consistency (same trigger + terminationEvent) and all steps carry powerId for display.

**Independent Test**: Send fight requests with mismatched powerId groups and verify 400 error. Verify all steps from composite power carry powerId.

### Tests for User Story 4

- [X] T041 [US4] Write controller test: API rejects skills with same powerId but different trigger events in `src/fight/http-api/__test__/fight.controller.spec.ts`
- [X] T042 [P] [US4] Write controller test: API rejects skills with same powerId but different terminationEvents in `src/fight/http-api/__test__/fight.controller.spec.ts`

### Implementation for User Story 4

- [X] T043 [US4] Add powerId group validation logic in `FightController` (validate same event + terminationEvent per powerId group) in `src/fight/http-api/fight.controller.ts`
- [X] T044 [US4] Write e2e test: full composite power scenario verifying all step types carry powerId in `test/fight/composite-power.e2e-spec.ts`

**Checkpoint**: API validates composite power config. All steps from composite power carry powerId.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, regression, cleanup.

- [X] T045 Run all existing tests to verify zero regression (`npm run test`)
- [X] T046 Run `npm run format` and fix any formatting issues
- [X] T047 Run `npm run lint` and fix any lint errors
- [X] T048 Run `npm run test:cov` and verify coverage thresholds
- [X] T049 Run `npm run build` and verify clean build
- [X] T050 Update API documentation in `docs/memory-bank/backend/API_DOCS.md` with new skill kind and powerId field

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — type additions only
- **Foundational (Phase 2)**: Depends on Phase 1 — changes `launchSkills` and powerId propagation
- **US1 (Phase 3)**: Depends on Phase 2 — needs `launchSkills` and powerId in skills
- **US2 (Phase 4)**: Depends on Phase 2 — needs powerId in EndEventProcessor
- **US3 (Phase 5)**: Depends on Phase 2 — needs `launchSkills` for targeting override skill
- **US4 (Phase 6)**: Depends on Phase 3 — needs powerId in DTO and controller
- **Polish (Phase 7)**: Depends on all story phases

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependency on other stories
- **US2 (P1)**: After Phase 2 — can run in parallel with US1
- **US3 (P2)**: After Phase 2 — can run in parallel with US1 and US2
- **US4 (P2)**: After US1 (needs powerId in DTO) — partially parallel with US2/US3

### Within Each User Story

- Tests MUST be written and FAIL before implementation (Constitution II)
- Domain types/entities before services
- Domain logic before HTTP layer
- Unit tests before e2e tests

### Parallel Opportunities

- Phase 1: T002-T008 all parallel (different files)
- Phase 2: T014+T015 parallel (different skill files)
- Phase 3-5: US1, US2, US3 can run in parallel after Phase 2
- Phase 6: T041+T042 parallel (same file but independent tests)

---

## Parallel Example: Phase 1

```bash
# All type additions can run in parallel:
Task T002: "Add powerId to Buff type in src/fight/core/cards/@types/buff/buff.ts"
Task T003: "Add StepKind values in src/fight/core/fight-simulator/@types/step.ts"
Task T004: "Create targeting-override-report.ts in src/fight/core/fight-simulator/@types/"
Task T005: "Add powerId to BuffReport in src/fight/core/fight-simulator/@types/buff-report.ts"
Task T006: "Add powerId to DebuffReport in src/fight/core/fight-simulator/@types/debuff-report.ts"
Task T007: "Add powerId to HealingReport in src/fight/core/fight-simulator/@types/healing-report.ts"
Task T008: "Add powerId to BuffRemovedReport in src/fight/core/fight-simulator/@types/buff-removed-report.ts"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Type setup
2. Complete Phase 2: Foundational (launchSkills + powerId propagation)
3. Complete Phase 3: US1 — grouped skills activate together
4. Complete Phase 4: US2 — grouped effects cleaned up together
5. **STOP and VALIDATE**: Test composite power activation + cleanup independently
6. This delivers the core value: declarative skill grouping with unified lifecycle

### Incremental Delivery

1. Phase 1+2 → Foundation ready
2. US1 → Skills fire together with powerId tagging (MVP core)
3. US2 → Lifecycle cleanup works (MVP complete)
4. US3 → Targeting override adds new combat mechanic
5. US4 → API validation + full display grouping
6. Polish → Quality gates, docs

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Constitution II requires TDD: write tests first, confirm they fail, then implement
- Commit after each task or logical group
- All 4 quality gates must pass before merge (format → lint → test:cov → build)
