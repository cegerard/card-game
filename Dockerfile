FROM node:26-alpine AS base
RUN npm install -g pnpm@11

# --- deps stage ---
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/combat-engine/package.json ./packages/combat-engine/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN pnpm install --frozen-lockfile --filter combat-engine...

# --- build stage ---
FROM deps AS build
COPY packages/combat-engine ./packages/combat-engine
COPY packages/shared-types ./packages/shared-types
RUN pnpm --filter combat-engine build

# --- prod stage ---
FROM node:26-alpine AS prod
RUN npm install -g pnpm@11
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/combat-engine/package.json ./packages/combat-engine/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN pnpm install --frozen-lockfile --filter combat-engine... --prod
COPY --from=build /app/packages/combat-engine/dist ./packages/combat-engine/dist
EXPOSE 3000
CMD ["node", "packages/combat-engine/dist/main"]