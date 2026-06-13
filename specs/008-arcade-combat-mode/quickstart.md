# Quickstart: Arcade Combat Mode (008)

## Prerequisites

- Node.js 26
- pnpm 11
- Combat engine running on `http://localhost:3000`

## Start the Combat Engine

```bash
# From repo root
pnpm dev:engine
```

## Initialize the Gasha Client

```bash
# From repo root — run once after checkout
pnpm --filter gasha install
```

## Start the Gasha Client (dev mode)

```bash
# From repo root
pnpm dev:gasha
# OR
cd clients/gasha && pnpm dev
```

Client runs at `http://localhost:5173` (Vite default).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PUBLIC_COMBAT_ENGINE_URL` | `http://localhost:3000` | URL of the combat engine API |

For local dev with both services on localhost, no configuration is needed.

Create a `.env` file in `clients/gasha/` to override:

```env
PUBLIC_COMBAT_ENGINE_URL=http://localhost:3000
```

## Build for Production

```bash
# From repo root
pnpm build:gasha
# Output: clients/gasha/build/
```

Static files in `build/` can be served by any HTTP server or CDN.

## Run the Full Stack

```bash
# Terminal 1: combat engine
pnpm dev:engine

# Terminal 2: Gasha client
pnpm dev:gasha
```

Open `http://localhost:5173` → click **Arcade Mode** → play.

## Key Files

| File | Purpose |
|------|---------|
| `clients/gasha/src/routes/+page.svelte` | Main menu |
| `clients/gasha/src/routes/arcade/+page.svelte` | Arcade game page |
| `clients/gasha/src/lib/arcade/levels.ts` | Enemy level configurations |
| `clients/gasha/src/lib/arcade/player-team.ts` | Player team definition |
| `clients/gasha/src/lib/arcade/session.ts` | Arcade session store |
| `clients/gasha/src/lib/combat/engine-client.ts` | Combat engine API client |
| `clients/gasha/src/lib/combat/CombatScene.ts` | Phaser 3 game scene |
