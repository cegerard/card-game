# Coding Guidelines

> Minimal on purpose: these rules are checked after EVERY code generation. A feature is complete only when all steps below are green.

## Steps

1. Check there is no duplication; reuse existing code
2. From `packages/combat-engine/`, run in order: `npm run format` → `npm run lint` (auto-fix) → `npm run test:cov` → `npm run build`
3. From the root, `pnpm verify` runs the whole chain, memory-bank size check included

## Style

- Prettier: single quotes, trailing commas, 2 spaces
- ESLint (`@typescript-eslint/recommended` + prettier): unused variables error unless prefixed `_`; explicit return types and `any` are allowed
- TypeScript: ES2021, CommonJS, decorators on, strict null checks and implicit any off

## Naming

- Files kebab-case: `*.module.ts`, `*.controller.ts`, `*.dto.ts`, `*-factory.ts`, tests `*.spec.ts` in `__tests__`, type directories `@types/`
- Variables and functions camelCase; classes, interfaces (no `I` prefix) and enums PascalCase with `UPPER_CASE` values; `UPPER_CASE` constants; private fields without underscore

## Architecture

- NestJS decorators, constructor injection (`@Inject()` for custom providers), DTOs with `class-validator` / `class-transformer`, global `ValidationPipe` with `transform: true`
- Domain in `src/fight/core/`, HTTP in `src/fight/http-api/`; DTOs never leak into the domain, factories convert them
- Group by feature, not by type; tests next to the source
- Imports from `src/`: external modules first, then internal
- Classes: `readonly` for immutable properties; `get` keyword for getters (`get actualHealth()`), no `get`/`set` prefix on public methods (`isDead()`, `heal()`); private methods at the bottom; object destructuring for complex constructor configs

## Specials with optional effects

- Optional constructor parameters per effect (type, rate, duration, targeting); if one is missing, skip the whole effect
- Apply effects after the primary action, with their own targeting strategy (e.g. hit enemies, buff allies)
- Return `{ actionResults: [], buffResults: [] }`, empty arrays for unused effects
- `buffApplication` is a `BuffApplication[]` (zero, one or many); its optional `condition` + `conditionMultiplier` multiply the rate when the condition holds at application time

## Comments

JSDoc for public interfaces and complex methods; inline comments only for tricky logic; none on self-explanatory code.

## Testing

- Jest, `describe` per unit, `beforeEach` for setup, helpers in `test/helpers/`
- One expectation and at most 10 lines per `it`
- Coverage excludes `*.module.ts`, `logger-middleware.ts`, `main.ts`
- Commands: `npm run test`, `test:watch`, `test:cov`, `test:e2e`, `npm run test -- path/to/test.spec.ts`
