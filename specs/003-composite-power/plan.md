# Implementation Plan: Composite Power

**Branch**: `003-composite-power` | **Date**: 2026-03-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-composite-power/spec.md`

## Summary

Add a `powerId` grouping mechanism to existing skills so multiple skills on a card can be declared as a single composite power. All grouped skills share the same trigger event and termination event, ensuring simultaneous activation and unified cleanup. Additionally, introduce a new skill kind — targeting strategy override — that temporarily replaces a card's base attack targeting and reverts on power expiration. The `powerId` is propagated into fight log steps for client-side display grouping.

## Technical Context

**Language/Version**: TypeScript on Node.js 24
**Primary Dependencies**: NestJS 11, class-validator, class-transformer
**Storage**: N/A (stateless in-memory simulator)
**Testing**: Jest 29, ts-jest, supertest, @faker-js/faker
**Target Platform**: Linux server (Docker, Heroku)
**Project Type**: Web service (REST API, single POST /fight endpoint)
**Performance Goals**: N/A (stateless request-response simulator)
**Constraints**: Zero regression on existing fights; backwards compatibility for skills without powerId
**Scale/Scope**: Single endpoint, ~15 domain files affected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Domain Isolation | PASS | powerId flows through domain entities and reports; DTO mapping stays in HTTP layer; targeting override factory stays in HTTP layer |
| II. Test-First Development | PASS | Plan follows Red-Green-Refactor: tests written first for each capability |
| III. Simplicity — No Over-Engineering | PASS | powerId is a simple optional string on existing types; no new abstractions beyond TargetingOverride skill; leverages existing EndEventProcessor |
| IV. Fail Fast — No Silent Errors | PASS | API validates powerId consistency (same trigger, same terminationEvent); throws on mismatch |
| V. Clean Code — Eliminate Duplication | PASS | Reuses existing AlterationSkill, EndEventProcessor, Skill interface; no code duplication |

**Quality Gates**: `npm run format` → `npm run lint` → `npm run test:cov` → `npm run build` (all must pass before merge)

## Project Structure

### Documentation (this feature)

```text
specs/003-composite-power/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-contract.md  # Updated POST /fight contract
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src/fight/
├── core/
│   ├── cards/
│   │   ├── fighting-card.ts              # Add targeting override/restore, propagate powerId in launchSkills
│   │   ├── @types/
│   │   │   └── buff/
│   │   │       └── buff.ts               # Add optional powerId field
│   │   └── skills/
│   │       ├── skill.ts                  # Add optional powerId to SkillResults
│   │       ├── alteration-skill.ts       # Accept and propagate powerId
│   │       ├── healing.ts               # Accept and propagate powerId
│   │       ├── simple-attack.ts         # Expose targeting strategy for override
│   │       └── targeting-override.ts    # NEW: targeting override skill
│   ├── fight-simulator/
│   │   ├── turn-manager.ts              # Handle targeting override cleanup via EndEventProcessor
│   │   ├── end-event-processor.ts       # Extend to also revert targeting overrides
│   │   └── @types/
│   │       ├── step.ts                  # Add TargetingOverride and TargetingReverted step kinds
│   │       ├── buff-report.ts           # Add optional powerId
│   │       ├── buff-removed-report.ts   # Add optional powerId
│   │       └── targeting-override-report.ts  # NEW: report types
│   └── card-action/
│       └── action_stage.ts              # No change needed (uses card.launchAttack which delegates to simpleAttack)
├── http-api/
│   ├── dto/
│   │   └── fight-data.dto.ts            # Add powerId to OtherSkillDto; add TARGETING_OVERRIDE kind
│   └── fight.controller.ts             # Map TARGETING_OVERRIDE DTO; validate powerId consistency
└── tools/
    └── (no changes)

test/
├── helpers/
│   └── fighting-card.ts                 # Support powerId and targeting override in factory
└── fight/
    └── (e2e tests for composite power scenarios)
```

**Structure Decision**: Follows existing hexagonal architecture. New `targeting-override.ts` skill in `src/fight/core/cards/skills/`. New report types in `src/fight/core/fight-simulator/@types/`. All DTO changes in HTTP layer.

## Key Design Decisions

### 1. `launchSkill` returns only first match — must change to return ALL matches

**Current**: `FightingCard.launchSkill()` uses `find()` which returns only the first skill matching a trigger.
**Required**: Composite powers need ALL skills with the same trigger to fire. Must change to `filter()` and return an array of `SkillResults`.

**Impact**: `TurnManager` and `ActionStage` call `launchSkill()`. Both must handle the new array return type.

### 2. Targeting override via FightingCard delegation

**Current**: `SimpleAttack.targetingStrategy` is private and immutable. `FightingCard.launchAttack()` delegates directly.
**Design**: Add `overrideAttackTargeting(strategy, terminationEvent)` and `restoreAttackTargeting(eventName)` on `FightingCard`. The card wraps the real attack skill, intercepting the targeting strategy. On restore, it reverts to the original.

### 3. powerId propagation in steps

**Design**: Add optional `powerId?: string` to `BuffReport`, `DebuffReport`, `HealingReport`, `BuffRemovedReport`, and the new `TargetingOverrideReport` / `TargetingRevertedReport`. Skills carry `powerId` and pass it through `SkillResults`. Callers (TurnManager, ActionStage) propagate it into step construction.

### 4. API validation of powerId consistency

**Design**: In `FightController`, after creating all skills for a card, group by `powerId` and validate:
- All skills in a group have the same `event` (trigger)
- All skills in a group have the same `terminationEvent`
- Throw 400 on mismatch

## Complexity Tracking

> No constitution violations. No complexity justification needed.
