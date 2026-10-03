---
name: api-docs
description: API documentation and specifications
argument-hint: N/A
---

# API Documentation

This part provides a comprehensive reference for the API, including endpoints, request/response formats, validation, and error handling.

## Authentication & Authorization

Not implemented - API is currently open without authentication.

## Endpoints

- Controller file: @packages/combat-engine/src/fight/http-api/fight.controller.ts - Single endpoint for fight simulation
- Base URL: `http://localhost:3000` (default port, configurable via `PORT` env var)
- Versioning: None - Unversioned API
- Format: REST - Single POST endpoint
- Protocol: HTTP

## Request/Response Formats

- Request format: JSON - Validated using `class-validator` decorators
- Response format: JSON - Returns `FightResult` object with step-by-step battle log
- Validation: Global `ValidationPipe` with `transform: true`, `whitelist: true`, `forbidNonWhitelisted: true`

## Available Endpoints

### POST /fight

Simulates a turn-based card battle between two players.

**Request Body** (`FightDataDto`):

```typescript
{
  player1: {
    name: string,
    deck: FightingCardDto[] // 1-5 cards
  },
  player2: {
    name: string,
    deck: FightingCardDto[] // 1-5 cards
  },
  cardSelectorStrategy: "player-by-player" | "speed-weighted"
}
```

**FightingCardDto Structure**:

```typescript
{
  name: string,
  attack: number,
  defense: number,
  health: number,
  speed: number,
  agility: number,
  accuracy: number,
  criticalChance: number,
  regeneration?: number,       // Health points restored at each turn end (default 0)
  resistance?: number,         // Chance to refuse a status or debuff = resistance / 200 (default 0)
  skills: {
    special: SpecialDto,      // Ultimate ability (attack or healing)
    simpleAttack: SimpleAttackDto,  // Basic attack
    others: OtherSkillDto[]   // Additional skills (healing, buffs)
  },
  behaviors: {
    dodge: "simple-dodge" | "random-dodge"
  },
  image?: string,             // Optional card image
  cardDeckIdentity?: string,  // Optional identifier
  id: string                  // Unique card identifier (used for ally-death trigger targeting)
}
```

**SpecialDto**:

```typescript
{
  kind: "ATTACK" | "HEALING",
  name: string,
  rate: number,               // Damage/healing multiplier
  energy: number,             // Energy cost to use special
  hits?: number,              // ATTACK only: number of hits (integer >= 1, default 1). Each hit re-targets the living cards and rolls its own dodge and critical; the effect is tried on every landed hit
  targetingStrategy: TargetingStrategy,
  effect?: EffectDto,         // Optional status effect (poison, burn, freeze)
  buffApplication?: BuffApplicationDto,   // Optional buff application (for special attacks)
  shieldApplication?: ShieldApplicationDto,  // Optional shield application (independent targeting)
  markedTargetBonus?: {                   // Optional damage bonus against an already marked target
    damageType: "PHYSICAL" | "FIRE" | "WATER" | "EARTH" | "AIR",
    multiplier: number                    // Must be > 0, e.g. 1.3 for +30%
  },
  stanceActivation?: {                    // Optional: opens a named stance on the caster
    name: string,                         // Stance name that skills reference with requiresStance
    duration: number,                     // Turns it runs; re-casting refreshes instead of stacking
    immunities?: ("control" | "damage-over-time")[]  // Status categories the caster refuses while it runs
  },
  energyRefund?: {                        // ATTACK only: energy kept after the special instead of emptying the gauge
    amount: number,                       // Integer >= 1, energy the caster keeps (shown in the special_attack step energy)
    minAccuracyMargin: number             // >= 0: caster accuracy minus the agility of the primary target (first defender struck) must be strictly greater
  },
  bleedStackBonus?: {                     // Optional: boosts one damage type when the target already bleeds
    minStacks: number,                    // Integer >= 1: bleed stacks the target must carry before the hit
    damageType: "PHYSICAL" | "FIRE" | "WATER" | "EARTH" | "AIR",  // Only this composition is multiplied
    multiplier: number                    // Must be > 0, e.g. 1.2 for +20%
  }
}
```

**ShieldApplicationDto**:

```typescript
{
  rate: number,               // Shield points = rate * maxHealth of target
  duration: number,           // Number of turns shield lasts
  targetingStrategy: TargetingStrategy  // Cannot be targeted-card
}
```

**Note on Buff/Shield Application**: Buff and shield targeting is independent from the primary attack targeting, allowing combos like "attack all enemies while shielding all allies".

**SimpleAttackDto**:

```typescript
{
  name: string,
  damages: DamageCompositionDto[],  // Min 1 entry — multi-type damage compositions
  targetingStrategy: TargetingStrategy,
  effects?: EffectDto[],            // Optional array of status effects (poison, burn, freeze, stunt)
  bleedStackBonus?: {                     // Optional: boosts one damage type when the target already bleeds
    minStacks: number,                    // Integer >= 1: bleed stacks the target must carry before the hit
    damageType: "PHYSICAL" | "FIRE" | "WATER" | "EARTH" | "AIR",  // Only this composition is multiplied
    multiplier: number                    // Must be > 0, e.g. 1.2 for +20%
  }   // Same as SpecialDto.bleedStackBonus
}
```

**MultipleAttackDto** (alternative to `simpleAttack`, for multi-hit attacks):

```typescript
{
  name: string,
  hits: number,                     // Number of hits
  damages: DamageCompositionDto[],  // Min 1 entry
  targetingStrategy: TargetingStrategy,
  amplifier?: number,               // Optional damage amplifier
  effects?: EffectDto[],            // Optional array of status effects
  comboFinisher?: DamageCompositionDto[],  // Optional finisher hit compositions
  comboFinisherEffects?: EffectDto[],     // Optional effects applied on the finisher hit only
  bleedStackBonus?: {                     // Optional: boosts one damage type when the target already bleeds
    minStacks: number,                    // Integer >= 1: bleed stacks the target must carry before the hit
    damageType: "PHYSICAL" | "FIRE" | "WATER" | "EARTH" | "AIR",  // Only this composition is multiplied
    multiplier: number                    // Must be > 0, e.g. 1.2 for +20%
  }   // Same as SpecialDto.bleedStackBonus, finisher included
}
```

**Note**: `skills.simpleAttack` and `skills.multipleAttack` are both optional — provide exactly one.

**OtherSkillDto**:

```typescript
{
  kind: "HEALING" | "BUFF" | "CONDITIONAL_ATTACK" | "TARGETING_OVERRIDE" | "SHIELD" | "SURVIVE" | "DAMAGE_REDUCTION" | "PROTECTION" | "DODGE_BONUS_DENIAL" | "BLEED_STACK_SCALING" | "STANCE" | "BLEED_EMPOWERMENT",
  name: string,
  rate?: number,                // Optional — not required for TARGETING_OVERRIDE or SURVIVE; required for SHIELD and DAMAGE_REDUCTION (share of incoming damage removed, in ]0, 1]); required for BLEED_STACK_SCALING (attack bonus per bleed stack, > 0); required for BLEED_EMPOWERMENT (bleed rate used during the stance, > 0)
  maxRate?: number,             // BLEED_STACK_SCALING only (required, > 0): cap of the attack bonus
  stanceActivation?: { name: string, duration: number, immunities?: ("control" | "damage-over-time")[] },  // STANCE only (required): stance opened on the owner when its event fires
  stackThreshold?: number,      // Required when event=bleed-stacks-applied (integer >= 1): bleed stacks the owner must have laid
  extraStacks?: number,         // BLEED_EMPOWERMENT only (required, integer >= 0): stacks each bleed of the owner lays on top of its own during the stance
  probability?: number,         // DAMAGE_REDUCTION only: per-hit roll (0-1); omit for a permanent reduction
  targetingStrategy?: TargetingStrategy,  // Not required for SHIELD, SURVIVE, DAMAGE_REDUCTION, DODGE_BONUS_DENIAL, BLEED_STACK_SCALING, BLEED_EMPOWERMENT or STANCE kinds
  event?: "turn-end" | "next-action" | "ally-death" | "ally-health-below" | "any-ally-health-below" | "self-death" | "enemy-bleed-death" | "bleed-stacks-applied" | "damage-taken",  // When skill triggers; NOT required for SHIELD, SURVIVE, DAMAGE_REDUCTION, DODGE_BONUS_DENIAL, BLEED_STACK_SCALING or BLEED_EMPOWERMENT kinds
  targetCardId?: string,        // Required when event=ally-death, ally-health-below or damage-taken (never for any-ally-health-below): id of the monitored card
  requiresStance?: string,      // Skill only fires while its owner holds that stance (see SpecialDto.stanceActivation); required for BLEED_EMPOWERMENT
  // SHIELD-specific fields:
  activationCondition?: { type?: "health-threshold" | "ally-presence" | "probability", operator?: "below" | "above", threshold?: number, allyName?: string, probability?: number },  // Health ratio threshold (0–1) for SHIELD/ally-health-below/any-ally-health-below activation and most-wounded-ally targeting; type "probability" gates any triggered ALTERATION skill on a per-event roll. On `any-ally-health-below` the field belongs to the trigger alone and is NOT reused as the skill own activation condition — it says an ally fell low, not that the caster did
  buffType?: "attack" | "defense" | "agility" | "accuracy" | "speed" | "criticalChance" | "regeneration" | "resistance",  // Required if kind=BUFF
  duration?: number,            // Required if kind=BUFF (0 = infinite: permanent or event-bound)
  stackId?: string,             // ALTERATION debuff: name of the stack pile it counts against
  debuffMaxStacks?: number,     // Cap of that pile; goes with stackId, both or neither
  terminationEvent?: string,    // Event name that removes this skill's buff/targeting override when fired
  activationLimit?: number,     // Max activations (>=1) before skill lifecycle ends — supported for HEALING and TARGETING_OVERRIDE kinds
  endEvent?: string,            // Event emitted when activation limit is reached — supported for HEALING and TARGETING_OVERRIDE kinds
  healBasis?: "source-attack" | "target-max-health",  // HEALING only: what the rate is a share of (default source-attack)
  powerId?: string,             // Groups multiple skills as a composite power (must share same event + terminationEvent)
  // DORMANT trigger fields (required when event="dormant"):
  activationEvent?: TriggerEvent, // Event that activates the dormant skill (e.g., "ally-death")
  activationTargetCardId?: string, // Card ID for the activation event trigger
  replacementEvent?: TriggerEvent, // Event to use after activation (e.g., "enemy-death"). Target card ID resolved dynamically from killer card at activation time
  // TRANSFORMATION fields:
  statAlterations?: StatAlterationDto[],  // Alterations applied on transformation
  lifestealRate?: number,       // Share of max health healed on every landed attack
  statusImmunity?: boolean,     // Refuses every status effect while transformed
  endCostRate?: number,         // Share of max health paid when the transformation ends
  // CONDITIONAL_ATTACK fields:
  damages?: DamageCompositionDto[],
  hits?: number,
  interval?: number,            // Turns between two activations; omit for a skill whose cadence is driven by its event (ally-health-below, damage-taken)
  amplifier?: number,
  effect?: EffectDto,
  comboFinisher?: DamageCompositionDto[],
  comboFinisherEffects?: EffectDto[]  // Effects applied on the finisher hit only
}
```

**EffectDto**:

```typescript
{
  type: "POISON" | "BURN" | "FREEZE" | "STUNT" | "MARK" | "BLEED",
  rate: number,               // Damage coefficient per tick (unused for STUNT); amplification per stack for MARK; damage of each stack per turn for BLEED
  level: 1 | 2 | 3,           // Required except for MARK and BLEED. Duration: STUNT = 2*level-1 turns; others = level 1=1, 2=3, 3=5 ticks
  duration?: number,          // BLEED only (required, >= 1): turns each stack bleeds
  damageType?: "PHYSICAL" | "FIRE" | "WATER" | "EARTH" | "AIR",  // MARK only (required): amplified damage type
  maxStacks?: number,         // MARK and BLEED (required): stack cap
  stacks?: number,            // MARK and BLEED: stacks applied per trigger (default 1)
  probability?: number,       // 0-1 chance to apply effect on hit; omit for guaranteed application
  triggeredDebuff?: {         // Optional debuff applied on effect hit (not supported on STUNT)
    debuffType: "attack" | "defense" | "agility" | "accuracy" | "speed" | "criticalChance" | "regeneration" | "resistance",
    debuffRate: number,
    duration: number,
    probability: number,
    stackId?: string,          // Name of the stack pile this debuff counts against
    maxStacks?: number,        // Cap of that pile; goes with stackId, both or neither
    terminationEvent?: string  // Event name that removes this triggered debuff when fired
  },
  terminationEvent?: string   // Event name that removes this effect when fired
}
```

**BuffApplicationDto**:

```typescript
{
  type: "attack" | "defense" | "agility" | "accuracy" | "speed" | "criticalChance" | "regeneration" | "resistance",
  rate: number,               // Buff strength multiplier
  duration: number,           // Number of turns buff lasts (0 = infinite: permanent if no terminationEvent, event-bound if terminationEvent is set)
  targetingStrategy: TargetingStrategy,
  condition?: BuffConditionDto,     // Optional conditional multiplier
  terminationEvent?: string         // Event name that removes this buff when fired
}
```

**Response** (`FightResult`):

```typescript
{
  [stepNumber: number]: {
    kind: "attack" | "special_attack" | "healing" | "status_change" | "state_effect" | "buff" | "debuff" | "buff_removed" | "debuff_removed" | "buff_expired" | "debuff_expired" | "effect_removed" | "targeting_override" | "targeting_reverted" | "shield_applied" | "shield_broken" | "shield_expired" | "survived" | "damage_mitigated" | "stance_started" | "stance_ended" | "mark_applied" | "regenerated" | "protection_started" | "protection_ended" | "attack_intercepted" | "transformation_started" | "transformation_ended" | "fight_end",
    // Additional properties vary by step kind
  }
}
```

**`attack` / `special_attack` step** (`DamageReport`): Emitted when a card attacks.
```typescript
{
  kind: "attack" | "special_attack",
  name?: string,         // Skill name that triggered the attack
  attacker: CardInfo,
  damages: { defender: CardInfo, damage: number, isCritical: boolean, dodge: boolean, remainingHealth: number, shieldAbsorbed?: number, survived?: boolean, survivedSkillName?: string }[],
  energy: number
}
```

`shieldAbsorbed` est la part de `damage` mangée par le bouclier au lieu de la
santé, absente quand aucun bouclier n'était sur le chemin. `damage` reste le
total infligé, donc un consommateur qui suit le tampon depuis `shield_applied`
a besoin de ce champ pour le décrémenter : sans lui le bouclier restait affiché
à sa valeur d'application jusqu'à sa rupture.

**`survived` step** (`SurvivedReport`): Emitted immediately after a fatal blow is intercepted by a SURVIVE skill.
```typescript
{
  kind: "survived",
  name: string,          // Name of the SURVIVE skill that triggered
  card: CardInfo         // Card that survived the fatal blow (left at 1 HP)
}
```

**`damage_mitigated` step** (`DamageMitigatedReport`): Emitted when a DAMAGE_REDUCTION skill removes a share of an incoming hit, before the shield absorbs the rest.
```typescript
{
  kind: "damage_mitigated",
  name: string,          // Name of the DAMAGE_REDUCTION skill that triggered
  card: CardInfo         // Card whose incoming damage was reduced
}
```

**`stance_started` step** (`StanceStartedReport`): Emitted when a special or a STANCE skill opens a stance on its caster.
```typescript
{
  kind: "stance_started",
  name: string,          // Stance name
  card: CardInfo,        // Caster now holding it
  remainingTurns: number
}
```

**`stance_ended` step** (`StanceEndedReport`): Emitted at turn-end when a stance duration runs out.
```typescript
{
  kind: "stance_ended",
  name: string,
  card: CardInfo
}
```

**`healing` step** (`HealingReport`): Emitted when a card heals.
```typescript
{
  kind: "healing",
  name?: string,         // Skill name that triggered the healing
  source: CardInfo,
  heal: { target: CardInfo, healed: number, remainingHealth: number }[],
  energy: number,
  powerId?: string
}
```

**`buff` step** (`BuffReport`): Emitted when a buff is applied.
```typescript
{
  kind: "buff",
  name?: string,         // Skill name that applied the buff
  source: CardInfo,
  alterations: { target: CardInfo, kind: BuffType, value: number, remainingTurns: number }[],
  energy: number,
  powerId?: string
}
```

**`debuff` step** (`DebuffReport`): Emitted when a debuff is applied.
```typescript
{
  kind: "debuff",
  name?: string,         // Skill name that applied the debuff
  source: CardInfo,
  alterations: { target: CardInfo, kind: DebuffType, value: number, remainingTurns: number }[],
  energy: number,
  powerId?: string
}
```

**`buff_removed` step** (`BuffRemovedReport`): Emitted when a skill's end event fires and removes event-bound buffs.
```typescript
{
  kind: "buff_removed",
  source: CardInfo,      // Card whose skill emitted the end event
  eventName: string,     // The end event name that triggered removal
  removed: { target: CardInfo, kind: BuffType, value: number }[],
  powerId?: string       // Present if the skill that emitted the end event belongs to a composite power
}
```

**`debuff_removed` step** (`DebuffRemovedReport`): Emitted when a skill's end event fires and removes event-bound debuffs.
```typescript
{
  kind: "debuff_removed",
  source: CardInfo,      // Card whose skill emitted the end event
  eventName: string,     // The end event name that triggered removal
  removed: { target: CardInfo, kind: DebuffType, value: number }[],
  powerId?: string       // Present if the skill that emitted the end event belongs to a composite power
}
```

**`buff_expired` step** (`BuffExpiredReport`): Emitted at end of turn when a buff's duration reaches 0.
```typescript
{
  kind: "buff_expired",
  card: CardInfo,        // Card whose buff expired
  expired: { kind: BuffType, value: number }[]
}
```

**`debuff_expired` step** (`DebuffExpiredReport`): Emitted at end of turn when a debuff's duration reaches 0.
```typescript
{
  kind: "debuff_expired",
  card: CardInfo,        // Card whose debuff expired
  expired: { kind: DebuffType, value: number }[]
}
```

**`status_change` step** (`StatusChangeReport`): Emitted after an attack when a status effect is applied or the card dies.
```typescript
{
  kind: "status_change",
  card: CardInfo,
  status: "dead" | "poison" | "burn" | "freeze" | "stunt" | "bleed",
  stacks?: number        // bleed only: stack count after this application
}
```

**`state_effect` step** (`StateEffectReport`): Emitted at turn-end for each status that ticks.
```typescript
{
  kind: "state_effect",
  type: "poison" | "burn" | "freeze" | "stunt" | "bleed",
  card: CardInfo,
  damage: number,          // bleed: sum of every stack
  remainingTurns: number,  // bleed: turns left before the last stack expires
  remainingHealth: number,
  remainingStacks?: number // bleed only: stacks left after the tick
}
```

**`effect_removed` step** (`EffectRemovedReport`): Emitted when an end event fires and removes event-bound status effects (poison, burn, freeze, stunt).
```typescript
{
  kind: "effect_removed",
  source: CardInfo,      // Card whose skill emitted the end event
  eventName: string,     // The end event name that triggered removal
  removed: { target: CardInfo, effectType: string }[]
}
```

**`mark_applied` step** (`MarkAppliedReport`): Emitted when an elemental mark is applied on hit. Absent when the target already carries the maximum number of stacks.
```typescript
{
  kind: "mark_applied",
  card: CardInfo,        // Marked card
  damageType: string,    // Damage type amplified by the mark
  stacks: number         // Stack count after this application
}
```

**`regenerated` step** (`RegeneratedReport`): Emitted at turn-end when a card restores health through its `regeneration` stat. Absent when the card carries no regeneration or is already at full health.
```typescript
{
  kind: "regenerated",
  card: CardInfo,
  healed: number,          // Health points actually restored, clamped at max health
  remainingHealth: number
}
```

**`protection_started` step** (`ProtectionStartedReport`): Emitted when a PROTECTION skill puts its owner in front of an ally.
```typescript
{
  kind: "protection_started",
  name: string,            // Protection skill name
  card: CardInfo,          // The guardian
  protectedCard: CardInfo, // The ally it now covers
  remainingTurns: number
}
```

**`protection_ended` step** (`ProtectionEndedReport`): Emitted at turn-end when a protection's duration runs out.
```typescript
{
  kind: "protection_ended",
  card: CardInfo,          // The guardian
  protectedCard: CardInfo  // The ally it no longer covers
}
```

**`attack_intercepted` step** (`AttackInterceptedReport`): Emitted for each hit a guardian took in place of the ally it protects. It follows the `attack` step that carries the damage, whose `defender` is the guardian.
```typescript
{
  kind: "attack_intercepted",
  card: CardInfo,          // The guardian that took the hit
  protectedCard: CardInfo  // The ally the hit was aimed at
}
```

**`transformation_started` step** (`TransformationStartedReport`): Emitted when a TRANSFORMATION skill fires.
```typescript
{
  kind: "transformation_started",
  name: string,          // Transformation skill name
  card: CardInfo,        // Transformed card
  remainingTurns: number // Transformation duration
}
```

**`transformation_ended` step** (`TransformationEndedReport`): Emitted at turn-end when a transformation duration runs out, after its health cost is charged.
```typescript
{
  kind: "transformation_ended",
  name: string,
  card: CardInfo,
  healthCost: number,      // Health points paid on exit, 0 when the skill has no cost
  remainingHealth: number
}
```

**`targeting_override` step** (`TargetingOverrideReport`): Emitted when a targeting override skill activates.
```typescript
{
  kind: "targeting_override",
  name?: string,                   // Skill name that pushed the override
  source: CardInfo,                // Card whose skill pushed the override
  previousStrategy: string,        // ID of the strategy before override
  newStrategy: string,             // ID of the new targeting strategy
  powerId?: string                 // Present if skill belongs to a composite power
}
```

**`targeting_reverted` step** (`TargetingRevertedReport`): Emitted when a targeting override is removed via end event.
```typescript
{
  kind: "targeting_reverted",
  source: CardInfo,                // Card whose override was reverted
  eventName: string,               // The end event name that triggered the revert
  revertedStrategy: string,        // ID of the strategy that was removed
  restoredStrategy: string,        // ID of the strategy restored
  powerId?: string                 // Present if triggered by a composite power end event
}
```

**`shield_applied` step** (`ShieldAppliedReport`): Emitted when a shield is applied to one or more cards.
```typescript
{
  kind: "shield_applied",
  name?: string,             // Skill name that applied the shield
  source: CardInfo,
  targets: { target: CardInfo, points: number }[]
}
```

**`shield_broken` step** (`ShieldBrokenReport`): Emitted when a shield's points are depleted mid-damage.
```typescript
{
  kind: "shield_broken",
  card: CardInfo
}
```

**`shield_expired` step** (`ShieldExpiredReport`): Emitted at turn-end when a shield's duration reaches 0.
```typescript
{
  kind: "shield_expired",
  card: CardInfo
}
```

**Note on `name`**: The `name?` field appears on `attack`, `special_attack`, `healing`, `buff`, `debuff`, `targeting_override`, and `shield_applied` step kinds, carrying the name of the skill that generated the step.

**Note on `powerId`**: The `powerId` field appears on `buff`, `debuff`, `healing`, `buff_removed`, `debuff_removed`, `targeting_override`, and `targeting_reverted` step kinds when the originating skill belongs to a composite power group.

## Enums

### CardSelectorStrategy

- `player-by-player`: Cards alternate between players
- `speed-weighted`: Cards act based on speed stat probability

### TargetingStrategy

- `position-based`: Targets opponent at same position
- `target-all`: Targets all opponents
- `line-three`: Targets 3 cards in a line
- `all-owner-cards`: Targets all cards belonging to owner
- `all-allies`: Targets all allied cards
- `self`: Targets the card itself
- `last-attacker-of-ally`: Targets the card that last attacked a specific ally (requires `targetCardId`); built inline in controller with `LastAttackerOfAllyTargetingStrategy`
- `protected-ally`: Targets the ally the caster is currently standing in front of (see `PROTECTION`). Needs no `targetCardId` and no threshold — the protection itself says who, and its absence says nobody, so a skill using it is silent outside the power that opened the protection. Returns nothing if that ally is dead; still resolves when the **caster** is dead, which is what a guardian parting gift needs. Built with `ProtectedAllyStrategy`
- `linked-ally`: Targets a specific ally by ID (requires `targetCardId`); built inline in controller with `AlliedCardByIdStrategy`
- `most-wounded-ally`: Targets the caster’s ally in the worst shape among those below `activationCondition.threshold`, resolved against the live board at each launch (requires the threshold, never a `targetCardId`). Excludes the caster and the dead; targets nobody when every ally is above the threshold. Ties keep deck order, so the choice is reproducible. Built with `MostWoundedAllyStrategy`

### DodgeStrategy

- `simple-dodge`: Uses agility stat for dodge calculation
- `random-dodge`: Random dodge chance

### TriggerEvent

- `turn-end`: Skill triggers at end of turn
- `next-action`: Skill triggers on the next action turn
- `ally-death`: Skill triggers when a specific ally dies (requires `targetCardId` matching the dead card's `id`)
- `enemy-death`: Skill triggers when a specific enemy dies (requires `targetCardId` matching the dead card's `id`)
- `dormant`: Skill starts inactive; requires `activationEvent`, `activationTargetCardId`, and `replacementEvent` to define when and how the trigger activates mid-battle. The replacement trigger's target card ID is resolved dynamically at activation time from the killer card's ID
- `survived`: Skill triggers after the owning card survives a fatal blow via SURVIVE skill
- `ally-health-below`: Edge-triggered when a monitored ally's health ratio crosses `activationCondition.threshold` downward; requires `targetCardId` (the monitored ally's id) and `activationCondition.threshold`. A card may monitor itself by passing its own id, which is how a health-reactive self buff is declared
- `self-death`: Fires on the card that just died, for its own last words — every other death trigger runs on somebody else, since `ally-death` and `enemy-death` only reach the survivors. Needs no `targetCardId`: the trigger is the owner own id. It runs as phase 2 of the death cascade, before the survivors answer, so what the fallen card leaves behind lands first. Pairs with `protected-ally` targeting for a guardian parting gift
- `enemy-bleed-death`: Fires on the surviving cards of the opposing team when a card dies from its bleed tick at turn end. Needs no `targetCardId`: whoever bled out, the skill answers. A death by an attack, a poison or a burn does not fire it; when a lethal tick combines several statuses, the bleed is credited as soon as it ticked. Runs last in the death cascade, after `enemy-death`. Paired with a `HEALING` on `self` with `healBasis: "target-max-health"`, it is "regain 10% of max health when an enemy bleeds out"
- `bleed-stacks-applied`: Fires **once per fight**, after the owner attack that brings the bleed stacks it has laid since the fight began to `stackThreshold` (a count jumping over the threshold still fires). Stacks lost at the cap or refused (immunity, resistance) do not count. Checked after every attack the owner makes in its action (simple, next-action, special); stacks laid by a reactive attack count, but are only seen at the owner next action. Each skill on the event keeps its own once-flag, so a STANCE and a BUFF sharing it both fire
- `damage-taken`: Fires every time the monitored card takes damage from a landed attack; requires `targetCardId` (the monitored card id). Unlike `ally-health-below` it is not edge-triggered — it fires on each hit, which is what counter attacks and damage-reactive passives need. A card reacts to its own wounds by passing its own id. The event reaches every playable card of the damaged card team, and `FightingContext.lastAttacker` is set, so `last-attacker-of-ally` resolves to the attacker
- `any-ally-health-below`: Edge-triggered when **any** ally crosses `activationCondition.threshold` downward, where `ally-health-below` watches one ally named up front. Requires the threshold, never a `targetCardId`. Each ally is edge-triggered on its own — the trigger fires once per crossing and rearms for that ally when its health recovers. The owner is skipped, so a card watching its own health still uses `ally-health-below`. Pairs with `most-wounded-ally` targeting for a guardian power on a deck the player composes

### SpecialKind

- `ATTACK`: Special ability that deals damage
- `HEALING`: Special ability that heals

### SkillKind

- `HEALING`: Healing skill
- `BUFF`: Temporary stat boost
- `CONDITIONAL_ATTACK`: Attack skill triggered conditionally by an event
- `TARGETING_OVERRIDE`: Overrides the card's attack targeting strategy (requires `terminationEvent`)
- `SHIELD`: Health-reactive shield skill — no `event` field; triggers when card's health ratio crosses `activationCondition.threshold` downward (edge-triggered, rearms on recovery)
- `SURVIVE`: One-time fatal-blow interception — no `event`, no `targetingStrategy`; only `name` required; extracted from `others[]` before normal skill loop
- `DAMAGE_REDUCTION`: Removes a share of every incoming hit — no `event`, no `targetingStrategy`; requires `rate` (share removed, in `]0, 1]`) and accepts an optional `probability` making it a per-hit roll. Like SURVIVE it is extracted from `others[]` and consulted inside `applyFinalDamage()`, so it mitigates the very hit that triggers it. Applies after the freeze/stunt amplifiers and before the shield buffer, so a shield absorbs only the reduced damage. Status effect ticks bypass it, as they bypass the shield
- `PROTECTION`: Steps in front of one ally for `duration` of the guardian's turns — attacks aimed at that ally are resolved against the guardian instead, with the guardian's own dodge, defence and element. Requires `duration`, plus an `event` and a `targetingStrategy`; it covers the **first** card its targeting returns, so pairing it with `most-wounded-ally` guards whoever is in the worst shape at that moment. A targeting that returns nobody is a no-op and spends no `activationLimit`. Re-casting refreshes the duration or moves the protection, never stacks. A dead guardian protects nobody. `activationLimit` is supported, so "once per fight" is `activationLimit: 1`
- `DODGE_BONUS_DENIAL`: Passive — no `event`, no `targetingStrategy`, only `name`. Against its owner, a bleeding defender dodges with its base agility minus its debuffs: its agility **buffs** are ignored. Applies to every attack of the owner (simple, multiple, special, triggered attacks). Like SURVIVE it is extracted from `others[]` and stored on the card; it emits no step
- `BLEED_STACK_SCALING`: Passive — no `event`, no `targetingStrategy`; requires `rate` (attack bonus per bleed stack) and `maxRate` (cap). Raises its owner attack by `rate` for every bleed stack carried by a living card, both teams counted, up to `maxRate` — `rate: 0.02, maxRate: 0.3` is "+2% attack per stack, at most +30%". Read from the live board each time the owner strikes: attack damage (simple, multiple, special, triggered attacks) and the damage of the poison, burn and bleed it applies on that hit. Heals are not affected. Extracted from `others[]` like SURVIVE; it emits no step
- `BLEED_EMPOWERMENT`: Passive — no `event`, no `targetingStrategy`; requires `requiresStance`, `extraStacks` and `rate`. While its owner holds that stance, every BLEED it applies (simple, multiple, special, triggered attacks) lays `extraStacks` more stacks and bleeds at `rate` instead of the effect own rate, still within the effect `maxStacks`. Outside the stance nothing changes. Extracted from `others[]` like SURVIVE; it emits no step
- `STANCE`: Opens a stance on its owner when its `event` fires — the triggered counterpart of `SpecialDto.stanceActivation`. Requires `stanceActivation` (`name`, `duration`, optional `immunities`), no `targetingStrategy`. Skills with the matching `requiresStance` then run for its duration; re-opening a running stance refreshes it. Emits `stance_started`, and `stance_ended` at turn end
- `TRANSFORMATION`: One-shot health-reactive transformation — no `event`, no `targetingStrategy`; requires `duration` and an `activationCondition` threshold. Applies its own `statAlterations` and, for the same duration, an optional `lifestealRate` (heals that share of max health on every landed attack) and `statusImmunity`. An optional `endCostRate` charges that share of max health when the transformation ends, never below one health point. Fires once per fight

### HealBasis

What a `HEALING` skill's `rate` is a share of. Defaults to `source-attack`, which every card written before this option keeps.

- `source-attack`: the healer's `actualAttack` — the heal grows with the caster, which suits a support whose offence and care scale together
- `target-max-health`: the receiver's maximum health — the same heal whoever casts it, which is what a kit phrased as "the ally recovers 10% of its health per turn" means

Both go through `applyHealing()` (`skills/heal-basis.ts`), shared with `SpecialHealing`; an unknown basis throws. The heal is capped at the target's maximum health either way.

### StatusCategory

What a status effect does to its bearer, and therefore what an immunity is granted against. Used by `SpecialDto.stanceActivation.immunities`.

- `control`: takes the turn away — `FREEZE` and `STUNT`
- `damage-over-time`: only bites — `POISON`, `BURN` and `BLEED`

An elemental `MARK` is not a status effect and no immunity refuses it.

### Effect

- `POISON`: Damage over time
- `BURN`: Damage over time
- `FREEZE`: Prevents action for 1-5 turns, increases damage taken by 20%
- `STUNT`: Prevents action for 1-5 turns (2*level-1), increases damage taken by 20%; no damage tick; does not stack with freeze (whichever is active takes precedence)
- `BLEED`: Cumulative damage over time — each application adds `stacks` stacks, each bleeding `rate × source attack` (fixed when applied) per turn for its own `duration`, so stacks applied at different turns expire independently. Capped at `maxStacks`: extra stacks are lost, and an application at the cap emits no step. Cannot be applied to a frozen card, and a freeze pauses it: no damage and no stack duration spent until the card thaws. Refused as a whole by a `damage-over-time` immunity or a won resistance roll (one roll per application). An end event removes only the stacks it bound
- `MARK`: Cumulative elemental mark — each stack amplifies the damage the card receives from `damageType` by `rate` (multiplicative on that damage portion, before defense). Stacks up to `maxStacks`, never expires, no damage tick. One independent mark per damage type

### BuffType

- `attack`: Increases attack stat
- `defense`: Increases defense stat
- `agility`: Increases agility stat
- `accuracy`: Increases accuracy stat
- `speed`: Increases the speed stat, which drives turn order in both card selectors
- `criticalChance`: Increases the critical hit rate. The altered value is capped at 1, and like every other stat the buff value is a rate applied to the base stat, so a card with a base rate of 0.1 needs a rate of 2.5 to reach 0.35
- `regeneration`: Increases the health points restored at each turn end
- `resistance`: Increases the chance to refuse an incoming status effect or stat debuff

## Validation

All DTOs use `class-validator` decorators:

- `@IsString()`: Validates string fields
- `@IsNumber()`: Validates numeric fields
- `@IsEnum()`: Validates enum values
- `@IsArray()`: Validates array fields
- `@ArrayMinSize(1)`, `@ArrayMaxSize(5)`: Deck size constraints
- `@ValidateNested()`: Validates nested objects
- `@IsOptional()`: Marks optional fields
- `@IsNotEmpty()`: Ensures non-empty values

Validation errors return 400 Bad Request with detailed error messages.

## Error Handling

- **400 Bad Request**: Validation failures from `ValidationPipe`, plus the domain checks the controller converts explicitly — composite power consistency (`validatePowerIdConsistency`), the DAMAGE_REDUCTION rate range, and a debuff stack budget given by halves (`stackId` without its cap, or the reverse)
- **500 Internal Server Error**: Runtime errors (e.g., unknown skill kind, missing buff properties)
- No custom error handling middleware - uses NestJS defaults

## Factory Functions

Three factory functions map DTO enums to domain implementations:

- `buildTargetingStrategy()` in @packages/combat-engine/src/fight/http-api/targeting-strategy-factory.ts - Maps `TargetingStrategy` enum to strategy objects
- `buildDodgeStrategy()` in @packages/combat-engine/src/fight/http-api/dodge-strategy-factory.ts - Maps `DodgeStrategy` enum to behavior objects
- `buildTriggerStrategy()` in @packages/combat-engine/src/fight/http-api/trigger-factory.ts - Maps `TriggerEvent` enum to trigger objects

## Response Types

See @packages/combat-engine/src/fight/core/fight-simulator/@types/ for complete type definitions:

- `FightResult`: Map of step numbers to `Step` objects
- `Step`: Union type with `kind` discriminator
- `DamageReport`, `HealingReport`, `BuffReport`, `DebuffReport`, `StateEffectReport`, `StatusChangeReport`, `WinnerReport`, `BuffRemovedReport`, `EffectRemovedReport`, `TargetingOverrideReport`, `TargetingRevertedReport`: Specific step types

## Dependencies

- `@nestjs/common` v10 - NestJS core framework
- `class-validator` v0.14 - DTO validation
- `class-transformer` v0.5 - DTO transformation
