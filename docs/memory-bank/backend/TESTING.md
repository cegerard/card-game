---
name: testing
description: Testing strategy and guidelines
argument-hint: N/A
---

# Testing Guidelines

This document outlines the testing strategies and guidelines for the card game backend.

## Test Coverage

- Coverage directory: `../coverage`
- Coverage exclusions:
  - `**/*.module.ts` (NestJS module files)
  - `logger-middleware.ts`
  - `main.ts`
- All source files in `src/` are included by default

## Tools and Frameworks

- Jest 29
- ts-jest (TypeScript transformer)
- @nestjs/testing (NestJS testing utilities)
- supertest (HTTP assertions for e2e tests)
- @faker-js/faker (test data generation)

## Testing Strategy

### Unit Tests

- Location: `src/**/__tests__/*.spec.ts`
- Test individual components, skills, strategies, and mechanics
- Use factory helpers from `test/helpers/` for test data
- Coverage areas:
  - Card behaviors (dodge strategies)
  - Skills (simple attack, special attack, healing, buff/debuff)
  - Targeting strategies (position-based, all, line-three, self, allies)
  - Card selectors (player-by-player, speed-weighted)
  - Status effects (poison, burn, freeze)
  - Fight simulations (1v1, 2v2, 5v5)
  - Buff/debuff system
  - Turn-end effects
  - Elemental matrix multipliers (type effectiveness lookups)
  - Damage calculator (multi-type compositions, default physical fallback)
  - Card element property

### End-to-End Tests

- Location: `test/**/*.e2e-spec.ts`
- Configuration: `@test/jest-e2e.json`
- Test full fight simulation via HTTP API
- Validates complete flow from DTO to fight result
- Tests integration of all components

### Integration Tests

- HTTP Controller tests in `src/fight/http-api/__test__/fight.controller.spec.ts`
- Validates DTO mapping to domain objects
- Tests factory functions (targeting, dodge, trigger strategies)
- Uses stub implementations for isolated controller testing

## Test Execution Process

### Commands

- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage report
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:debug` - Run tests in debug mode
- `npm run test -- path/to/test.spec.ts` - Run specific test file

### Configuration

Unit tests:

- Root directory: `src`
- Test pattern: `.*\.spec\.ts$`
- Transform: ts-jest for TypeScript files
- Environment: node

E2E tests:

- Root directory: `test`
- Test pattern: `.e2e-spec.ts$`
- Transform: ts-jest for TypeScript files
- Environment: node

## Mocking and Stubbing

### Test Helpers

- `createFightingCard()` in `@test/helpers/fighting-card.ts`

  - Factory function with faker.js defaults
  - Configurable params for all card attributes, including `id`
  - Automatically creates skills and behaviors
  - Supports status effects configuration
  - `others` skills support `targetCardId` for `ally-death` trigger; omitting it throws an error (fail-fast)

- `createEffect()` in `@test/helpers/effect.ts`
  - Factory for poison, burn, freeze effects

### Stub Implementations

- `FightSimulatorStub` in `src/fight/http-api/__test__/fight-simulator-stub.ts`
  - Implements `FightSimulator` interface
  - Used for isolated controller testing
  - Provides validation methods for testing DTO transformations

### Testing Patterns

- Use `beforeEach()` for test setup and isolation
- Use `beforeAll()` for expensive one-time setup
- Test both success and edge cases
- Verify exact fight step sequences using `toEqual()`
- Test status effect interactions (e.g., poison + burn, freeze blocking effects)
- Test buff/debuff duration and stacking behavior
- For `ally-death` triggers: assert the **immediate next step** after the death step fires the skill (use `stepEntries[deathStepIndex + 1]`), not a search through all following steps — this verifies ordering, not just presence
- Canonical `ally-death` test pattern: surviving card has a **self-targeting healing** skill; enemy kills the target ally; assert next step is a healing from the survivor
- Only one expectation by `it`
- max 10 lines per `it` block.
