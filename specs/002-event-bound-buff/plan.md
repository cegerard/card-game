# Implementation Plan: Event-Bound Buff Termination

**Branch**: `002-event-bound-buff` | **Date**: 2026-03-22 | **Spec**: `specs/002-event-bound-buff/spec.md`

## Summary

Add lifecycle-limited skills that emit a named end event after N activations (or on card death), and allow buffs to declare a termination event so they are automatically removed when that event fires. All existing duration-based buff behaviour is unchanged.

## Technical Context

**Language/Version**: TypeScript on Node.js 24
**Primary Dependencies**: NestJS 11, class-validator, class-transformer
**Storage**: N/A (stateless in-memory simulator)
**Testing**: Jest 29, ts-jest, @nestjs/testing, supertest
**Target Platform**: Linux server (Docker, Heroku)
**Project Type**: REST web-service (single endpoint `POST /fight`)
**Performance Goals**: No change — same stateless per-request processing
**Constraints**: Zero breaking changes to existing API payloads; all new fields optional
**Scale/Scope**: Single feature addition on top of existing battle domain

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Domain Isolation | ✅ PASS | All new domain logic in `src/fight/core/`; new DTO fields in `src/fight/http-api/` only |
| II. Test-First Development | ✅ PASS | Tests written before implementation; no mocking of functional components |
| III. Simplicity | ✅ PASS | One new processor class, one new step kind; no new abstractions for hypothetical needs |
| IV. Fail Fast | ✅ PASS | Invalid `terminationEvent`/`endEvent` combos validated at DTO layer |
| V. Clean Code | ✅ PASS | `EndEventProcessor` eliminates duplication between `TurnManager` and `DeathSkillHandler` |

## Project Structure

### Documentation (this feature)

```text
specs/002-event-bound-buff/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api-changes.md   # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code Changes

```text
src/fight/core/
├── cards/
│   ├── @types/
│   │   └── buff/
│   │       └── buff.ts                         MODIFIED: + terminationEvent?: string
│   ├── fighting-card.ts                        MODIFIED: applyBuff() refresh logic, removeEventBoundBuffs(), lifecycleEndEvents()
│   └── skills/
│       ├── skill.ts                            MODIFIED: SkillResults + endEvent?: string
│       └── buff-skill.ts                       MODIFIED: + activationLimit, activationCount, endEvent
├── fight-simulator/
│   ├── @types/
│   │   ├── buff-removed-report.ts              NEW
│   │   └── step.ts                             MODIFIED: + StepKind.BuffRemoved, Step union
│   ├── end-event-processor.ts                  NEW
│   ├── death-skill-handler.ts                  MODIFIED: call EndEventProcessor on card death
│   └── turn-manager.ts                         MODIFIED: handle endEvent from SkillResults

src/fight/http-api/
├── dto/
│   └── fight-data.dto.ts                       MODIFIED: + activationLimit, endEvent on OtherSkillDto; + terminationEvent on BuffApplicationDto
└── fight.controller.ts                         MODIFIED: pass new DTO fields to domain constructors
```

**Structure Decision**: Single project, no new directories. Changes are minimal extensions to existing files plus two new files (`end-event-processor.ts`, `buff-removed-report.ts`).

## Complexity Tracking

No constitution violations — no entry needed.

## Implementation Layers

### Layer 1: Domain Types (no behaviour)

1. Extend `Buff` type with `terminationEvent?: string`
2. Extend `SkillResults` with `endEvent?: string`
3. Add `StepKind.BuffRemoved` and update `Step` union
4. Create `BuffRemovedReport` type

### Layer 2: `FightingCard` methods

5. Update `applyBuff()` signature to accept `terminationEvent?` and implement refresh semantics
6. Add `removeEventBoundBuffs(eventName): { type, value }[]`
7. Add `lifecycleEndEvents(): string[]`

### Layer 3: `BuffSkill` lifecycle

8. Add `activationLimit?`, `activationCount`, `endEvent?` to `BuffSkill`
9. Increment counter in `launch()`, set `endEvent` in result when limit reached
10. `isTriggered()` returns `false` once exhausted

### Layer 4: `EndEventProcessor`

11. Create `EndEventProcessor` with `processEndEvent(eventName, source): Step[]`

### Layer 5: Wire into fight flow

12. `TurnManager`: handle `endEvent` from `SkillResults` — call `EndEventProcessor`, append steps
13. `DeathSkillHandler`: on death, call `card.lifecycleEndEvents()`, process via `EndEventProcessor`

### Layer 6: HTTP API

14. Extend `OtherSkillDto` with `activationLimit?`, `endEvent?`, `terminationEvent?`
15. Extend `BuffApplicationDto` with `terminationEvent?`
16. Update `fight.controller.ts` factory mappings

### Layer 7: `BuffApplication`

17. Add `terminationEvent?` to `BuffApplication` constructor; pass through to `applyBuff()`
