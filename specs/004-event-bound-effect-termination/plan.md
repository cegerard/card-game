# Implementation Plan: Event-Bound Effect Termination

**Branch**: `004-event-bound-effect-termination` | **Date**: 2026-04-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-event-bound-effect-termination/spec.md`

## Summary

Add an optional `terminationEvent` field to status effects (poison, burn, freeze) so they can be removed when a named event fires during battle. Extend the existing `EndEventProcessor` — which already removes event-bound buffs — to also scan and remove matching status effects from all living cards. Introduce a new `effect_removed` step kind in the fight log. The API gains an optional `terminationEvent` string on `EffectDto`.

## Technical Context

**Language/Version**: TypeScript on Node.js 24
**Primary Dependencies**: NestJS 11, class-validator, class-transformer
**Storage**: N/A (stateless in-memory simulator)
**Testing**: Jest 29, ts-jest, supertest, @faker-js/faker
**Target Platform**: Linux server (Docker, Heroku)
**Project Type**: Web service (REST API, single POST /fight endpoint)
**Performance Goals**: N/A (stateless request-response simulator)
**Constraints**: Zero regression on existing fights; backwards compatibility for effects without terminationEvent
**Scale/Scope**: Single endpoint, ~8 domain files affected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Domain Isolation | PASS | terminationEvent flows through domain CardState; DTO mapping stays in HTTP layer |
| II. Test-First Development | PASS | Plan follows Red-Green-Refactor for each capability |
| III. Simplicity — No Over-Engineering | PASS | Reuses existing EndEventProcessor; adds one optional field to CardState; no new abstractions |
| IV. Fail Fast — No Silent Errors | PASS | No silent fallbacks — effects without terminationEvent behave as today; dead cards skipped explicitly |
| V. Clean Code — Eliminate Duplication | PASS | Extends EndEventProcessor rather than creating a parallel mechanism; same event-driven pattern as buffs |

**Quality Gates**: `npm run format` → `npm run lint` → `npm run test:cov` → `npm run build` (all must pass before merge)

## Project Structure

### Documentation (this feature)

```text
specs/004-event-bound-effect-termination/
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
│   │   ├── fighting-card.ts              # Add removeEventBoundEffects() method
│   │   └── @types/
│   │       └── state/
│   │           ├── card-state.ts          # Add optional terminationEvent field
│   │           ├── card-state-poisoned.ts # Accept terminationEvent in constructor
│   │           ├── card-state-burned.ts   # Accept terminationEvent in constructor
│   │           └── card-state-frozen.ts   # Accept terminationEvent in constructor
│   │       └── attack/
│   │           ├── attack-poisoned-effect.ts  # Pass terminationEvent to CardState
│   │           ├── attack-burned-effect.ts    # Pass terminationEvent to CardState
│   │           └── attack-frozen-effect.ts    # Pass terminationEvent to CardState
│   ├── fight-simulator/
│   │   ├── end-event-processor.ts       # Extend to also remove event-bound effects
│   │   └── @types/
│   │       ├── step.ts                  # Add EffectRemoved step kind
│   │       └── effect-removed-report.ts # NEW: report type for effect removal
├── http-api/
│   ├── dto/
│   │   └── fight-data.dto.ts            # Add optional terminationEvent to EffectDto
│   └── fight.controller.ts             # Pass terminationEvent from DTO to AttackEffect constructors

test/
├── helpers/
│   └── effect.ts                        # Support terminationEvent in factory
└── fight/
    └── (e2e tests for event-bound effect termination)
```

**Structure Decision**: Follows existing hexagonal architecture. Extends existing types and EndEventProcessor. Single new file for the `EffectRemovedReport` type.

## Key Design Decisions

### 1. Extend CardState interface with optional terminationEvent

**Current**: `CardState` has `type`, `level`, `remainingTurns`, and `applyState()`. No event-based termination.
**Design**: Add optional `terminationEvent?: string` to the `CardState` interface. Each concrete implementation (poisoned, burned, frozen) accepts it in its constructor and stores it.

**Rationale**: Mirrors the pattern already used by `Buff` type, keeping the mental model consistent.

### 2. Add removeEventBoundEffects() to FightingCard

**Current**: `FightingCard` has `removeEventBoundBuffs(eventName)` for buffs.
**Design**: Add `removeEventBoundEffects(eventName)` that checks each active status effect (poisoned, burned, frozen) and removes those whose `terminationEvent` matches. Returns an array of removed effect info (type, card identity).

**Rationale**: Parallels `removeEventBoundBuffs()` — same pattern, different target.

### 3. Extend EndEventProcessor to handle effects

**Current**: `EndEventProcessor.processEndEvent()` iterates all living cards and calls `removeEventBoundBuffs()`.
**Design**: In the same pass, also call `removeEventBoundEffects()` on each card. Collect results and emit `StepKind.EffectRemoved` steps alongside existing `StepKind.BuffRemoved` steps.

**Rationale**: Single processing point for all event-bound cleanup. No new class needed — just extend the existing processor.

### 4. EffectRemovedReport step

**Design**: New step kind `effect_removed` with fields: `source` (CardInfo of event emitter), `eventName`, `removed` array of `{ target: CardInfo, effectType: string }`.

**Rationale**: Mirrors `BuffRemovedReport` structure for consistency.

### 5. terminationEvent propagation from DTO to domain

**Current**: `EffectDto` has `type`, `rate`, `level`, `triggeredDebuff?`. Controller creates `AttackEffect` instances.
**Design**: Add `terminationEvent?: string` to `EffectDto`. Controller passes it through to `AttackPoisonedEffect`, `AttackBurnedEffect`, `AttackFrozenEffect` constructors. Each `applyEffect()` method passes it to the `CardState` constructor.

## Complexity Tracking

> No constitution violations. No complexity justification needed.
