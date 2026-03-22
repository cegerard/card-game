# Data Model: Event-Bound Buff Termination

**Branch**: `002-event-bound-buff` | **Phase**: 1

## Modified Entities

### `Buff` *(extended)*

**File**: `src/fight/core/cards/@types/buff/buff.ts`

```typescript
export type Buff = {
  type: BuffType;
  value: number;
  duration: number;           // Infinity = no turn-based expiry (event-only)
  terminationEvent?: string;  // NEW: named event that removes this buff
};
```

**Rules**:
- `duration === Infinity` + `terminationEvent` set → event-only buff (FR-008)
- `duration > 0` + `terminationEvent` set → dual condition; removed on first satisfied (FR-009)
- No `terminationEvent` → existing duration-only behavior, unchanged (SC-002)

---

### `SkillResults` *(extended)*

**File**: `src/fight/core/cards/skills/skill.ts`

```typescript
export type SkillResults = {
  skillKind: SkillKind;
  results: HealingResults | BuffResults | DebuffResults | AttackResult[];
  endEvent?: string;  // NEW: present when skill lifecycle is exhausted
};
```

**Rules**:
- `endEvent` is only set when `activationLimit` is reached on that turn's invocation
- Absent (`undefined`) for all invocations of skills with no activation limit (FR-011)

---

### `BuffSkill` *(extended)*

**File**: `src/fight/core/cards/skills/buff-skill.ts`

New constructor parameters (all optional):
- `activationLimit?: number` — max activations before lifecycle ends (FR-002)
- `endEvent?: string` — event name emitted when limit is reached (FR-003)

New private field:
- `activationCount: number = 0` — runtime counter, resets per battle (stateless)

Behaviour change in `launch()`:
- Increment `activationCount` on every successful trigger (after condition check)
- When `activationCount === activationLimit`, include `endEvent` in returned `SkillResults` (FR-004)
- Once `activationLimit` is reached, `isTriggered()` returns `false` for all subsequent calls → skill never fires again (FR-011 compatibility; US-2 AC-2)

---

### `FightingCard` *(extended)*

**File**: `src/fight/core/cards/fighting-card.ts`

Changed methods:
- **`applyBuff(type, rate, duration, terminationEvent?)`** — accepts optional `terminationEvent`; implements refresh semantics for event-bound buffs (FR-010)
- **`decreaseBuffAndDebuffDuration()`** — already correct for `Infinity` (no change needed)

New methods:
- **`removeEventBoundBuffs(eventName: string): { type: BuffType; value: number }[]`** — removes all buffs with `terminationEvent === eventName`, returns removed buff info for step logging (FR-005)
- **`lifecycleEndEvents(): string[]`** — returns `endEvent` values of lifecycle-limited skills not yet exhausted; used on card death (FR-007)

---

### `BuffApplication` *(extended)*

**File**: `src/fight/core/cards/@types/buff/buff-application.ts`

```typescript
export class BuffApplication {
  constructor(
    public readonly type: BuffType,
    public readonly rate: number,
    public readonly duration: number,
    public readonly targetingStrategy: TargetingCardStrategy,
    public readonly condition?: BuffCondition,
    public readonly conditionMultiplier?: number,
    public readonly terminationEvent?: string,  // NEW
  ) {}
}
```

`applyBuff()` passes `terminationEvent` to `target.applyBuff(...)`.

---

## New Entities

### `EndEventProcessor`

**File**: `src/fight/core/fight-simulator/end-event-processor.ts`

```typescript
export class EndEventProcessor {
  constructor(private player1: Player, private player2: Player) {}

  processEndEvent(eventName: string, source: CardInfo): Step[]
}
```

- Iterates all alive cards from `player1.playableCards` and `player2.playableCards`
- Calls `card.removeEventBoundBuffs(eventName)` on each
- If any buffs were removed from a card, produces a `StepKind.BuffRemoved` step
- Returns all steps

---

### `BuffRemovedReport`

**File**: `src/fight/core/fight-simulator/@types/buff-removed-report.ts`

```typescript
export type BuffRemovedReport = {
  kind: StepKind.BuffRemoved;
  source: CardInfo;
  eventName: string;
  removed: {
    target: CardInfo;
    kind: BuffType;
    value: number;
  }[];
};
```

---

### `StepKind.BuffRemoved` *(new enum value)*

**File**: `src/fight/core/fight-simulator/@types/step.ts`

```typescript
export enum StepKind {
  // existing...
  BuffRemoved = 'buff_removed',  // NEW
}
```

`Step` union type updated to include `BuffRemovedReport`.

---

## State Transitions

```
Buff lifecycle:
  ACTIVE (turn-based) → duration reaches 0 → REMOVED
  ACTIVE (event-bound) → terminationEvent fires → REMOVED
  ACTIVE (dual) → duration reaches 0 OR terminationEvent fires → REMOVED

Skill lifecycle:
  ACTIVE → activationCount < activationLimit → fires normally
  ACTIVE → activationCount === activationLimit → fires + emits endEvent → EXHAUSTED
  EXHAUSTED → isTriggered() always false → never fires again

Card death with lifecycle skill:
  CARD_ALIVE + skill ACTIVE → card dies → skill emits endEvent immediately → EXHAUSTED
```

---

## Validation Rules

- `activationLimit` must be `>= 1` if provided (DTO: `@IsNumber() @Min(1)`)
- `endEvent` must be non-empty string if provided (DTO: `@IsString() @IsNotEmpty()`)
- `terminationEvent` must be non-empty string if provided (DTO: `@IsString() @IsNotEmpty()`)
- `duration` in `OtherSkillDto` with event-bound buff: `0` means "no turn duration" (mapped to `Infinity` in domain)
