# Deployment

## CI/CD

- **CI** (`.github/workflows/node.js.yml`, push and PR on `main`): job `build` runs memory-bank size check, install, `pnpm build:all`, `pnpm lint:all`, `pnpm test:all`, `pnpm test:e2e:engine`; job `gasha-e2e` installs Chromium and runs `pnpm test:e2e:gasha`
- **Deploy** (`.github/workflows/heroku.yml`, push on `main`): `akhileshns/heroku-deploy` builds the root `Dockerfile`, pushes it to the Heroku Container Registry and releases it

## Container

Multi-stage `Dockerfile` at the repo root:

1. Build stage (`node:26-alpine`): install the combat-engine workspace dependencies, build TypeScript → `packages/combat-engine/dist`
2. Production stage (`node:26-alpine`): production dependencies and compiled `dist/` only, `EXPOSE 3000`, `node packages/combat-engine/dist/main`

## Configuration

- `PORT`: application port, default 3000
- GitHub secrets: `HEROKU_EMAIL`, `HEROKU_API_KEY`, `HEROKU_APP_NAME`
- Runtime variables are set in the Heroku dashboard; the only environment file in the repository is `clients/gasha/.env.test`, a placeholder Vite loads for Vitest alone (mode `test`)
- `PUBLIC_COMBAT_ENGINE_URL`: inlined in the gasha bundle, so the build fails without it (`pnpm verify` and CI: http://localhost:3000); the unit tests read `.env.test`, Playwright defaults it
- Production engine URL: set by the Heroku app name
