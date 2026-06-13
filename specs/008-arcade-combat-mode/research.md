# Research: Arcade Combat Mode (008)

## Decision Log

### D-001: SvelteKit Adapter

**Decision**: `adapter-static`  
**Rationale**: All game state is client-side (Svelte stores). No SSR, no server-side data fetching. The Gasha arcade client is a static HTML shell — the same model as `clients/fight-replayer`. Static export is simpler to deploy and matches the existing client pattern in the monorepo.  
**Alternatives considered**: `adapter-node` (recommended by research for SSR/API routes — not needed here); `adapter-auto` (less predictable, not recommended for production).

---

### D-002: Phaser 3 Integration in SvelteKit

**Decision**: Initialize Phaser in `onMount`, destroy in `onDestroy` within the arcade `+page.svelte`  
**Rationale**: Phaser works via direct DOM manipulation. SvelteKit's `onMount` lifecycle hook provides the correct timing to attach the Phaser canvas to a container `<div>`. No special glue library needed.  
**Alternatives considered**: Separate iframe for Phaser (unnecessary indirection); web component wrapper (over-engineering for this scope).

---

### D-003: API Communication Pattern

**Decision**: Client-side `fetch()` from Svelte components/stores, calling `POST /fight` on the combat engine  
**Rationale**: The fight-replayer does NOT call the API directly (it accepts pasted JSON). Gasha will be the first actual HTTP client. Standard `fetch()` from `onMount` or action handlers is sufficient. No special HTTP library needed.  
**URL strategy**: `PUBLIC_COMBAT_ENGINE_URL` environment variable (SvelteKit `$env/static/public` for client-side access). Defaults to `http://localhost:3000` for local dev.  
**Alternatives considered**: SvelteKit API proxy route (additional complexity, no benefit for a CORS-solved setup).

---

### D-004: CORS on Combat Engine

**Decision**: Add `app.enableCors()` to `packages/combat-engine/src/main.ts`  
**Rationale**: The Gasha SPA runs on a different origin than the NestJS API (different port/domain in dev, potentially different domain in prod). Without CORS, browser will block all `fetch` calls.  
**Scope**: This is a one-line infrastructure change to `main.ts`, not domain logic. It is explicitly excluded from coverage.  
**Alternatives considered**: SvelteKit proxy (more complexity, hides the real API).

---

### D-005: Arcade State Management

**Decision**: Svelte writable store (`session.ts`) holding `ArcadeSession`  
**Rationale**: SvelteKit's built-in store system is sufficient for the in-memory session. No external state library needed. Store resets on page navigation away from `/arcade`, fulfilling FR-007 (no persistence).  
**Alternatives considered**: URL state (not needed, arcade state is transient); localStorage (explicitly forbidden by FR-007).

---

### D-006: Enemy Difficulty Scaling

**Decision**: Hand-crafted static level configs in `levels.ts` with progressively increasing base stats  
**Rationale**: FR-009 requires "higher stats"; FR-013 requires ≥5 levels. Static configs are the simplest implementation that satisfies both requirements without introducing generative algorithms or a CMS.  
**Scaling approach**: Each level multiplies enemy card stats (attack, defense, health) by a level-specific scalar. Skills remain simple at lower levels and gain complexity at higher levels.  
**Alternatives considered**: Procedural generation (over-engineering for v1); database-driven levels (no DB in this project).

---

### D-007: Versions

**Decision**: SvelteKit 2.x (latest stable), Phaser 3.60+, Vite 5.x  
**Rationale**: Stable and compatible with Node.js 26 and ES2021+ target. Matches the project's existing TypeScript setup.

---

## Resolved Clarifications

| Unknown | Resolution |
|---------|------------|
| SvelteKit adapter type | `adapter-static` (D-001) |
| Phaser integration method | `onMount` / `onDestroy` lifecycle (D-002) |
| Combat engine HTTP client | `fetch()` + env var URL (D-003) |
| CORS handling | `app.enableCors()` in combat engine `main.ts` (D-004) |
| Session state mechanism | Svelte writable store, reset on route exit (D-005) |
| Enemy difficulty scaling | Static level configs, stat scalars (D-006) |
