# Data Model: Event-Bound Effect Termination

**Date**: 2026-04-03
**Feature**: 004-event-bound-effect-termination

## Modified Entities

### CardState (interface)

Existing interface gains one optional field:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | yes | Effect type identifier (poison, burn, freeze) |
| level | EffectLevel | yes | Severity (1-3) |
| remainingTurns | number | yes | Duration counter |
| **terminationEvent** | **string** | **no** | **Event name that removes this effect when fired** |

### AttackEffect (poison, burn, freeze)

Each concrete attack effect gains one optional constructor parameter:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| rate | number | yes | Application chance |
| level | EffectLevel | yes | Effect intensity |
| triggeredDebuff | EffectTriggeredDebuff | no | Optional debuff on hit |
| **terminationEvent** | **string** | **no** | **Passed through to CardState on application** |

### FightingCard

New method:

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| removeEventBoundEffects | eventName: string | `{ type: string, card: CardInfo }[]` | Removes effects matching the event, returns removed info |

## New Entities

### EffectRemovedReport

New fight log step type:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| kind | 'effect_removed' | yes | Step discriminator |
| source | CardInfo | yes | Card whose skill emitted the end event |
| eventName | string | yes | Event name that triggered removal |
| removed | `{ target: CardInfo, effectType: string }[]` | yes | List of removed effects per card |

## DTO Changes

### EffectDto

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | Effect enum | yes | POISON, BURN, FREEZE |
| rate | number | yes | Application chance |
| level | number | yes | Effect intensity |
| triggeredDebuff | EffectTriggeredDebuffDto | no | Optional debuff |
| **terminationEvent** | **string** | **no** | **Event name for effect termination** |
