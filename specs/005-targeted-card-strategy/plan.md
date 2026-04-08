# Implementation Plan: Targeted Card Strategy — Dynamic Resolution

**Branch**: `005-targeted-card-strategy` | **Date**: 2026-04-07 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-targeted-card-strategy/spec.md`
**Revision**: v2 — replaces static `targetedCardId` approach with dynamic target resolution at trigger time.

## Summary

Refactor the `targeted-card` targeting strategy so the target is resolved **dynamically at trigger time** instead of being hardcoded in the DTO. The first resolution mode is "target the killer of the ally" — when an `ally-death` event fires, the card that dealt the lethal blow becomes the lock-on target. This requires propagating the killer's identity through the death notification chain and constructing the `TargetedCard` strategy lazily inside `TargetingOverrideSkill.launch()`.

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
| I. Domain Isolation | PASS | All changes in `src/fight/core/`. Controller only passes a resolution mode string, no domain logic in HTTP layer. |
| II. Test-First Development | PASS | Unit tests for strategy, death-context propagation, E2E for full flow. TDD cycle. |
| III. Simplicity | PASS | Minimal changes: add one optional field to `FightingContext`, one optional param to `notifyDeath`, strategy factory in `TargetingOverrideSkill`. No new abstractions. |
| IV. Fail Fast | PASS | Throw if resolution mode is unknown. DTO validation rejects `targeted-card` outside TARGETING_OVERRIDE. |
| V. Clean Code | PASS | Follows existing patterns. No duplication. |

**Post-design re-check**: All gates still PASS.

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
│   ├── cards/
│   │   └── @types/
│   │       └── fighting-context.ts           # MODIFIED: add optional killerCard
│   ├── fight-simulator/
│   │   ├── card-death-subscriber.ts          # MODIFIED: add optional killerCard param
│   │   ├── death-skill-handler.ts            # MODIFIED: propagate killerCard into context
│   │   ├── action_stage.ts                   # MODIFIED: pass attacker as killerCard on death
│   │   └── turn-manager.ts                   # NO CHANGE (state-effect deaths have no killer)
│   ├── cards/skills/
│   │   └── targeting-override.ts             # MODIFIED: accept strategy factory, build lazily
│   └── targeting-card-strategies/
│       └── targeted-card.ts                  # NO CHANGE (already correct)
├── http-api/
│   ├── dto/
│   │   └── fight-data.dto.ts                 # MODIFIED: remove targetedCardId field
│   └── fight.controller.ts                   # MODIFIED: pass resolution mode, not instance
└── (no other files affected)

src/fight/core/__tests__/
└── targeted-card.spec.ts                     # MODIFIED: add killer-context tests

test/fight/
└── targeted-card-strategy.e2e-spec.ts        # MODIFIED: update E2E tests
```

**Structure Decision**: Follows existing single-project hexagonal layout. No new files created — only modifications to existing ones.

## Complexity Tracking

> No violations — no entries needed.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    |            |                                     |
