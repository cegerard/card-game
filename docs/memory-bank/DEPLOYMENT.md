# Deployment

## CI/CD

- **CI** (`.github/workflows/node.js.yml`, push and PR on `main`): memory-bank size check, install, `pnpm build:all`, `pnpm lint:all`, `pnpm test:all`, `pnpm test:e2e:engine`
- **Deploy** (`.github/workflows/heroku.yml`, push on `main`): `akhileshns/heroku-deploy` builds the root `Dockerfile`, pushes it to the Heroku Container Registry and releases it

## Container

Multi-stage `Dockerfile` at the repo root:

1. Build stage (`node:26-alpine`): install the combat-engine workspace dependencies, build TypeScript → `packages/combat-engine/dist`
2. Production stage (`node:26-alpine`): production dependencies and compiled `dist/` only, `EXPOSE 3000`, `node packages/combat-engine/dist/main`

## Configuration

- `PORT`: application port, default 3000
- GitHub secrets: `HEROKU_EMAIL`, `HEROKU_API_KEY`, `HEROKU_APP_NAME`
- No environment file in the repository; runtime variables are set in the Heroku dashboard
- Development URL: http://localhost:3000; production URL depends on the Heroku app name
