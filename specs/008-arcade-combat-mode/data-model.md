# Data Model: Arcade Combat Mode (008)

All state is in-memory. No database. No persistence between sessions (FR-007).

---

## ArcadeSession (Svelte Store)

Runtime state for the active arcade session. Lives in `src/lib/arcade/session.ts`. Resets to `null` or initial state when the player navigates to the main menu.

```typescript
type ArcadePhase =
  | 'idle'          // no active session (main menu)
  | 'combat'        // fight in progress
  | 'victory'       // player won current level
  | 'game-over'     // player lost
  | 'final-victory' // player won the last level

interface ArcadeSession {
  currentLevel: number;   // 1-based index; starts at 1 (FR-008)
  phase: ArcadePhase;
  fightResult: FightResult | null;  // result of last completed fight
}
```

**State transitions**:
```
idle → combat         (player starts arcade session)
combat → victory      (player team wins; FR-003)
combat → game-over    (player team loses OR draw; FR-005, FR-014)
victory → combat      (player advances to next level; currentLevel++)
victory → final-victory (player wins the last level; FR-011)
final-victory → idle  (return to menu)
game-over → idle      (return to menu; no state retained; FR-006)
```

---

## Level (Static Config)

Defined statically in `src/lib/arcade/levels.ts`. At least 5 entries required (FR-013).

```typescript
interface ArcadeLevel {
  index: number;           // 1-based
  name: string;            // display name, e.g. "Level 1 — Rookies"
  enemyTeam: CardConfig[]; // 1–5 enemy cards (FR-009)
}
```

**Scaling rule** (FR-009, SC-003): Each level increases enemy stats via a multiplier tier. Base stats defined for level 1; subsequent levels apply multiplicative increases to attack, defense, and health. Skills gain complexity from level 3 onward.

| Level | Stat multiplier | Enemy cards | Skill complexity |
|-------|----------------|-------------|-----------------|
| 1     | ×1.0           | 1–2         | Basic (simple attack + weak special) |
| 2     | ×1.3           | 2–3         | Basic + status effect |
| 3     | ×1.6           | 3           | Buff/debuff + moderate special |
| 4     | ×2.0           | 3–4         | Multiple skills, chain effects |
| 5     | ×2.5           | 4–5         | Full deck, strong specials |

---

## CardConfig (Static Type)

Matches the shape of `FightingCardDto` used by the combat engine API. Defined as a TypeScript interface in `src/lib/arcade/levels.ts` (or a shared `types.ts`). Not a class — plain data object.

```typescript
interface CardConfig {
  id: string;
  name: string;
  attack: number;
  defense: number;
  health: number;
  speed: number;
  agility: number;
  accuracy: number;
  criticalChance: number;
  element?: string;
  skills: {
    special: SpecialConfig;
    simpleAttack: SimpleAttackConfig;
    others: OtherSkillConfig[];
  };
  behaviors: {
    dodge: 'simple-dodge' | 'random-dodge';
  };
}
```

Nested skill config types mirror the DTO structures in `API_DOCS.md`. No duplication of combat logic — these are pure data objects passed directly to the API.

---

## PlayerTeam (Static Config)

Defined in `src/lib/arcade/player-team.ts`. A single fixed array of `CardConfig` used for all arcade combats (FR-012). Hand-crafted for v1.

```typescript
const PLAYER_TEAM: CardConfig[] = [ /* 3–5 balanced cards */ ];
```

---

## FightResult (External Type)

Returned by the combat engine API. Typed in `src/lib/combat/engine-client.ts` as an import from `@card-game/shared-types` (if types are exported there) or inlined as a minimal interface covering the fields the client actually uses.

```typescript
// Minimal client-side type (only what Gasha needs)
interface FightResult {
  [step: number]: Step;
}

type Step =
  | { kind: 'attack'; /* ... */ }
  | { kind: 'fight_end'; winner: string }
  | /* other step kinds as needed */;
```

Winner determination: the `fight_end` step contains the winner name. If winner matches player name → victory; if winner matches enemy name → game over; if no winner → draw → game over (FR-014).
