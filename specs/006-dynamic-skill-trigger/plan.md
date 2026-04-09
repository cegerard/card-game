# Implementation Plan: Dynamic Skill Trigger

**Branch**: `006-dynamic-skill-trigger` | **Date**: 2026-04-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-dynamic-skill-trigger/spec.md`

## Summary

Add support for skills that start dormant (no trigger) and can have their trigger changed during battle. A new `DynamicTrigger` wrapper activates when it observes a specific event (e.g., ally death) and then delegates to a replacement trigger (e.g., enemy death). This also requires a new `enemy-death` event type so that the opponent team's cards can react to a card's death.

## Technical Context

**Language/Version**: TypeScript on Node.js 24
**Primary Dependencies**: NestJS 11, class-validator, class-transformer
**Storage**: N/A (stateless in-memory simulator)
**Testing**: Jest 29, ts-jest, @nestjs/testing, supertest, @faker-js/faker
**Target Platform**: Linux server (Docker, Heroku)
**Project Type**: Web service (REST API, single endpoint)
**Performance Goals**: N/A (single-request simulation)
**Constraints**: Stateless, in-memory, max 100 turns per battle
**Scale/Scope**: Single POST /fight endpoint

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Domain Isolation | PASS | New trigger and event types live in `src/fight/core/trigger/`. DTO/factory changes in `src/fight/http-api/`. No cross-layer leakage. |
| II. Test-First Development | PASS | Tests written before implementation for all new components. |
| III. Simplicity — No Over-Engineering | PASS | `DynamicTrigger` is a single class wrapping existing `Trigger` interface. `EnemyDeath` mirrors `AllyDeath`. Minimal new code. |
| IV. Fail Fast — No Silent Errors | PASS | Factory throws if dormant trigger lacks required fields. |
| V. Clean Code — Eliminate Duplication | PASS | `EnemyDeath` follows same pattern as `AllyDeath`. `DynamicTrigger` composes existing triggers. |

No violations. Complexity Tracking table not needed.

## Project Structure

### Documentation (this feature)

```text
specs/006-dynamic-skill-trigger/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api-contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/fight/
├── core/
│   ├── trigger/
│   │   ├── trigger.ts                  # Existing interface (unchanged)
│   │   ├── ally-death.ts               # Existing (unchanged)
│   │   ├── turn-end.ts                 # Existing (unchanged)
│   │   ├── next-action.ts              # Existing (unchanged)
│   │   ├── enemy-death.ts              # NEW: matches 'enemy-death:<cardId>'
│   │   └── dynamic-trigger.ts          # NEW: dormant → active trigger wrapper
│   ├── fight-simulator/
│   │   └── death-skill-handler.ts      # MODIFIED: fire enemy-death on opponent team
│   ├── cards/
│   │   └── __tests__/                  # NEW tests for dynamic trigger
│   └── __tests__/
│       └── dynamic-trigger.spec.ts     # NEW: integration tests
├── http-api/
│   ├── dto/
│   │   └── fight-data.dto.ts           # MODIFIED: new TriggerEvent + dormant fields
│   └── trigger-factory.ts              # MODIFIED: handle new trigger types
└── tools/
```

**Structure Decision**: Follows existing project structure. New files placed in existing directories following established patterns.

## Complexity Tracking

> No violations to justify.
