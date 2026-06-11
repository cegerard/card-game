# Contract: Combat Engine API (Gasha Client → Combat Engine)

**Endpoint**: `POST /fight`  
**Base URL**: `PUBLIC_COMBAT_ENGINE_URL` env var (default: `http://localhost:3000`)  
**Consumer**: `clients/gasha` (Gasha arcade client)  
**Provider**: `packages/combat-engine` (NestJS fight simulator)  
**Direction**: Gasha calls the combat engine; combat engine is unchanged.

---

## Request

```typescript
POST /fight
Content-Type: application/json

{
  "player1": {
    "name": string,           // Player's display name
    "deck": CardConfig[]      // 1–5 player cards (predefined team)
  },
  "player2": {
    "name": string,           // Enemy team name (e.g., "Level 3 — Brutes")
    "deck": CardConfig[]      // 1–5 enemy cards from levels.ts
  },
  "cardSelectorStrategy": "player-by-player" | "speed-weighted"
}
```

See `docs/memory-bank/backend/API_DOCS.md` for complete `CardConfig` (→ `FightingCardDto`) schema.

**Fixed values for Gasha**:
- `player1.name`: always `"Player"` (v1, no auth)
- `cardSelectorStrategy`: always `"speed-weighted"` (more dynamic combat feel)
- `player1.deck`: always `PLAYER_TEAM` from `src/lib/arcade/player-team.ts`
- `player2.deck`: the enemy team for the current `ArcadeLevel`

---

## Response

```typescript
// HTTP 200 OK
{
  [stepIndex: number]: Step
}
```

The fight result is an indexed map of `Step` objects. Gasha uses the following step kinds:

| Step kind | Gasha usage |
|-----------|-------------|
| `attack` / `special_attack` | Animate attack action |
| `healing` | Animate healing |
| `status_change` with `status: "dead"` | Trigger card death animation |
| `fight_end` | Determine victory/defeat outcome |

All other step kinds (buff, debuff, state_effect, etc.) are replayed sequentially but may be displayed as a simple text log in v1.

**Victory detection** (`fight_end` step):
```typescript
if (step.kind === 'fight_end') {
  const playerWon = step.winner === 'Player'; // matches player1.name
  const draw = step.winner === undefined || step.winner === null;
  // playerWon → victory; draw || !playerWon → game-over (FR-014)
}
```

---

## Error Handling

| HTTP status | Cause | Gasha behavior |
|-------------|-------|---------------|
| `400 Bad Request` | Invalid DTO (validation error) | Log error; show error notification; return to menu (edge case spec) |
| `500 Internal Server Error` | Runtime error in combat engine | Show error notification; return to menu |
| Network failure | Engine unreachable | Show error notification; return to menu |

No silent failures (Constitution Principle IV).

---

## CORS Dependency

The combat engine must have CORS enabled for browser requests from the Gasha origin. Required change: `app.enableCors()` in `packages/combat-engine/src/main.ts`.

This is the only change required in the combat engine for this feature.
