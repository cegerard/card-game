# Tasks: Survive Skill

**Input**: Design documents from `/specs/007-survive-skill/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Exact file paths are included in every description

---

## Phase 1: Setup

No new directories or project structure required. All new files fit into existing directories.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: New step types shared by both user stories. Must exist before any domain code can reference `StepKind.Survived`.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 Add `StepKind.Survived = 'survived'` to the `StepKind` enum in `src/fight/core/fight-simulator/@types/step.ts`, create `SurvivedReport = { kind: StepKind.Survived; name: string; card: CardInfo }` in `src/fight/core/fight-simulator/@types/survived-report.ts`, and add `SurvivedReport` to the `Step` union in `src/fight/core/fight-simulator/@types/step.ts`

**Checkpoint**: `StepKind.Survived` and `SurvivedReport` are available — user story implementation can begin.

---

## Phase 3: User Story 1 — Survive a Fatal Blow (Priority: P1) 🎯 MVP

**Goal**: A card configured with the Survive skill survives the first fatal blow and drops to exactly 1 HP. The `survived` step appears in the battle log at the correct position. A second fatal blow kills normally.

**Independent Test**: POST `/fight` with one card carrying a `SURVIVE` skill and a one-shot kill scenario. Assert: card is alive with 1 HP, `survived` step present; repeat with second blow, assert card dies normally.

### Tests for User Story 1 ⚠️ Write FIRST — confirm they FAIL before implementing

- [X] T002 [P] [US1] Write unit tests for `SurviveSkill.tryConsume()` — returns `true` first call, `false` on subsequent calls — in `src/fight/core/cards/skills/__tests__/survive.spec.ts`
- [X] T003 [P] [US1] Write unit tests for `FightingCard.applyFinalDamage()` with survive — HP set to 1, `survived: true` returned; second fatal blow kills; non-fatal damage does not trigger survive — in `src/fight/core/cards/__tests__/fighting-card-survive.spec.ts`
- [X] T004 [US1] Write E2E tests covering: `survived` step present and at correct position after `attack` step; card remains alive at 1 HP; second fatal blow produces `status_change: dead` normally; card without survive dies normally — in `test/fight/survive-skill.e2e-spec.ts`

### Implementation for User Story 1

- [X] T005 [P] [US1] Create `SurviveSkill` with `name: string` and `private consumed = false`; implement `tryConsume(): boolean` (single-use) — in `src/fight/core/cards/skills/survive.ts`
- [X] T006 [P] [US1] Add `survived?: boolean` and `survivedSkillName?: string` to `AttackResult` in `src/fight/core/cards/@types/action-result/attack-result.ts`; add the same two optional fields to the `FinalDamageResult` type in `src/fight/core/cards/fighting-card.ts`
- [X] T007 [US1] Integrate `SurviveSkill` in `FightingCard` in `src/fight/core/cards/fighting-card.ts`: add `private surviveSkill: SurviveSkill | null = null` field; add `survive?: SurviveSkill` to the `skills` constructor parameter; assign `this.surviveSkill = skills.survive ?? null`; modify `applyFinalDamage()` to intercept fatal blows — when `actualHealth - damageToHealth <= 0` and `surviveSkill.tryConsume()` succeeds, cap `damageToHealth` to `actualHealth - 1` and return `{ damageToHealth, shieldAbsorbed, survived: true, survivedSkillName: surviveSkill.name }` (depends on T005, T006)
- [X] T008 [US1] Handle the `survived` branch in `ActionStage.handleAttackResult()` in `src/fight/core/card-action/action-stage.ts`: when `damageDealt.survived` is true, push a `SurvivedReport` step to `report.statusChanges`, then call `defensiveCard.launchSkills('survived', this.getFightingContext(defensiveCard))` and push the resulting steps via `skillResultsToSteps()` — card is alive so no death handling fires (depends on T001, T007)
- [X] T009 [P] [US1] Add `SURVIVE = 'SURVIVE'` to the `SkillKind` enum and extend the `event` field `@ValidateIf` guard to exclude `SURVIVE` kind (matching the existing SHIELD exclusion pattern) in `src/fight/http-api/dto/fight-data.dto.ts`
- [X] T010 [US1] Add `case SkillKind.SURVIVE:` to `createOtherSkill()` returning `new SurviveSkill(skillData.name)`; in `convertCardDtoToCard()` extract the `SurviveSkill` from `allSkills`, filter it out of `otherSkills`, and pass it as `skills.survive` to the `FightingCard` constructor — in `src/fight/http-api/fight.controller.ts` (depends on T005, T009)

**Checkpoint**: User Story 1 fully functional — POST `/fight` with `SURVIVE` skill works end-to-end.

---

## Phase 4: User Story 2 — Survival Triggers Temporary Buffs (Priority: P2)

**Goal**: `ALTERATION` skills configured with `event: 'survived'` fire immediately after the survive step. Their buff steps appear in the battle log. The buffs expire at the end of the surviving card's next turn.

**Independent Test**: POST `/fight` with a `SURVIVE` skill and two `ALTERATION(event:'survived')` skills on the same card. Assert: two `buff` steps follow the `survived` step; at the end of the card's next turn the buffs expire (`buff_expired` steps).

### Tests for User Story 2 ⚠️ Write FIRST — confirm they FAIL before implementing

- [X] T011 [P] [US2] Write unit tests for `SurvivedTrigger` — `isTriggered('survived')` returns `true`; `isTriggered('turn-end')` returns `false` — in `src/fight/core/trigger/__tests__/survived.spec.ts`
- [X] T012 [P] [US2] Extend `test/fight/survive-skill.e2e-spec.ts` with buff scenarios: two `ALTERATION(event:'survived')` buffs appear immediately after the `survived` step in correct order; buffs are active during the surviving card's next action turn; `buff_expired` steps appear at the end of the next turn

### Implementation for User Story 2

- [X] T013 [US2] Create `SurvivedTrigger implements Trigger` with `id = 'survived'` and `isTriggered(triggerId): boolean { return triggerId === this.id; }` — in `src/fight/core/trigger/survived.ts`
- [X] T014 [P] [US2] Add `SURVIVED = 'survived'` to the `TriggerEvent` enum in `src/fight/http-api/dto/fight-data.dto.ts`
- [X] T015 [US2] Register `SurvivedTrigger` in `STRATEGY_MAP` as `[TriggerEvent.SURVIVED]: new SurvivedTrigger()` in `src/fight/http-api/trigger-factory.ts` (depends on T013, T014)

**Checkpoint**: User Stories 1 and 2 both functional — `ALTERATION(event:'survived')` buffs fire correctly via the survived event.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T016 Run quality gates in order: `npm run format`, `npm run lint`, `npm run test:cov`, `npm run build` — fix any issues before marking complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately
- **User Story 1 (Phase 3)**: Depends on T001 (StepKind.Survived) — BLOCKS T008
- **User Story 2 (Phase 4)**: Depends on Phase 3 completion (T008 must fire `launchSkills('survived')` for buffs to work end-to-end)
- **Polish (Phase 5)**: Depends on both user stories complete

### Within User Story 1

```
T001 → T002, T003, T004 (tests, parallel)
     → T005, T006, T009 (parallel implementation starts)
         T005 + T006 → T007 → T008
         T009 → T010
```

### Within User Story 2

```
Phase 3 complete → T011, T012 (tests, parallel)
                → T013, T014 (parallel)
                    T013 + T014 → T015
```

---

## Parallel Execution Examples

### User Story 1 — tests (write in parallel)
```
T002: survive.spec.ts
T003: fighting-card-survive.spec.ts
```

### User Story 1 — independent implementation starts (after T001)
```
T005: survive.ts         (no deps)
T006: attack-result.ts   (no deps)
T009: dto                (no deps)
```

### User Story 2 — tests and trigger/DTO (after Phase 3)
```
T011: survived.spec.ts
T012: E2E buff scenarios
T013: survived.ts
T014: dto TriggerEvent.SURVIVED
```

---

## Implementation Strategy

### MVP (User Story 1 only — ~8 tasks)

1. T001 — Foundational types
2. T002, T003, T004 — Failing tests
3. T005, T006 — New domain types (parallel)
4. T007 — FightingCard integration
5. T008 — ActionStage survived branch
6. T009, T010 — HTTP layer (parallel with T007–T008)
7. **STOP and VALIDATE**: `npm run test:e2e` — all survive tests green

### Full Feature (add User Story 2)

8. T011, T012 — Failing tests for buffs
9. T013, T014 — Trigger + DTO (parallel)
10. T015 — Trigger factory registration
11. T016 — Quality gates

---

## Notes

- `[P]` tasks touch different files with no blocking dependency — safe to execute concurrently
- Constitution principle II: every test (T002–T004, T011–T012) MUST be written and confirmed FAILING before its implementation tasks run
- `duration: 1` in `ALTERATION` DTO = buffs expire after two turn-end decrements = "end of next turn"
- `SurviveSkill` is NOT placed in `skills.others` — it is extracted in the controller and passed as `skills.survive` to `FightingCard`
- Commit after each task or logical group (T001, then T002–T004, then T005–T006, etc.)
