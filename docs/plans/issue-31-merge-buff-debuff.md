# Plan: Merge Buff and Debuff into AlterationSkill (Issue #31)

## Problem

`BuffSkill` and `DebuffSkill` are two separate classes that apply positive or negative
stat modifications (attack, defense, agility, accuracy). They share the same concept —
altering a card's attribute — but differ only in sign and feature completeness:

| Feature              | BuffSkill | DebuffSkill |
|----------------------|-----------|-------------|
| Positive alteration  | ✅        | ❌          |
| Negative alteration  | ❌        | ✅          |
| activationCondition  | ✅        | ❌          |
| activationLimit      | ✅        | ❌          |
| endEvent             | ✅        | ❌          |
| terminationEvent     | ✅        | ❌          |

## Solution

Introduce a single `AlterationSkill` class that:
- Accepts a `polarity: 'buff' | 'debuff'` parameter to determine sign
- Carries all `BuffSkill` features (lifecycle management, conditions, terminationEvent)
- Returns `SkillKind.Buff` for positive, `SkillKind.Debuff` for negative — preserving the
  existing step reporting contract

## Changes

### 1. New file — `src/fight/core/cards/skills/alteration-skill.ts`

A unified skill merging both old classes. Constructor signature:

```
AlterationSkill(
  polarity: 'buff' | 'debuff',
  attributeType: BuffType,
  rate: number,
  duration: number,
  trigger: Trigger,
  targetingStrategy: TargetingCardStrategy,
  activationCondition?: BuffCondition,
  activationLimit?: number,
  endEvent?: string,
  terminationEvent?: string,
)
```

### 2. `src/fight/http-api/dto/fight-data.dto.ts`

Add `DEBUFF = 'DEBUFF'` to the `SkillKind` enum so debuffs can be created via the API.

### 3. `src/fight/http-api/fight.controller.ts`

- Replace `BuffSkill` import with `AlterationSkill`
- Handle `SkillKind.BUFF` → `AlterationSkill` with `polarity='buff'`
- Handle `SkillKind.DEBUFF` → `AlterationSkill` with `polarity='debuff'`
  (debuffs are simpler: no conditions/lifecycle, just type + rate + duration)

### 4. `test/helpers/fighting-card.ts`

Replace `BuffSkill` + `DebuffSkill` imports and usage with `AlterationSkill`.

### 5. Unit tests — update imports and instantiation

Files to update:
- `src/fight/core/cards/skills/__tests__/buff-skill.spec.ts` → rename to `alteration-skill.spec.ts`
- `src/fight/core/cards/skills/__tests__/conditional-buff-skill.spec.ts`
- `src/fight/core/fight-simulator/__tests__/death-skill-handler.spec.ts`
- `src/fight/core/cards/__tests__/fighting-card.spec.ts`

### 6. Delete old files

- `src/fight/core/cards/skills/buff-skill.ts`
- `src/fight/core/cards/skills/debuff-skill.ts`

## What does NOT change

- `SkillKind.Buff` / `SkillKind.Debuff` in `skill.ts` (result kinds, used for step reporting)
- `Buff` / `Debuff` types and `applyBuff()` / `applyDebuff()` on `FightingCard`
- All existing tests' assertions — only imports/constructors change
- `BuffResults` / `DebuffResults` types
