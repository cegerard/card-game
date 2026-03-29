# Data Model: Composite Power

**Feature**: 003-composite-power | **Date**: 2026-03-29

## Modified Entities

### Buff (existing)

| Field | Type | Change | Description |
|-------|------|--------|-------------|
| type | BuffType | unchanged | attack, defense, agility, accuracy |
| value | number | unchanged | Buff strength multiplier |
| duration | number | unchanged | Remaining turns (Infinity for event-bound) |
| terminationEvent | string? | unchanged | Event that removes this buff |
| **powerId** | **string?** | **added** | Composite power group identifier |

### SkillResults (existing)

| Field | Type | Change | Description |
|-------|------|--------|-------------|
| skillKind | SkillKind | unchanged | healing, buff, debuff, attack |
| results | HealingResults \| BuffResults \| DebuffResults \| AttackResult[] | unchanged | Skill output |
| endEvent | string? | unchanged | Event to fire for lifecycle cleanup |
| **powerId** | **string?** | **added** | Composite power group identifier |

### Skill interface (existing)

No change to the interface itself. Implementations (`AlterationSkill`, `Healing`) accept optional `powerId` in constructor and propagate it through `SkillResults`.

### FightingCard (existing)

| Field | Type | Change | Description |
|-------|------|--------|-------------|
| simpleAttack | AttackSkill | unchanged | Base attack skill (private) |
| special | Special | unchanged | Ultimate ability (private) |
| skills | Skill[] | unchanged | Event-triggered skills |
| **targetingOverrides** | **TargetingOverrideEntry[]** | **added** | Stack of active targeting overrides (private) |

**New methods**:
- `overrideAttackTargeting(strategy: TargetingCardStrategy, terminationEvent: string): void`
- `restoreAttackTargeting(eventName: string): TargetingOverrideEntry[]` — returns removed overrides
- `launchSkills(trigger: string, context: FightingContext): SkillResults[]` — replaces `launchSkill`, returns all matches

**Modified methods**:
- `launchAttack(context)`: uses last targeting override if present, otherwise delegates to simpleAttack's built-in strategy

### TargetingOverrideEntry (new, internal)

| Field | Type | Description |
|-------|------|-------------|
| strategy | TargetingCardStrategy | The overriding targeting strategy |
| terminationEvent | string | Event that removes this override |
| powerId | string? | Composite power group identifier |

## New Entities

### TargetingOverride (new skill)

A skill implementation that, when triggered, applies a targeting strategy override on its source card.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique skill identifier |
| targetingStrategy | TargetingCardStrategy | The new targeting strategy to apply |
| terminationEvent | string | Event that reverts this override |
| trigger | Trigger | When this skill fires |
| powerId | string? | Composite power group identifier |

**Behavior**: On `launch()`, calls `source.overrideAttackTargeting(targetingStrategy, terminationEvent)`. Returns `SkillResults` with kind `SkillKind.TargetingOverride`.

## Modified Report Types

### BuffReport (existing)

| Field | Type | Change |
|-------|------|--------|
| kind | StepKind.Buff | unchanged |
| source | CardInfo | unchanged |
| buffs | Buff[] | unchanged |
| energy | number | unchanged |
| **powerId** | **string?** | **added** |

### DebuffReport (existing)

| Field | Type | Change |
|-------|------|--------|
| kind | StepKind.Debuff | unchanged |
| source | CardInfo | unchanged |
| debuffs | Debuff[] | unchanged |
| **powerId** | **string?** | **added** |

### HealingReport (existing)

| Field | Type | Change |
|-------|------|--------|
| kind | StepKind.Healing | unchanged |
| source | CardInfo | unchanged |
| heals | Heal[] | unchanged |
| **powerId** | **string?** | **added** |

### BuffRemovedReport (existing)

| Field | Type | Change |
|-------|------|--------|
| kind | StepKind.BuffRemoved | unchanged |
| source | CardInfo | unchanged |
| eventName | string | unchanged |
| removed | RemovedBuff[] | unchanged |
| **powerId** | **string?** | **added** |

## New Report Types

### TargetingOverrideReport (new)

| Field | Type | Description |
|-------|------|-------------|
| kind | StepKind.TargetingOverride | Step kind discriminator |
| source | CardInfo | Card whose targeting was overridden |
| previousStrategy | string | Original targeting strategy id |
| newStrategy | string | Overriding targeting strategy id |
| powerId | string? | Composite power group identifier |

### TargetingRevertedReport (new)

| Field | Type | Description |
|-------|------|-------------|
| kind | StepKind.TargetingReverted | Step kind discriminator |
| source | CardInfo | Card whose targeting was restored |
| eventName | string | The event that triggered revert |
| revertedStrategy | string | Strategy that was removed |
| restoredStrategy | string | Strategy that was restored |
| powerId | string? | Composite power group identifier |

## New StepKind Values

| Value | Description |
|-------|-------------|
| `targeting_override` | Targeting strategy was overridden |
| `targeting_reverted` | Targeting strategy was restored to original |

## New SkillKind Value

| Value | Description |
|-------|-------------|
| `TARGETING_OVERRIDE` | Skill that overrides card's attack targeting |

## State Transitions

```
Card targeting state:
  [Original] --overrideAttackTargeting()--> [Overridden]
  [Overridden] --restoreAttackTargeting(event)--> [Original] (if no more overrides)
  [Overridden] --restoreAttackTargeting(event)--> [Still Overridden] (if other overrides remain)

Composite power lifecycle:
  [Configured] --trigger fires--> [Active: all skills fire, effects applied]
  [Active] --termination event--> [Expired: all effects removed]
  [Active] --card dies--> [Implicitly expired]
```
