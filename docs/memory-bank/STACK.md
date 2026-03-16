---
name: stack
description: Technology stack documentation
argument-hint: N/A
---

# Stack

## Backend

@package.json

### Runtime & Framework

- Node.js 24 (Alpine Linux in Docker)
- NestJS 11
- Express (via `@nestjs/platform-express`)

### Core Dependencies

- `class-validator` - DTO validation with decorators
- `class-transformer` - DTO transformation
- `reflect-metadata` - Decorator metadata reflection
- `rxjs` - Reactive extensions

## Testing

@package.json

### Framework & Tools

- Jest 29
- `ts-jest` - TypeScript preprocessor for Jest
- `@nestjs/testing` - NestJS testing utilities
- `supertest` - HTTP assertion library for e2e tests
- `@faker-js/faker` - Test data generation

### Configuration

- @package.json (jest config in package.json)
- @test/jest-e2e.json (e2e test config)
- Test files: `*.spec.ts` pattern
- E2E tests: `.e2e-spec.ts` pattern
- Coverage excludes: `*.module.ts`, `logger-middleware.ts`, `main.ts`

## TypeScript

@tsconfig.json

### Compiler Settings

- Target: ES2021
- Module: CommonJS
- Decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`)
- Strict mode partially disabled:
  - `strictNullChecks: false`
  - `noImplicitAny: false`
  - `strictBindCallApply: false`

## Code Quality

### Linting

- @.eslintrc.js
- ESLint 8 with TypeScript plugin
- Extends `@typescript-eslint/recommended` and `prettier/recommended`
- Custom rules: unused vars must use `_` prefix, explicit types optional

### Formatting

- @.prettierrc
- Prettier 3
- Single quotes, trailing commas

## Build & Development

@nest-cli.json

### Build Tool

- NestJS CLI (`@nestjs/cli`)
- Source root: `src/`
- Output: `dist/`
- Auto-cleanup on rebuild

### Module Loading

- `ts-node` - TypeScript execution
- `ts-loader` - Webpack TypeScript loader
- `tsconfig-paths` - Path mapping support

## Containerization

@Dockerfile

### Docker

- Multi-stage build
- Base image: `node:24-alpine`
- Production dependencies only in final image
- Exposes port 3000
- Entry point: `node dist/main`
