---
name: coding-assertions
description: Code quality verification checklist
argument-hint: N/A
---

# Coding Guidelines

> Those rules must be minimal because the MUST be checked after EVERY CODE GENERATION.

## Requirements to complete a feature

**A feature is really completed if ALL of the above are satisfied: if not, iterate to fix all until all are green.**

## Steps to follow

1. Check their is no duplication
2. Ensure code is re-used
3. Run all those commands, in order to ensure code is perfect:

```markdown
| Order | Command            | Description                          |
| ----- | ------------------ | ------------------------------------ |
| 1     | `npm run format`   | Format code with Prettier            |
| 2     | `npm run lint`     | Run ESLint with auto-fix             |
| 3     | `npm run test:cov` | Run tests with coverage verification |
| 4     | `npm run build`    | Build the NestJS application         |
```

## TypeScript Configuration

- Target: `ES2021`
- Module: `commonjs`
- Decorators: `experimentalDecorators` and `emitDecoratorMetadata` enabled
- Strict mode disabled: `strictNullChecks: false`, `noImplicitAny: false`
- Declaration files generated on build

## Code Style

### Formatting (Prettier)

- Use single quotes for strings
- Add trailing commas in multi-line structures
- Default indentation: 2 spaces

### Linting (ESLint)

- Based on `@typescript-eslint/recommended`
- Integrated with Prettier via `plugin:prettier/recommended`
- Unused variables: Error, except when prefixed with `_`
- No explicit return types required (`explicit-function-return-type: off`)
- No explicit module boundary types (`explicit-module-boundary-types: off`)
- Allow `any` type (`no-explicit-any: off`)

## Naming Conventions

### Files and Directories

- Source files: `kebab-case.ts` (e.g., `fighting-card.ts`, `simple-attack.ts`)
- Test files: `*.spec.ts` in `__tests__`
- Module files: `*.module.ts` (e.g., `app.module.ts`, `fight.module.ts`)
- Controller files: `*.controller.ts` (e.g., `fight.controller.ts`)
- DTO files: `*.dto.ts` (e.g., `fight-data.dto.ts`)
- Factory files: `*-factory.ts` (e.g., `targeting-strategy-factory.ts`)
- Type directories: Use `@types/` for type definitions

### Code Identifiers

- Variables and functions: `camelCase`
- Classes: `PascalCase` (e.g., `FightingCard`, `SimpleAttack`)
- Interfaces: `PascalCase`, no `I` prefix
- Enums: `PascalCase` with `UPPER_CASE` values
- Constants: `UPPER_CASE` for true constants, `camelCase` for config objects
- Private fields: `camelCase` without underscore prefix

## Architecture Patterns

### NestJS Structure

- Use decorators: `@Controller()`, `@Injectable()`, `@Module()`, etc.
- Dependency injection via constructor with `@Inject()` for custom providers
- DTOs with `class-validator` and `class-transformer` decorators
- Global `ValidationPipe` with `transform: true`

### Domain Organization

- Core domain logic in `src/fight/core/`
- HTTP API layer in `src/fight/http-api/`
- Domain entities separate from DTOs
- Factory functions to convert DTOs to domain objects

### File Organization

- Group related files in feature directories
- Tests alongside source in `__tests__` directories
- Type definitions in `@types/` subdirectories
- Group by feature, not by type (controllers, services, etc.)

## Testing Standards

### Test Structure

- Test files: `*.spec.ts` using Jest
- Test location: `__tests__` directories
- Test regex: `.*\.spec\.ts$`
- Use `describe` blocks for test organization
- Use `beforeEach` for test setup
- Helper functions in `test/helpers/` directory

### Coverage Requirements

- Exclude: `*.module.ts`, `logger-middleware.ts`, `main.ts`
- Coverage directory: `../coverage`
- Test environment: `node`

### Test Commands

- `npm run test` - Run all tests
- `npm run test:watch` - Watch mode
- `npm run test:cov` - With coverage
- `npm run test:e2e` - End-to-end tests
- `npm run test -- path/to/test.spec.ts` - Single test file

## Import Conventions

- Use absolute imports from `src/`
- Order: External modules, then internal modules
- NestJS decorators from `@nestjs/common`, `@nestjs/core`, etc.
- Validators from `class-validator`, transformers from `class-transformer`

## Class Design

- Use `readonly` for immutable properties
- Getter methods with `get` keyword (e.g., `get actualHealth()`)
- Public API methods without `get`/`set` prefix (e.g., `isDead()`, `heal()`)
- Constructor parameters use object destructuring for complex configs
- Private methods at bottom of class

## Comments and Documentation

- Use JSDoc comments for public interfaces and complex methods
- Inline comments for complex logic explanations
- No redundant comments for self-explanatory code
- Document parameters with `@param`, returns with `@returns`
