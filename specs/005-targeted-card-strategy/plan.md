# Implementation Plan: Targeted Card Strategy

**Branch**: `005-targeted-card-strategy` | **Date**: 2026-04-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-targeted-card-strategy/spec.md`

## Summary

Add a new `targeted-card` targeting strategy that locks onto a specific enemy card by ID. The strategy returns that card as the sole target while alive, or an empty list when dead. It is restricted to targeting override skills only — validation rejects it in any other context (simple attack, special, other skill targeting).

## Technical Context

**Language/Version**: TypeScript on Node.js 24
**Primary Dependencies**: NestJS 11, class-validator, class-transformer
**Storage**: N/A (stateless in-memory simulator)
**Testing**: Jest 29, ts-jest, @nestjs/testing, supertest, @faker-js/faker
**Target Platform**: Linux server (Docker, Node.js 24 Alpine)
**Project Type**: Web service (single REST endpoint)
**Performance Goals**: N/A (battle simulator, not latency-critical)
**Constraints**: Stateless per-request processing
**Scale/Scope**: Single endpoint, ~20 targeting/skill/behavior implementations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Domain Isolation | PASS | New strategy class in `src/fight/core/targeting-card-strategies/`. Factory mapping in HTTP layer. |
| II. Test-First Development | PASS | Unit tests for strategy, validation tests for DTO restriction, E2E test for full flow. |
| III. Simplicity | PASS | Single new class (~15 lines), one enum value, one factory entry, validation guard. No abstractions. |
| IV. Fail Fast | PASS | Validation rejects misconfiguration at DTO boundary. Strategy returns empty array for dead/missing targets (consistent with existing strategies). |
| V. Clean Code | PASS | Follows existing strategy pattern exactly. No duplication. |

**Post-design re-check**: All gates still PASS. No complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-targeted-card-strategy/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-contract.md  # DTO changes
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/fight/
├── core/
│   └── targeting-card-strategies/
│       └── targeted-card.ts              # NEW: TargetedCard strategy class
├── http-api/
│   ├── dto/
│   │   └── fight-data.dto.ts             # MODIFIED: Add TARGETED_CARD enum, validation
│   └── targeting-strategy-factory.ts     # MODIFIED: Add factory mapping
└── (no other files affected)

src/fight/core/__tests__/
└── targeted-card.spec.ts                 # NEW: Unit tests

test/fight/
└── targeted-card-strategy.e2e-spec.ts    # NEW: E2E test
```

**Structure Decision**: Follows existing single-project hexagonal layout. New strategy class mirrors existing strategies in `targeting-card-strategies/`. Tests colocated per convention.

## Complexity Tracking

> No violations — no entries needed.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    |            |                                     |
