# Quickstart: Dynamic Skill Trigger

## What This Feature Does

Adds support for skills that start **dormant** (inactive) and become active mid-battle when a specific event occurs. The classic use case: a healing skill that does nothing until an ally dies, then starts triggering whenever a specific enemy dies.

## Key Concepts

1. **Dormant Trigger**: A skill configured with `event: "dormant"` has no active trigger. It never fires.
2. **Activation Event**: When the specified event occurs (e.g., ally "warrior-01" dies), the skill's trigger changes.
3. **Replacement Trigger**: After activation, the skill triggers on the replacement event (e.g., enemy "goblin-03" dies).
4. **Enemy Death**: New event type — fires on the opponent's team when a card dies.

## Implementation Overview

### New Files
- `src/fight/core/trigger/dynamic-trigger.ts` — Dormant-to-active trigger wrapper
- `src/fight/core/trigger/enemy-death.ts` — Enemy death trigger (mirrors AllyDeath)

### Modified Files
- `src/fight/http-api/dto/fight-data.dto.ts` — New enum values + DTO fields
- `src/fight/http-api/trigger-factory.ts` — Build DynamicTrigger and EnemyDeath
- `src/fight/core/fight-simulator/death-skill-handler.ts` — Fire enemy-death on opponent team

### Architecture

```
DynamicTrigger (implements Trigger)
├── activationTrigger: AllyDeath("warrior-01")  ← watches for this
└── replacementTrigger: EnemyDeath("goblin-03") ← delegates after activation

DeathSkillHandler.notifyDeath(deadCard)
├── ally-death:<id> → owner's surviving cards    (existing)
└── enemy-death:<id> → opponent's surviving cards (new)
```

## How to Test

```bash
# Run all tests
npm test

# Run specific test file
npm run test -- src/fight/core/__tests__/dynamic-trigger.spec.ts

# Run e2e tests
npm run test:e2e
```

## Quality Gates

```bash
npm run format && npm run lint && npm run test:cov && npm run build
```
