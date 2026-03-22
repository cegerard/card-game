# Tasks: Event-Bound Buff Termination

**Input**: Design documents from `/specs/002-event-bound-buff/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api-changes.md ✅, quickstart.md ✅

**Tests**: Included — constitution mandates test-first development (no mocking of functional components).

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new project structure needed — changes extend existing files within `src/fight/core/` and `src/fight/http-api/`. No setup tasks required.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domain type extensions that all three user stories depend on. These are pure type changes — no runtime behaviour.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 [P] Extend `Buff` type with optional `terminationEvent?: string` field in `src/fight/core/cards/@types/buff/buff.ts`
- [X] T002 [P] Extend `SkillResults` type with optional `endEvent?: string` field in `src/fight/core/cards/skills/skill.ts`
- [X] T003 [P] Add `StepKind.BuffRemoved = 'buff_removed'` to the enum and add `BuffRemovedReport` to the `Step` union in `src/fight/core/fight-simulator/@types/step.ts`
- [X] T004 [P] Create `BuffRemovedReport` type `{ kind: StepKind.BuffRemoved; source: CardInfo; eventName: string; removed: { target: CardInfo; kind: BuffType; value: number }[] }` in `src/fight/core/fight-simulator/@types/buff-removed-report.ts`

**Checkpoint**: Domain types ready — all user stories can now begin.

---

## Phase 3: User Story 1 — Skill Applies an Event-Bound Buff (Priority: P1) 🎯 MVP

**Goal**: A buff configured with `terminationEvent` persists until that event fires, refreshes instead of stacking on re-application, and is tracked on `FightingCard` so it can be removed later.

**Independent Test**: Run a battle where a card has a skill applying a buff with `terminationEvent`. Verify the buff is present during active turns and that calling `removeEventBoundBuffs()` with the event name removes it.

### Tests for User Story 1 ⚠️ Write these FIRST — they must FAIL before implementation

- [X] T005 [US1] Add failing tests for `applyBuff()` refresh semantics: event-bound buff with same type+event refreshes in-place; duration-only buff still stacks; in `src/fight/core/cards/__tests__/fighting-card.spec.ts`
- [X] T006 [US1] Add failing tests for `removeEventBoundBuffs()`: returns removed `{ type, value }` list and clears matching buffs; non-matching buffs remain; in `src/fight/core/cards/__tests__/fighting-card.spec.ts`
- [X] T007 [US1] Add failing tests for `lifecycleEndEvents()`: returns `endEvent` strings of non-exhausted lifecycle skills only; in `src/fight/core/cards/__tests__/fighting-card.spec.ts`

### Implementation for User Story 1

- [X] T008 [US1] Add `terminationEvent?: string` to `BuffApplication` constructor and propagate it to `FightingCard.applyBuff()` call site in `src/fight/core/cards/@types/buff/buff-application.ts`
- [X] T009 [US1] Update `FightingCard.applyBuff()` to accept `terminationEvent?`, implement refresh semantics (replace existing event-bound buff of same type+event), and store `terminationEvent` on the `Buff` object in `src/fight/core/cards/fighting-card.ts`
- [X] T010 [US1] Add `removeEventBoundBuffs(eventName: string): { type: BuffType; value: number }[]` to `FightingCard` — removes all buffs where `terminationEvent === eventName`, returns removed list; in `src/fight/core/cards/fighting-card.ts`
- [X] T011 [US1] Add `lifecycleEndEvents(): string[]` to `FightingCard` — returns `endEvent` values of non-exhausted lifecycle-limited skills; in `src/fight/core/cards/fighting-card.ts`
- [X] T012 [US1] Add optional `terminationEvent?: string` with `@IsOptional() @IsString() @IsNotEmpty()` decorators to `OtherSkillDto` (BUFF kind) and `BuffApplicationDto` in `src/fight/http-api/dto/fight-data.dto.ts`
- [X] T013 [US1] Update `fight.controller.ts` factory mappings to pass `terminationEvent` from `OtherSkillDto` and `BuffApplicationDto` through to `BuffApplication` constructor in `src/fight/http-api/fight.controller.ts`

**Checkpoint**: US1 fully functional — event-bound buffs can be applied and tracked. `removeEventBoundBuffs()` and `lifecycleEndEvents()` ready for US2/US3.

---

## Phase 4: User Story 2 — Skill Emits an End Event After Its Lifecycle Completes (Priority: P2)

**Goal**: A `BuffSkill` with `activationLimit` and `endEvent` tracks its activation count, becomes inactive after N triggers, emits the end event on the N-th activation, and the `TurnManager` removes matching buffs from all cards via `EndEventProcessor`.

**Independent Test**: Configure a `BuffSkill` with `activationLimit: 3`. Run a battle for 4+ turns. Verify the fight log shows a `buff_removed` step after the 3rd activation, and the skill never fires on turn 4+.

### Tests for User Story 2 ⚠️ Write these FIRST — they must FAIL before implementation

- [X] T014 [US2] Add failing tests for `BuffSkill` lifecycle: `launch()` increments `activationCount`; on N-th call returns `endEvent` in `SkillResults`; `isTriggered()` returns false after limit reached; in `src/fight/core/cards/skills/__tests__/buff-skill.spec.ts`
- [X] T015 [P] [US2] Add failing tests for `EndEventProcessor.processEndEvent()`: produces `StepKind.BuffRemoved` steps for cards with matching termination event; skips cards with no matching buffs; in `src/fight/core/fight-simulator/__tests__/end-event-processor.spec.ts`

### Implementation for User Story 2

- [X] T016 [US2] Extend `BuffSkill` with optional `activationLimit?: number`, private `activationCount = 0`, and optional `endEvent?: string`; update `launch()` to increment counter and include `endEvent` in result when limit reached; update `isTriggered()` to return `false` once exhausted; in `src/fight/core/cards/skills/buff-skill.ts`
- [X] T017 [US2] Create `EndEventProcessor` class with constructor `(player1: Player, player2: Player)` and method `processEndEvent(eventName: string, source: CardInfo): Step[]`; iterates `playableCards` on both players, calls `removeEventBoundBuffs()`, produces `BuffRemovedReport` steps; in `src/fight/core/fight-simulator/end-event-processor.ts`
- [X] T018 [US2] Inject `EndEventProcessor` into `Fight` and `TurnManager`; update `TurnManager.endTurn()` to check `SkillResults.endEvent` and call `EndEventProcessor.processEndEvent()`, appending returned steps; in `src/fight/core/fight-simulator/turn-manager.ts`
- [X] T019 [US2] Update `Fight` orchestrator to instantiate `EndEventProcessor` with `player1` and `player2` and pass it to `TurnManager` in `src/fight/core/fight-simulator/fight.ts`
- [X] T020 [US2] Add optional `activationLimit?` with `@IsOptional() @IsNumber() @Min(1)` and `endEvent?` with `@IsOptional() @IsString() @IsNotEmpty()` to `OtherSkillDto` in `src/fight/http-api/dto/fight-data.dto.ts`
- [X] T021 [US2] Update controller to pass `activationLimit` and `endEvent` from `OtherSkillDto` to `BuffSkill` constructor in `src/fight/http-api/fight.controller.ts`

**Checkpoint**: US2 fully functional — skills exhaust their lifecycle, emit end events, and `TurnManager` removes bound buffs producing `buff_removed` fight log steps.

---

## Phase 5: User Story 3 — Card Death Cleans Up Event-Bound Buffs (Priority: P3)

**Goal**: When a card with a non-exhausted lifecycle skill dies, `DeathSkillHandler` calls `card.lifecycleEndEvents()` and fires `EndEventProcessor.processEndEvent()` for each event, removing all orphaned event-bound buffs.

**Independent Test**: Configure a card with a lifecycle skill applying an event-bound buff to allies. Kill that card before the activation limit is reached. Verify all allied cards lose the buff and a `buff_removed` step appears in the fight log immediately after the death step.

### Tests for User Story 3 ⚠️ Write these FIRST — they must FAIL before implementation

- [X] T022 [US3] Add failing tests for `DeathSkillHandler.notifyDeath()`: on card death with a non-exhausted lifecycle skill, `drainSteps()` includes `StepKind.BuffRemoved` steps for allied cards holding event-bound buffs; in `src/fight/core/fight-simulator/__tests__/death-skill-handler.spec.ts`

### Implementation for User Story 3

- [X] T023 [US3] Extend `DeathSkillHandler` constructor to accept `EndEventProcessor`; update `notifyDeath()` to call `deadCard.lifecycleEndEvents()` and invoke `endEventProcessor.processEndEvent()` for each name, accumulating steps via `drainSteps()`; in `src/fight/core/fight-simulator/death-skill-handler.ts`
- [X] T024 [US3] Update `Fight` orchestrator to pass `EndEventProcessor` to `DeathSkillHandler` constructor in `src/fight/core/fight-simulator/fight.ts`

**Checkpoint**: All three user stories independently functional — event-bound buffs are applied, lifecycle-managed, and cleaned up on card death.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and integration validation.

- [X] T025 [P] Add e2e test for the Lion's Inheritance scenario (3-activation buff, `buff_removed` on 3rd turn, no buff/skill on turn 4) per `specs/002-event-bound-buff/quickstart.md` in `test/fight/`
- [X] T026 Run full quality gate: `npm run format && npm run lint && npm run test:cov && npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No prior dependency — start immediately. All T001–T004 are parallel.
- **User Stories (Phase 3–5)**: All depend on Phase 2 completion.
  - US1 (Phase 3) must complete before US2/US3 consume `removeEventBoundBuffs()` and `lifecycleEndEvents()`.
  - US2 (Phase 4) must complete before US3 consumes `EndEventProcessor`.
  - US3 (Phase 5): Depends on US1 (FightingCard methods) and US2 (`EndEventProcessor`).
- **Polish (Phase 6)**: Depends on all user stories.

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 2 — can start immediately after foundational types.
- **US2 (P2)**: Depends on US1 (`lifecycleEndEvents()` on `FightingCard`, `BuffApplication.terminationEvent`).
- **US3 (P3)**: Depends on US1 (`lifecycleEndEvents()`) and US2 (`EndEventProcessor`).

### Within Each User Story

- Tests MUST be written and FAIL before implementation tasks begin.
- `FightingCard` methods (T009–T011) must precede HTTP layer tasks (T012–T013).
- `EndEventProcessor` (T017) must be created before `TurnManager` wiring (T018) and `DeathSkillHandler` wiring (T023).

### Parallel Opportunities

- T001, T002, T003, T004 — all parallel (different files, pure types).
- T005, T006, T007 — sequential (same test file, write in order).
- T014, T015 — parallel (different test files).
- T016, T017 — parallel (different source files).
- T018, T019 — sequential (T019 depends on T018's injection shape).
- T025, T026 — T025 is parallel to T026 start; T026 must run after T025.

---

## Parallel Example: Phase 2 (Foundational)

```bash
# All four type changes are independent files — run together:
Task T001: "Extend Buff type in src/fight/core/cards/@types/buff/buff.ts"
Task T002: "Extend SkillResults in src/fight/core/cards/skills/skill.ts"
Task T003: "Add StepKind.BuffRemoved in src/fight/core/fight-simulator/@types/step.ts"
Task T004: "Create BuffRemovedReport in src/fight/core/fight-simulator/@types/buff-removed-report.ts"
```

## Parallel Example: User Story 2 — Tests

```bash
# Two test files, independent:
Task T014: "BuffSkill lifecycle tests in src/fight/core/cards/skills/__tests__/buff-skill.spec.ts"
Task T015: "EndEventProcessor tests in src/fight/core/fight-simulator/__tests__/end-event-processor.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational type extensions (T001–T004)
2. Complete Phase 3: US1 — event-bound buff applied, tracked, and removable (T005–T013)
3. **STOP and VALIDATE**: `npm run test:cov` — US1 tests pass; existing buff tests unaffected

### Incremental Delivery

1. Phase 2 → Foundation ready
2. Phase 3 (US1) → Event-bound buff applies and tracks correctly → MVP
3. Phase 4 (US2) → Lifecycle limit fires end event; `TurnManager` removes buffs
4. Phase 5 (US3) → Card death cleans up orphaned buffs
5. Phase 6 → Full quality gates, e2e test

---

## Notes

- `duration: 0` in DTO means "no turn limit" when `terminationEvent` is set → mapped to `Infinity` in domain (see research.md Decision 8)
- `Infinity - 1 === Infinity` in JS: existing duration-decrease logic requires zero changes
- Duration-only buffs are entirely unaffected (SC-002 regression guard)
- `activationLimit` and `endEvent` are independent in the DTO but must both be set for FR-002/FR-004 to apply (see contracts/api-changes.md)
- All new DTO fields are `@IsOptional()` — zero breaking changes to existing payloads
