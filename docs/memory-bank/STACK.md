---
name: stack
description: Technology stack documentation
argument-hint: N/A
---

# Stack

## Mono-repo

- Package manager: pnpm 11
- Workspace config: `pnpm-workspace.yaml`
- Packages: `packages/combat-engine`, `packages/shared-types`
- Clients: `clients/fight-replayer`, `clients/gasha`
- Root scripts: `pnpm --filter combat-engine <script>`

## Backend

@packages/combat-engine/package.json

### Runtime & Framework

- Node.js 26 (Alpine Linux in Docker)
- NestJS 11
- Express (via `@nestjs/platform-express`)

### Core Dependencies

- `class-validator` - DTO validation with decorators
- `class-transformer` - DTO transformation
- `reflect-metadata` - Decorator metadata reflection
- `rxjs` - Reactive extensions

## Testing

@packages/combat-engine/package.json

### Framework & Tools

- Jest 29
- `ts-jest` - TypeScript preprocessor for Jest
- `@nestjs/testing` - NestJS testing utilities
- `supertest` - HTTP assertion library for e2e tests
- `@faker-js/faker` - Test data generation

### Configuration

- @packages/combat-engine/package.json (jest config in package.json)
- @test/jest-e2e.json (e2e test config)
- Test files: `*.spec.ts` pattern
- E2E tests: `.e2e-spec.ts` pattern
- Coverage excludes: `*.module.ts`, `logger-middleware.ts`, `main.ts`

## TypeScript

@packages/combat-engine/tsconfig.json

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

- @packages/combat-engine/eslint.config.js
- ESLint with TypeScript plugin
- Extends `@typescript-eslint/recommended` and `prettier/recommended`
- Custom rules: unused vars must use `_` prefix, explicit types optional

### Formatting

- @.prettierrc
- Prettier 3
- Single quotes, trailing commas

## Build & Development

@packages/combat-engine/nest-cli.json

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

@packages/combat-engine/Dockerfile

### Docker

- Multi-stage build
- Base image: `node:24-alpine`
- Production dependencies only in final image
- Exposes port 3000
- Entry point: `node dist/main`
