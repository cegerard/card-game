# Coding Guidelines

> Minimal on purpose: these rules are checked after EVERY code generation. A feature is complete only when all steps below are green.

## Steps

1. Check there is no duplication; reuse existing code
2. From `packages/combat-engine/`, run in order: `npm run format` → `npm run lint` (auto-fix) → `npm run test:cov` → `npm run build`
3. From the root, `pnpm verify` runs the whole chain, memory-bank size check included

## Style

Prettier, ESLint and TypeScript settings: STACK.md. Prettier indents by 2 spaces; explicit return types and `any` are allowed.

## Naming

- Files kebab-case: `*.module.ts`, `*.controller.ts`, `*.dto.ts`, `*-factory.ts`, tests `*.spec.ts` in `__tests__`, type directories `@types/`
- Variables and functions camelCase; classes, interfaces (no `I` prefix) and enums PascalCase with `UPPER_CASE` values; `UPPER_CASE` constants; private fields without underscore

## Architecture

- NestJS decorators, constructor injection (`@Inject()` for custom providers), DTOs with `class-validator` / `class-transformer`
- DTOs never leak into the domain: factories convert them
- Group by feature, not by type; tests next to the source
- Imports from `src/`: external modules first, then internal
- Classes: `readonly` for immutable properties; `get` keyword for getters (`get actualHealth()`), no `get`/`set` prefix on public methods (`isDead()`, `heal()`); private methods at the bottom; object destructuring for complex constructor configs

## Specials with optional effects

One optional constructor parameter per effect field, behaving as ARCHITECTURE says (Special result, Conditional buffs); unused effects return empty arrays (`{ actionResults: [], buffResults: [] }`); `buffApplication` is a `BuffApplication[]`.

## Comments

JSDoc for public interfaces and complex methods; inline comments only for tricky logic; none on self-explanatory code.

## Testing

Conventions in [TESTING.md](TESTING.md). Commands: `npm run test`, `test:watch`, `test:cov`, `test:e2e`, `npm run test -- path/to/test.spec.ts`
