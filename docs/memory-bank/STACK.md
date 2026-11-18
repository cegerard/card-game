# Stack

Exact versions live in the `package.json` files; this file names the tools and the conventions.

## Mono-repo

- pnpm 12 workspace (`pnpm-workspace.yaml`), Node.js 26
- Packages: `packages/combat-engine`, `packages/shared-types`; clients: `clients/fight-replayer`, `clients/gasha`
- `shared-types` is a runtime dependency of the engine: `exports` sends Node `require` to `dist/` (`pnpm --filter @card-game/shared-types build`, run by `build:all`, `build:engine`, `dev:engine` and the Dockerfile), TypeScript and Vite to the source; the engine Jest configs map it to the source too
- Root scripts (`package.json`): `pnpm verify` (memory-bank size, check, build, lint, tests, engine e2e, gasha Playwright: Chromium installed once), `pnpm check:memory-bank`, `pnpm test:engine`, `pnpm dev:engine`, `pnpm dev:gasha`, `pnpm replayer`; per package: `pnpm --filter combat-engine <script>`

## Backend (`@packages/combat-engine/package.json`)

- NestJS 12 on Express (`@nestjs/platform-express`), TypeScript 6, `class-validator` / `class-transformer` for DTOs, `reflect-metadata`, `rxjs`
- TypeScript (`tsconfig.json`): target ES2021, CommonJS, decorators enabled, `strictNullChecks`, `noImplicitAny` and `strictBindCallApply` off
- Build: NestJS CLI (`src/` → `dist/`)

### Testing

- Jest 30 + `ts-jest`, `@nestjs/testing`, `supertest` (e2e), `@faker-js/faker` (import `@faker-js/faker/locale/en`: the full package loads every locale in each test file); configs `jest.config.js` and `test/jest-e2e.json`
- Tests run as CommonJS, transpiled only (`tsconfig.spec.json`): `pnpm check` type-checks `src/` and its specs, not the e2e specs. NestJS and Faker ship ESM only, loaded natively (Node >= 24.9, hence `--experimental-vm-modules` in the scripts)
- Unit `*.spec.ts` in `__tests__/`; e2e `*.e2e-spec.ts`; coverage excludes `*.module.ts`, `logger-middleware.ts`, `main.ts`

### Code quality

- ESLint (`eslint.config.js`, `@typescript-eslint/recommended` + prettier); unused vars must be prefixed `_`
- Prettier 3 (`.prettierrc`): single quotes, trailing commas

## Gasha Client (`@clients/gasha/package.json`)

- SvelteKit with `@sveltejs/adapter-static`, Svelte 5 runes (`$state`, `$derived`, `$props`), Vite
- Phaser (lazy-loaded, only with the Phaser renderer); renderer chosen by `?mode=phaser`, default `web`
- Vitest (`src/**/__tests__/*.spec.ts`) and Playwright (`tests/*.spec.ts`). Vitest runs two projects (`vite.config.ts`): `dom` (jsdom) for the component specs, named after their PascalCase component, and the localStorage one; `logic` (node) for every other spec
- Prefer `<a href>` over `goto()` for navigation

## Container

Root `Dockerfile`: multi-stage, `node:26-alpine`, production dependencies only in the final image, port 3000, installs the pnpm of `packageManager` itself, entry `node packages/combat-engine/dist/main`.
