# Tasks: Event-Bound Effect Termination

**Input**: Design documents from `/specs/004-event-bound-effect-termination/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Included — constitution mandates test-first development (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new project setup needed — existing project. Skip.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add `terminationEvent` to the CardState interface and concrete implementations — all user stories depend on this.

- [x] T001 Add optional `terminationEvent` field to the `CardState` interface in `src/fight/core/cards/@types/state/card-state.ts`
- [x] T002 [P] Add optional `terminationEvent` parameter to `CardStatePoisoned` constructor and store it in `src/fight/core/cards/@types/state/card-state-poisoned.ts`
- [x] T003 [P] Add optional `terminationEvent` parameter to `CardStateBurned` constructor and store it in `src/fight/core/cards/@types/state/card-state-burned.ts`
- [x] T004 [P] Add optional `terminationEvent` parameter to `CardStateFrozen` constructor and store it in `src/fight/core/cards/@types/state/card-state-frozen.ts`
- [x] T005 [P] Add optional `terminationEvent` parameter to `AttackPoisonedEffect` and pass it to `CardStatePoisoned` in `src/fight/core/cards/@types/attack/attack-poisoned-effect.ts`
- [x] T006 [P] Add optional `terminationEvent` parameter to `AttackBurnedEffect` and pass it to `CardStateBurned` in `src/fight/core/cards/@types/attack/attack-burned-effect.ts`
- [x] T007 [P] Add optional `terminationEvent` parameter to `AttackFrozenEffect` and pass it to `CardStateFrozen` in `src/fight/core/cards/@types/attack/attack-frozen-effect.ts`
- [x] T008 Update `createEffect()` test helper to support optional `terminationEvent` in `test/helpers/effect.ts`

**Checkpoint**: CardState types now carry terminationEvent. All existing tests must still pass (no behavior change).

---

## Phase 3: User Story 1 — Remove a status effect when a named event fires (Priority: P1) MVP

**Goal**: When an end event fires during fight processing, event-bound status effects are removed from all living cards.

**Independent Test**: Configure a card with a burn effect bound to an event, trigger that event via a skill lifecycle, verify the burn is removed.

### Tests for User Story 1

> **Write these tests FIRST, ensure they FAIL before implementation**

- [x] T009 [P] [US1] Write unit test: `removeEventBoundEffects` removes a poisoned effect matching the event name in `src/fight/core/cards/__tests__/fighting-card-remove-effects.spec.ts`
- [x] T010 [P] [US1] Write unit test: `removeEventBoundEffects` removes a burned effect matching the event name in `src/fight/core/cards/__tests__/fighting-card-remove-effects.spec.ts`
- [x] T011 [P] [US1] Write unit test: `removeEventBoundEffects` removes a frozen effect matching the event name in `src/fight/core/cards/__tests__/fighting-card-remove-effects.spec.ts`
- [x] T012 [P] [US1] Write unit test: `removeEventBoundEffects` ignores effects without terminationEvent in `src/fight/core/cards/__tests__/fighting-card-remove-effects.spec.ts`
- [x] T013 [P] [US1] Write unit test: `removeEventBoundEffects` removes multiple effects bound to the same event in `src/fight/core/cards/__tests__/fighting-card-remove-effects.spec.ts`
- [x] T014 [US1] Write unit test: `EndEventProcessor.processEndEvent` emits `EffectRemoved` steps alongside `BuffRemoved` steps in `src/fight/core/fight-simulator/__tests__/end-event-processor-effects.spec.ts`

### Implementation for User Story 1

- [x] T015 [US1] Create `EffectRemovedReport` type and add `EffectRemoved` to `StepKind` enum in `src/fight/core/fight-simulator/@types/effect-removed-report.ts` and `src/fight/core/fight-simulator/@types/step.ts`
- [x] T016 [US1] Implement `removeEventBoundEffects(eventName)` method on `FightingCard` in `src/fight/core/cards/fighting-card.ts`
- [x] T017 [US1] Extend `EndEventProcessor.processEndEvent()` to call `removeEventBoundEffects()` on each living card and emit `EffectRemoved` steps in `src/fight/core/fight-simulator/end-event-processor.ts`

**Checkpoint**: Core mechanic works — event-bound effects are removed when end events fire. All US1 tests pass.

---

## Phase 4: User Story 2 — Attach termination event to effects via the API (Priority: P1)

**Goal**: The API accepts an optional `terminationEvent` field on `EffectDto` and passes it through to domain objects.

**Independent Test**: Send a POST /fight with an effect containing `terminationEvent`, verify request accepted and effect is stored with the event name.

### Tests for User Story 2

- [x] T018 [US2] Write controller test: EffectDto with `terminationEvent` is correctly mapped to domain AttackEffect in `src/fight/http-api/__test__/fight.controller.spec.ts`

### Implementation for User Story 2

- [x] T019 [US2] Add optional `terminationEvent` string field with `@IsOptional()` and `@IsString()` to `EffectDto` in `src/fight/http-api/dto/fight-data.dto.ts`
- [x] T020 [US2] Pass `terminationEvent` from EffectDto through to AttackEffect constructors in `src/fight/http-api/fight.controller.ts`

**Checkpoint**: API accepts terminationEvent on effects and propagates it to the domain layer. US2 tests pass.

---

## Phase 5: User Story 3 — Fight log reports effect removal (Priority: P2)

**Goal**: The fight result contains `effect_removed` steps with complete metadata when event-bound effects are terminated.

**Independent Test**: Run a full fight simulation where an event-bound effect is terminated, inspect the fight result for `effect_removed` steps.

### Tests for User Story 3

- [x] T021 [US3] Write e2e test: fight simulation with event-bound burn effect produces `effect_removed` step in fight result in `test/fight/event-bound-effect-termination.e2e-spec.ts`

### Implementation for User Story 3

- [x] T022 [US3] Verify `EffectRemovedReport` is included in fight result serialization — no additional implementation expected (step is already pushed by EndEventProcessor from T017)

**Checkpoint**: Full end-to-end flow works. Fight log contains correct `effect_removed` steps.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T023 Update API documentation in `docs/memory-bank/backend/API_DOCS.md` with new `terminationEvent` field on EffectDto and `effect_removed` step kind
- [x] T024 Update architecture documentation in `docs/memory-bank/backend/ARCHITECTURE.md` and `docs/memory-bank/CODEBASE_STRUCTURE.md` to reflect event-bound effect termination
- [x] T025 Run quality gates: `npm run format` → `npm run lint` → `npm run test:cov` → `npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — can start immediately
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion (parallel with US1)
- **User Story 3 (Phase 5)**: Depends on US1 (Phase 3) AND US2 (Phase 4) — needs both domain and API layers
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational — no dependencies on other stories
- **User Story 3 (P2)**: Depends on US1 + US2 (needs full pipeline for e2e test)

### Within Each User Story

- Tests written and confirmed FAILING before implementation
- Type definitions before method implementations
- Domain layer before API layer

### Parallel Opportunities

- T002, T003, T004 can run in parallel (three CardState implementations)
- T005, T006, T007 can run in parallel (three AttackEffect implementations)
- T009–T013 can run in parallel (unit tests for removeEventBoundEffects)
- US1 and US2 can proceed in parallel after Phase 2

---

## Parallel Example: Phase 2

```bash
# After T001 (interface change), launch all CardState updates together:
Task: T002 "Add terminationEvent to CardStatePoisoned"
Task: T003 "Add terminationEvent to CardStateBurned"
Task: T004 "Add terminationEvent to CardStateFrozen"

# Then launch all AttackEffect updates together:
Task: T005 "Add terminationEvent to AttackPoisonedEffect"
Task: T006 "Add terminationEvent to AttackBurnedEffect"
Task: T007 "Add terminationEvent to AttackFrozenEffect"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (terminationEvent on types)
2. Complete Phase 3: User Story 1 (core removal mechanic)
3. **STOP and VALIDATE**: Run unit tests, verify effects are removed
4. Core value delivered

### Incremental Delivery

1. Phase 2 → Foundation ready
2. Add US1 → Test independently → Core mechanic works (MVP!)
3. Add US2 → Test independently → API supports the feature
4. Add US3 → Test independently → Fight log is complete
5. Phase 6 → Documentation and quality gates

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Constitution mandates TDD: tests MUST fail before implementation
- Commit after each task or logical group
- All existing tests must remain green throughout
