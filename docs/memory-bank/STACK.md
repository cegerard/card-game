# Stack

Exact versions live in the `package.json` files; this file names the tools and the conventions.

## Mono-repo

- pnpm 12 workspace (`pnpm-workspace.yaml`), Node.js 26
- Packages: `packages/combat-engine`, `packages/shared-types`; clients: `clients/fight-replayer`, `clients/gasha`
- Root scripts (`package.json`): `pnpm verify` (memory-bank size, check, build, lint, tests, engine e2e), `pnpm check:memory-bank`, `pnpm test:engine`, `pnpm dev:engine`, `pnpm dev:gasha`, `pnpm replayer`; per package: `pnpm --filter combat-engine <script>`

## Backend (`@packages/combat-engine/package.json`)

- NestJS 12 on Express (`@nestjs/platform-express`), TypeScript 6, `class-validator` / `class-transformer` for DTOs, `reflect-metadata`, `rxjs`
- TypeScript (`tsconfig.json`): target ES2021, CommonJS, decorators enabled, `strictNullChecks`, `noImplicitAny` and `strictBindCallApply` off
- Build: NestJS CLI (`src/` → `dist/`)

### Testing

- Jest 30 + `ts-jest`, `@nestjs/testing`, `supertest` (e2e), `@faker-js/faker`; jest config in `package.json`, e2e config `test/jest-e2e.json`
- Unit `*.spec.ts` in `__tests__/`; e2e `*.e2e-spec.ts`; coverage excludes `*.module.ts`, `logger-middleware.ts`, `main.ts`

### Code quality

- ESLint (`eslint.config.js`, `@typescript-eslint/recommended` + prettier); unused vars must be prefixed `_`
- Prettier 3 (`.prettierrc`): single quotes, trailing commas

## Gasha Client (`@clients/gasha/package.json`)

- SvelteKit with `@sveltejs/adapter-static`, Svelte 5 runes (`$state`, `$derived`, `$props`), Vite
- Phaser (lazy-loaded, only with the Phaser renderer); renderer chosen by `?mode=phaser`, default `web`
- Vitest (`src/**/__tests__/*.spec.ts`) and Playwright (`tests/*.spec.ts`)
- Prefer `<a href>` over `goto()` for navigation

## Container

Root `Dockerfile`: multi-stage, `node:26-alpine`, production dependencies only in the final image, port 3000, installs pnpm 11 itself, entry `node packages/combat-engine/dist/main`.
