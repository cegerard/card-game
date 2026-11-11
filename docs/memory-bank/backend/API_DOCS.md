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
  kind: "ATTACK" | "HEALING" | "STANCE",  // STANCE strikes nobody: see SpecialKind
  name: string,
  rate: number,               // Damage/healing multiplier
  energy: number,             // Energy cost to use special
  hits?: number,              // ATTACK only: number of hits (integer >= 1, default 1). Each hit re-targets the living cards and rolls its own dodge and critical; the effect is tried on every landed hit
  targetingStrategy: TargetingStrategy,  // Required except for STANCE (400 if given)
  effect?: EffectDto,         // Optional status effect (poison, burn, freeze)
  effects?: EffectDto[],      // ATTACK only: more effects, tried after `effect` on every landed hit
  concealment?: { duration: number },     // STANCE only (400 otherwise): conceals the caster for `duration` turns (integer >= 0), see CONCEALMENT
  buffApplication?: BuffApplicationDto,   // Optional buff application (for special attacks)
  shieldApplication?: ShieldApplicationDto,  // Optional shield application (independent targeting)
  markedTargetBonus?: { damageType, multiplier },  // x multiplier (> 0) against a target already marked of that type
  stanceActivation?: {                    // Optional: opens a named stance on the caster
    name: string,                         // Stance name that skills reference with requiresStance
    duration: number,                     // Turns it runs; re-casting refreshes instead of stacking
    immunities?: ("control" | "damage-over-time")[],  // Status categories the caster refuses while it runs
    revealsConcealed?: boolean            // While it runs, the caster's attacks can target concealed enemies (their concealment is not lifted)
    evasionChance?: number                // In [0, 1]: chance an attack aimed at the bearer misses outright (a dodge), before the dodge roll
  },  // Required for STANCE
  energyRefund?: {                        // ATTACK only: energy kept after the special instead of emptying the gauge
    amount: number,                       // Integer >= 1, energy the caster keeps (shown in the special_attack step energy)
    minAccuracyMargin: number             // >= 0: caster accuracy minus the agility of the primary target (first defender struck) must be strictly greater
  },
  // Damage type bonuses: only the `damageType` composition is multiplied (multiplier > 0, 1.2 = +20%)
  bleedStackBonus?: { minStacks, damageType, multiplier },  // target carries >= minStacks (integer >= 1) bleed stacks
  concealedBonus?: { damageType, multiplier },              // attacker strikes from concealment
  execution?: { threshold: number }       // ATTACK only (400 on STANCE): see OtherSkillDto.execution — applied after the last hit
  defensePenetration?: number,            // ATTACK only (400 on STANCE): see OtherSkillDto.defensePenetration
  undodgeable?: boolean,                  // ATTACK only (400 on STANCE): no dodge roll and no stance evasion
  battlefield?: BattlefieldDto,           // STANCE only (400 otherwise): see ARCHITECTURE (Battlefield)
  targetCount?: number,                   // Required by random-enemies (integer >= 1)
  adjacentTargetsBattlefield?: BattlefieldDto  // ATTACK only: laid on the defenders standing next to each other (2 at least)
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

**SimpleAttackDto**:

```typescript
{
  name: string,
  damages: DamageCompositionDto[],  // Min 1 entry — multi-type damage compositions
  targetingStrategy: TargetingStrategy,
  effects?: EffectDto[],
  hitAlterations?: ...,             // Same as OtherSkillDto.hitAlterations
  bleedStackBonus?: ..., concealedBonus?: ...,  // Same as SpecialDto
  // Any attack (simple, multiple, special): x multiplier, every type unless damageType
  frozenTargetBonus?: { multiplier: number, damageType?: ... },  // against an already frozen defender
  terrainBonus?: { element: Element, multiplier: number, damageType?: ... }  // while the attacker or the defender stands in a battlefield of that element
}
```

**MultipleAttackDto** (alternative to `simpleAttack`, for multi-hit attacks):

```typescript
{
  name: string,
  hits: number,
  damages: DamageCompositionDto[],  // Min 1 entry
  targetingStrategy: TargetingStrategy,
  amplifier?: number,               // Optional damage amplifier
  effects?: EffectDto[],
  comboFinisher?: DamageCompositionDto[],  // Optional finisher hit compositions
  comboFinisherEffects?: EffectDto[],      // Effects applied on the finisher hit only
  bleedStackBonus?: ...,            // As SpecialDto.bleedStackBonus, finisher included
  concealedBonus?: ...              // As SpecialDto.concealedBonus: every hit of the action, finisher included
}
```

**Note**: `skills.simpleAttack` and `skills.multipleAttack` are both optional — provide exactly one.

**OtherSkillDto**:

```typescript
{
  kind: SkillKind,              // See Enums
  name: string,
  rate?: number,                // Required for HEALING, ALTERATION, SHIELD, DAMAGE_REDUCTION (in ]0, 1]), BLEED_STACK_SCALING, BLEED_EMPOWERMENT, BLEED_DETONATION, LOW_HEALTH_TARGET_BONUS, REAL_DAMAGE, WEAK_POINT_LEGACY (> 0 for the last ones)
  maxRate?: number,             // BLEED_STACK_SCALING only (required, > 0): cap of the attack bonus
  stanceActivation?: { name: string, duration: number, immunities?: ("control" | "damage-over-time")[] },  // STANCE (required): stance opened on the owner when its event fires. CONCEALMENT (optional): stance opened with the concealment. CONDITIONAL_ATTACK (optional): stance opened on the owner only when the attack fires (somebody targeted, energy paid), reported as `stance_started` after the attack step
  rampingChance?: { startChance: number, increment: number, fromTurn: number },  // STANCE only (400 otherwise): the stance opens on that chance — none before the `fromTurn`-th event, then `startChance`, + `increment` at each event it did not fire (one blocked included), back to 0 once it fired; never while its stance runs. `statAlterations` (STANCE too) apply when it opens
  stackThreshold?: number,      // Integer >= 1. Required when event=bleed-stacks-applied (bleed stacks the owner must have laid) and when targetingStrategy=first-bleeding-enemy (bleed stacks the target must carry)
  extraStacks?: number,         // BLEED_EMPOWERMENT only (integer >= 0, default 0): stacks each bleed of the owner lays on top of its own during the stance
  basis?: "source-attack" | "target-max-health",  // BLEED_EMPOWERMENT only: replaces the basis of the bleeds laid during the stance (see RateBasis)
  triggeredDebuff?: { debuffType, debuffRate, duration, probability, stackId?, maxStacks?, terminationEvent? },  // BLEED_EMPOWERMENT only: same shape as EffectDto.triggeredDebuff; replaces the debuff rolled when a bleed lands during the stance
  probability?: number,         // DAMAGE_REDUCTION only: per-hit roll (0-1); omit for a permanent reduction
  targetingStrategy?: TargetingStrategy,  // Absent on the passive and self-acting kinds (see SkillKind)
  event?: TriggerEvent,         // See Enums; absent on SHIELD, TRANSFORMATION and the passive kinds
  targetCardId?: string,        // Required when event=ally-death, ally-health-below, damage-taken or dodge, and for the last-attacker-of-ally and last-dodged-attacker targetings (never for any-ally-health-below): id of the monitored card
  requiresStance?: string,      // Skill only fires while its owner holds that stance (see SpecialDto.stanceActivation); required for BLEED_EMPOWERMENT
  // SHIELD-specific fields:
  activationCondition?: { type?: "health-threshold" | "ally-presence" | "probability", operator?: "below" | "above", threshold?: number, allyName?: string, probability?: number },  // Health ratio threshold (0–1) for SHIELD/ally-health-below/any-ally-health-below activation, most-wounded-ally targeting and the LOW_HEALTH_TARGET_BONUS target health (required there, in ]0, 1]); type "probability" gates any triggered ALTERATION skill on a per-event roll. On `any-ally-health-below` the field belongs to the trigger alone and is NOT reused as the skill own activation condition — it says an ally fell low, not that the caster did
  buffType?: "attack" | "defense" | "agility" | "accuracy" | "speed" | "criticalChance" | "regeneration" | "resistance",  // Required if kind=BUFF or BUFF_TRANSFER (type of the buffs handed over)
  duration?: number,            // Required if kind=BUFF (0 = infinite: permanent or event-bound). CONCEALMENT: optional integer >= 0, omitted = until the card attacks. BLEED_EMPOWERMENT: optional integer >= 1 (400 otherwise), turns each stack laid during the stance bleeds
  stackId?: string,             // ALTERATION (buff or debuff): name of the stack pile it counts against, shared by the alterations of the same polarity carrying that id
  maxStacks?: number,           // Cap of that pile (>= 1); goes with stackId, both or neither (400). An application at the cap is refused and emits no step
  debuffMaxStacks?: number,     // Former name of maxStacks, still accepted
  terminationEvent?: string,    // Event name that removes this skill's buff/targeting override when fired
  activationLimit?: number,     // Max activations (>=1) before the lifecycle ends — HEALING, TARGETING_OVERRIDE, CONDITIONAL_ATTACK (only an attack that struck spends one)
  endEvent?: string,            // Event emitted when activation limit is reached — supported for HEALING, TARGETING_OVERRIDE and CONDITIONAL_ATTACK kinds
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
  stanceActivations?: StanceActivation[],  // TRANSFORMATION only (400 otherwise): stances opened on the owner, each for its own duration
  criticalDamageRate?: number,  // TRANSFORMATION only: critical multiplier x (1 + rate) while it runs
  activationEvent?: TriggerEvent, // DORMANT (above); TRANSFORMATION: an event setting it off too, still once
  poisonSurge?: { stacks: number, damageMultiplier: number },  // TRANSFORMATION only: every living stacked poison on the board rises to `stacks` (at least) and its damage is multiplied, reported as `status_change: poison` per card
  battlefield?: BattlefieldDto, // TRANSFORMATION only: laid when it starts
  activationEventThreshold?: number,  // TRANSFORMATION, required with activationEvent any-ally-health-below: the ally health ratio
  perLivingAlly?: { maxRate },  // ALTERATION only: `rate` per living ally of the bearer (bearer excluded), capped, read live
  whileHealthBelow?: number,    // ALTERATION only (not with perLivingAlly): counts only while the bearer health ratio is under it
  terminationDamageRate?: number,  // ALTERATION only, in ]0, 1]: `terminationEvent` ends it only on a hit costing more than that share of max health
  accuracyRate?: number, agilityRate?: number,  // ATTACKER_INSIGHT (required, >= 0)
  amount?: number,              // ENERGY_GAIN (required, integer >= 1)
  shield?: { rate, duration }, cleanse?: number, alterations?: { type, rate, duration, polarity }[],  // SUPPORT only: shield of rate × caster max health, statuses removed at random, alterations — on each target
  // CONDITIONAL_ATTACK fields:
  damages?: DamageCompositionDto[],  // Required unless bleedDetonation is set
  hits?: number,                // Not allowed with bleedDetonation (400)
  interval?: number,            // CONDITIONAL_ATTACK, CONCEALMENT and SUPPORT only (400 elsewhere): turns between two activations (integer >= 1)
  amplifier?: number,
  effect?: EffectDto,           // CONDITIONAL_ATTACK: effect of the hit; AFFLICTION (required): effect laid on every target
  comboFinisher?: DamageCompositionDto[],
  comboFinisherEffects?: EffectDto[],  // Effects applied on the finisher hit only
  weakPointPenetration?: number, // CONDITIONAL_ATTACK only, in [0, 1]: replaces defensePenetration against a defender carrying a weak point
  defensePenetration?: number,  // In [0, 1] (400 outside): share of the defender defense the attack ignores — defense used = actualDefense × (1 − defensePenetration); default 0
  energyCost?: number,          // Integer >= 1: the attack does not fire below that special energy, and spends it only when it strikes somebody
  endsStance?: boolean,         // CONDITIONAL_ATTACK only (400 on any other kind, and without `requiresStance`): once the attack fired (somebody targeted), closes its `requiresStance` on its owner and reports `stance_ended` — so it fires once per stance
  requiresUndamaged?: boolean,  // CONDITIONAL_ATTACK and CONCEALMENT only: never fires when its owner lost health since its previous action (see ARCHITECTURE); with `interval`, both must hold
  hitAlterations?: {           // CONDITIONAL_ATTACK (and SimpleAttackDto): see ARCHITECTURE (Attack Add-ons)
    type: BuffType,
    rate: number,
    duration: number,
    polarity: "buff" | "debuff",
    terminationEvent?: string
  }[],
  execution?: { threshold: number },  // CONDITIONAL_ATTACK only, threshold in ]0, 1[: see ARCHITECTURE (Attack Add-ons); reported as `executed`
  bleedDetonation?: { ratePerStack: number },  // > 0: consumes every bleed stack of the target and hits for ratePerStack × consumed stacks of the attack, as a PHYSICAL composition replacing `damages`
  splash?: {                    // Secondary strike around the primary target: see ARCHITECTURE (Attack Add-ons)
    name: string,               // Name of the splash attack step
    damages: DamageCompositionDto[],  // Min 1 entry
    effects?: EffectDto[]
  },
  onLowHealthAfterHit?: {       // Debuffs the main defender left alive under `threshold`: see ARCHITECTURE (Attack Add-ons)
    name: string,
    threshold: number,          // Health ratio in ]0, 1]
    debuffs: { type: BuffType, rate: number, duration: number }[]  // Min 1; rate > 0, duration integer >= 1
  }
}
```

**EffectDto**:

```typescript
{
  type: Effect,                // See Enums
  weakPoint?: { name, duration?, damageMultiplier?, criticalChanceBonus?, consumable?, revealerAccuracyRate?, revealerAttackRate?, revealerDamageRate?, exploitEffect?: EffectDto },  // WEAK_POINT (required): see Effect
  rate: number,               // Meaning per type: see Effect
  level: 1 | 2 | 3,           // POISON, BURN, FREEZE, STUNT only. STUNT = 2*level-1 turns; others = 1, 3, 5 ticks
  duration?: number,          // Required (>= 1) for BLEED, stacked POISON, HYPOTHERMIA, VULNERABILITY, SUPPORT_BLOCK
  basis?: "source-attack" | "target-max-health",  // BLEED and stacked POISON: what `rate` is a share of (default source-attack), see RateBasis
  damageType?: DamageType,    // MARK and VULNERABILITY (required): amplified damage type
  maxStacks?: number,         // MARK and BLEED (required): stack cap; on POISON, makes it a stacked poison
  stacks?: number,            // MARK, BLEED and stacked POISON: stacks applied per trigger (default 1)
  stackMultiplier?: number,   // Stacked POISON (required, > 0): the tick is multiplied by it at each stack (2: 3%, 6%, 12%)
  ignoresImmunity?: boolean,  // Stacked POISON: laid through a damage-over-time immunity (resistance still rolls)
  probability?: number,       // 0-1 chance to apply effect on hit; omit for guaranteed application
  triggeredDebuff?: {         // Optional debuff applied on effect hit (not on STUNT and the control effects)
    debuffType: BuffType,
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

**BattlefieldDto** (mechanics: ARCHITECTURE, Battlefield):

```typescript
{
  name: string, duration: number,  // integer >= 1
  element?: Element,               // terrain read by terrainBonus
  allies?: { alterations?: BattlefieldAlterationDto[], healRate?: number, damageSharing?: { rate: number, maxShareRate: number }, decoys?: { count: number, chance: number } },
  enemies?: { alterations?: BattlefieldAlterationDto[], damage?: { rate: number, damageType: DamageType }, energySurcharge?: number },
  revival?: { rate: number, withinTurns: number },
  legacy?: { duration: number, empowerment?: { name: string, rate: number } }
}
// BattlefieldAlterationDto: { type: BuffType, rate: number, polarity: "buff" | "debuff", perLivingAlly?: { maxRate } }
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

**Response** (`FightResult`): an object `{ [stepNumber]: Step }`. Step `0` is always `fight_start`; the others are numbered from 1. Types: @packages/combat-engine/src/fight/core/fight-simulator/@types/ (`step.ts` holds the `StepKind` enum).

`CardInfo` identifies a card. `name?` carries the generating skill name on `attack`, `special_attack`, `healing`, `buff`, `debuff`, `targeting_override`, `shield_applied`. `powerId?` appears on `buff`, `debuff`, `healing`, `buff_removed`, `debuff_removed`, `targeting_override`, `targeting_reverted` when the skill belongs to a composite power.

| `kind` | Fields | Emitted |
|---|---|---|
| `fight_start` | `cards: { card, maxHealth }[]` | Step 0; every card of both decks in deck order (player 1 first). The only place a never-hit card reports its max health |
| `attack`, `special_attack` | `name?`, `attacker`, `damages: { defender, damage, isCritical, dodge, remainingHealth, shieldAbsorbed?, survived?, survivedSkillName?, consumedBleedStacks? }[]`, `energy` | A card attacks. `damage` is the total dealt; `shieldAbsorbed` is the part eaten by the shield (absent without shield) — a consumer tracking the shield from `shield_applied` needs it to decrement the buffer. `consumedBleedStacks`: stacks consumed by a `bleedDetonation` or a `BLEED_DETONATION` skill |
| `special_stance` | `name`, `caster`, `energy` (0) | A STANCE special is cast; no `damages`. Followed, when present, by `stance_started`, `buff`, `debuff`, `shield_applied`, `concealment_started` |
| `healing` | `name?`, `source`, `heal: { target, healed, remainingHealth }[]`, `energy`, `powerId?` | A card heals |
| `buff` / `debuff` | `name?`, `source`, `alterations: { target, kind, value, remainingTurns }[]`, `energy`, `powerId?` | An alteration is applied |
| `buff_removed` / `debuff_removed` | `source`, `eventName`, `removed: { target, kind, value }[]`, `powerId?` | A skill end event removes event-bound alterations |
| `buff_expired` / `debuff_expired` | `card`, `expired: { kind, value }[]` | Turn end, duration reached 0 |
| `buff_transferred` | `name`, `source`, `target`, `alterations: { kind, value, remainingTurns }[]` | BUFF_TRANSFER moved buffs (absent if none or nobody targeted); a permanent buff reports a null duration |
| `status_change` | `card`, `status: dead \| poison \| burn \| freeze \| stunt \| bleed \| hypothermia \| entangle`, `stacks?` | After an attack: status applied or card dead; `stacks` (bleed) = count after application |
| `state_effect` | `type`, `card`, `damage`, `remainingTurns`, `remainingHealth`, `remainingStacks?` | Turn end, each ticking status. Bleed: `damage` = sum of stacks, `remainingTurns` = until the last stack expires |
| `effect_removed` | `source`, `eventName`, `removed: { target, effectType }[]` | End event removes event-bound status effects |
| `mark_applied` | `card`, `damageType`, `stacks` | Elemental mark applied (absent at the stack cap) |
| `regenerated` | `card`, `healed`, `remainingHealth` | Turn end, non-zero regeneration heal (clamped at max health) |
| `shield_applied` | `name?`, `source`, `targets: { target, points }[]` | Shield applied |
| `shield_broken` / `shield_expired` | `card` | Points depleted mid-damage / duration reached 0 at turn end |
| `survived` | `name`, `card` | Right after a SURVIVE skill intercepts a fatal blow (card left at 1 HP) |
| `damage_mitigated` | `name`, `card` | DAMAGE_REDUCTION removed a share of a hit, before the shield absorbs the rest |
| `executed` | `name`, `attacker`, `card` | Right after the attack step, per defender finished by an `execution`; then `survived` if SURVIVE held 1 HP, else the attack `status_change: dead` |
| `stance_started` | `name`, `card`, `remainingTurns` | A special or STANCE skill opens a stance |
| `stance_ended` | `name`, `card` | Turn end, stance duration ran out (or an `endsStance` attack closed it) |
| `concealment_started` | `name`, `card`, `remainingTurns?` | CONCEALMENT hides its owner (right after `fight_start` on `fight-start`); no `remainingTurns` = until it attacks |
| `concealment_ended` | `name`, `card`, `reason: attacked \| expired` | Right after the attack step of the first attack that targets somebody, or at turn end |
| `protection_started` | `name`, `card` (guardian), `protectedCard`, `remainingTurns` | PROTECTION puts the guardian in front of an ally |
| `protection_ended` | `card`, `protectedCard` | Turn end, protection ran out |
| `attack_intercepted` | `card` (guardian), `protectedCard` | Per hit the guardian took; follows the `attack` step whose `defender` is the guardian |
| `transformation_started` | `name`, `card`, `remainingTurns` | TRANSFORMATION fires |
| `transformation_ended` | `name`, `card`, `healthCost`, `remainingHealth` | Turn end, after the health cost is charged (0 without cost) |
| `targeting_override` | `name?`, `source`, `previousStrategy`, `newStrategy`, `powerId?` | A targeting override activates |
| `targeting_reverted` | `source`, `eventName`, `revertedStrategy`, `restoredStrategy`, `powerId?` | An end event removes a targeting override |
| `weak_point_revealed` | `name`, `source` (revealer), `card`, `remainingTurns?` | A weak point is revealed (absent duration: never expires) |
| `weak_point_ended` | `name`, `card`, `reason: struck \| dodged \| expired` | A consumable one used by an attack, or a timed one at turn end |
| `analysis_charged` | `name`, `source`, `card`, `charges` | ANALYSIS lays a charge |
| `battlefield_started` | `name`, `source`, `remainingTurns` | A battlefield is laid; then `revived`, `buff`, `debuff` |
| `battlefield_extended` | `name`, `source`, `extraTurns` | Its caster fell under it (legacy) |
| `battlefield_ended` | `name`, `card` | Turn end, it ran out on that card. Its heals and hits are `healing` / `attack` steps |
| `revived` | `name`, `source`, `card`, `remainingHealth` | A dead ally comes back |
| `attack_empowered` | `name`, `source`, `cards` | Legacy: their next attack is empowered |
| `damage_shared` | `name`, `card`, `shares: { card, damage, remainingHealth }[]` | After the hit, the share each partner carried |
| `energy_gained` | `name`, `card`, `amount`, `energy` | ENERGY_GAIN (absent on a full gauge) |
| `effect_cleansed` | `name`, `source`, `card`, `effectType` | SUPPORT removed a status |
| `action_failed` | `card`, `cause: entangle` | Instead of the action an entanglement made fail |
| `energy_drained` | `card`, `amount`, `energy` | ENERGY_DRAIN (absent on an empty gauge) |
| `vulnerability_applied` / `vulnerability_ended` | `card`, `damageType`, `rate`, `remainingTurns` / `card`, `damageType` | VULNERABILITY laid / turn end, ran out |
| `support_blocked` / `support_block_ended` | `card`, `remainingTurns` / `card` | SUPPORT_BLOCK laid / turn end, ran out |
| `decoy_struck` | `name`, `card`, `remainingDecoys` | A decoy took the hit aimed at `card` (the hit reports a dodge) |
| `fight_end` | winner report | End of the fight |

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
- `protected-ally`: the ally the caster stands in front of (see `PROTECTION`); nobody without a protection or if that ally is dead; resolves even when the caster is dead (guardian parting gift). `ProtectedAllyStrategy`
- `linked-ally`: Targets a specific ally by ID (requires `targetCardId`); built inline in controller with `AlliedCardByIdStrategy`
- `first-bleeding-enemy`: Targets the first living enemy, in deck order, carrying at least `stackThreshold` bleed stacks; nobody otherwise. Built with `FirstBleedingEnemyStrategy`
- `fastest-ally`: the caster's fastest living ally (speed buffs included, caster excluded, ties in deck order); resolves even when the caster is dead. `FastestAllyStrategy`
- `last-dodged-attacker`: the card whose attack the `targetCardId` card dodged last (`FightingCard.lastDodgedAttacker`); nobody if it cannot be targeted. Pairs with `dodge`. Built with `LastDodgedAttackerStrategy`
- `lowest-health-ally`: like `most-wounded-ally` without threshold: nobody only when the caster stands alone
- `random-enemies`: specials only, `targetCount` targetable enemies drawn at each launch (all when fewer), in deck order
- `most-wounded-ally`: the caster's ally in the worst shape below `activationCondition.threshold` (required, never a `targetCardId`), on the live board; caster and dead excluded, nobody when every ally is above, ties in deck order. `MostWoundedAllyStrategy`

### DodgeStrategy

- `simple-dodge`: Uses agility stat for dodge calculation
- `random-dodge`: Random dodge chance

### TriggerEvent

Mechanics and ordering: see [ARCHITECTURE.md](ARCHITECTURE.md) (Skills and Events, Death Cascade, Reactive Events). `targetCardId` is required by `ally-death`, `enemy-death`, `ally-health-below`, `damage-taken` and `dodge` only.

- `turn-end`, `turn-start` (before the action and the special check; a card skipping its turn never sees it), `fight-start` (once, right after `fight_start`)
- `next-action`: replaces the plain attack on the next action (skipped when the special is ready)
- `ally-death` / `enemy-death` (the dead card id), `any-ally-death`, `self-death` (own id implied, before the survivors answer), `enemy-bleed-death`, `poisoned-enemy-death`, `enemy-killed` (living killer; optional `activationCondition.threshold` on the victim health before the blow)
- `survived`: after the owner survives a fatal blow through SURVIVE
- `dormant`: requires `activationEvent`, `activationTargetCardId`, `replacementEvent` (its target id resolved from the killer)
- `ally-health-below` / `any-ally-health-below`: edge-triggered downward crossing of `activationCondition.threshold` by one ally (itself with its own id) / any ally but the owner (the field belongs to the trigger alone)
- `damage-taken`: every landed hit on the monitored card; `dodge`: every dodge of it, evasion and decoys included
- `bleed-stacks-applied`: once per fight per skill, when the stacks the owner **laid** reach `stackThreshold`
- `enemy-attack`, `after-attack`, `transformed`, `enemies-analysed`, `ally-skill-used` (allies of a card whose action is not its plain attack)

### SpecialKind

- `ATTACK`: deals damage
- `HEALING`: heals
- `STANCE`: strikes nobody. `stanceActivation` required; optional `statAlterations`, `shieldApplication`, `concealment`. Being no attack, it does not lift a concealment. `damages`, `rate`, `hits`, `targetingStrategy`, `effect`, `energyRefund`, `markedTargetBonus`, `bleedStackBonus`, `concealedBonus` and `execution` are refused (400). Reported as `special_stance`; the gauge empties as for any special

### SkillKind

Skills marked *passive* have no `event` and no `targetingStrategy` and emit no step; they are extracted from `others[]` and stored on the card.

- `HEALING`: heals; `healBasis`, `activationLimit`, `endEvent` supported
- `BUFF`: temporary stat boost (`buffType`, `duration` required; 0 = permanent or event-bound)
- `CONDITIONAL_ATTACK`: attack on an event, through the regular attack path. Optional add-ons: `splash`, `onLowHealthAfterHit`, `hitAlterations`, `execution`, `bleedDetonation`, `defensePenetration`, `energyCost`, `stanceActivation`, `endsStance`, `requiresUndamaged`, `interval`
- `TARGETING_OVERRIDE`: overrides the card attack targeting (requires `terminationEvent`)
- `SHIELD`: no `event`; fires when health crosses `activationCondition.threshold` downward (edge-triggered, rearms on recovery)
- `SURVIVE`: *passive*, `name` only; absorbs one fatal blow, leaves 1 HP
- `DAMAGE_REDUCTION`: *passive*; `rate` in `]0, 1]` = share of each hit removed; optional per-hit `probability`. Applies before the shield; status ticks bypass it
- `PROTECTION`: requires `duration`, `event`, `targetingStrategy`; covers the first card targeted; recasting refreshes or moves it. Dead or unseen (concealed) guardian protects nobody. `activationLimit` supported
- `DODGE_BONUS_DENIAL`: *passive*; a bleeding defender dodges its owner with base agility minus debuffs
- `BLEED_STACK_SCALING`: *passive*; `rate` per bleed stack on any living card, capped at `maxRate` (e.g. `0.02` / `0.3`). Heals unaffected
- `BLEED_EMPOWERMENT`: *passive*; requires `requiresStance` and `rate`. While the stance runs, every bleed the owner lays adds `extraStacks` (default 0) and uses `rate`; `duration`, `basis`, `triggeredDebuff` replace the effect values. Still capped by `maxStacks`
- `BLEED_DETONATION`: no `targetingStrategy`; requires `rate`. When its `event` fires (meant for `self-death` + `requiresStance`), every living bleeding card of both teams takes `rate × source attack` once as real damage (defense ignored) and loses its stacks. Reported as an `attack` step; nothing when nobody bleeds
- `LOW_HEALTH_TARGET_BONUS`: *passive*; requires `rate` > 0 and `activationCondition.threshold` in `]0, 1]`. × `1 + rate` against a defender strictly under the threshold before the hit. Status effects, heals and `BLEED_DETONATION` unaffected
- `BUFF_TRANSFER`: requires `event`, `targetingStrategy`, `buffType`; hands every buff of that type to the first card targeted, keeping value, remaining duration and `stackId`. Nothing to give or nobody targeted: no step. Emits `buff_transferred`
- `STANCE`: opens `stanceActivation` on its owner when its `event` fires; no `targetingStrategy`. Optional `statAlterations` and `rampingChance`. Emits `stance_started`, then `stance_ended` at turn end
- `CONCEALMENT`: hides its owner from every enemy targeting (area attacks included) unless the attacker holds a `revealsConcealed` stance; allies still target it. `duration` optional (integer >= 0): without it, until the card attacks somebody; ends at the first attack that targets somebody, even dodged (a `concealedBonus` still applies to every hit of it). Accepts `stanceActivation`, `interval` cooldown, `requiresUndamaged`. On `next-action` it takes the action (no attack that turn). Emits `concealment_started` / `concealment_ended`
- `TRANSFORMATION`: no `event` or `targetingStrategy`; requires `duration` and an `activationCondition` threshold; applies `statAlterations`, optional `lifestealRate`, `statusImmunity`, `endCostRate` (never below 1 HP). Optional `stanceActivations`, `poisonSurge`. Once per fight
- `POISONED_ENEMY_AGILITY`: *passive*; requires `rate` and `maxRate` (> 0): agility + `rate` of base agility per living card carrying a stacked poison its owner laid, capped at `maxRate`
- `REAL_DAMAGE`: requires `rate`, `event`, `targetingStrategy`; optional `basis` (RateBasis, default source-attack), `requiresStance`. Deals `rate × basis` as real damage (no dodge, defense, shield or reduction), reported as an `attack` step
- `AFFLICTION`: requires `effect`, `event`, `targetingStrategy`; lays the effect on every target without an attack (`status_change` steps). Optional `requiresStance`
- `ANALYSIS`: requires `event`, `maxStacks`, `effect`; no `targetingStrategy`. One charge per event on `lastAttacker`, the filling charge lays `effect`
- `AFTERSHOCK`: requires `event`, `damages`; optional `effect`, `requiresStance`. Strikes the neighbors of `attackTarget` (not itself)
- `WEAK_POINT_LEGACY`: requires `event`, `rate`; optional `requiresStance`. Makes the weak points of its owner permanent, hits through them x (1 + rate)
- `SUPPORT`: requires `event`, `targetingStrategy` and a `shield`, `cleanse` or `alterations`; optional `interval`. On `next-action` it takes the action (charges the special) when it targets somebody, else the card attacks and keeps the cooldown
- `ENERGY_GAIN`: requires `event`, `amount`; no targeting: fills its owner gauge, never past the special cost
- `ATTACKER_INSIGHT`: *passive*; `accuracyRate`, `agilityRate` of the base stats against an enemy that already attacked
- `SPECIAL_ECHO`: requires `event`; no targeting; optional `requiresStance`. Casts the owner ATTACK special once more (400 on another kind), gauge untouched

### RateBasis

What a `HEALING` `healBasis` or a `BLEED` `basis` is a share of; default `source-attack`.

- `source-attack`: the caster attack
- `target-max-health`: the receiver maximum health (same amount whoever casts; the bleed reads it when the stack is laid)

An unknown basis throws. Heals are capped at the target maximum health.

### StatusCategory

Used by `stanceActivation.immunities`: `control` (`FREEZE`, `STUNT`, `ENTANGLE`) and `damage-over-time` (`POISON`, `BURN`, `BLEED`, `HYPOTHERMIA`). An elemental `MARK` is not a status and no immunity refuses it.

### Effect

Mechanics: see ARCHITECTURE (Status Effects, Control).

- `POISON`, `BURN`: damage over time; `POISON` with `maxStacks` is a stacked poison
- `FREEZE`, `STUNT`: skip the action, +20% damage taken; STUNT lasts `2 × level − 1` turns, no tick
- `BLEED`: stacked damage over time, each stack on its own `duration`; `rate` of `basis`
- `WEAK_POINT`: reveals a weak point; `rate` unused; `duration` goes in `weakPoint` (400 outside)
- `HYPOTHERMIA`: `rate` of the target max health per turn for `duration` turns
- `MARK`: elemental mark, `rate` per stack on `damageType`, up to `maxStacks`, never expires
- `ENTANGLE`: control status, the next offensive action fails on `rate`
- `ENERGY_DRAIN`: takes `rate` (integer >= 1) special energy
- `VULNERABILITY`: `1 + rate` times the `damageType` damage for `duration` turns
- `SUPPORT_BLOCK`: no heal or buff from the allies for `duration` turns; `rate` unused

ENTANGLE, ENERGY_DRAIN, VULNERABILITY and SUPPORT_BLOCK refuse a `triggeredDebuff` (400).

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

DTOs use `class-validator` decorators (`@IsString`, `@IsNumber`, `@IsEnum`, `@ValidateNested`, `@IsOptional`, `@ArrayMinSize(1)` / `@ArrayMaxSize(5)` for decks…). Errors return 400 with detailed messages.

## Error Handling

- **400 Bad Request**: Validation failures from `ValidationPipe`, plus the domain checks the controller converts explicitly — composite power consistency (`validatePowerIdConsistency`), the DAMAGE_REDUCTION rate range, an alteration stack budget given by halves (`stackId` without its cap, or the reverse), and a field reserved to some skill kinds carried by another (`KIND_ONLY_FIELDS` in `fighting-card-factory.ts` is the list; effects have their own guards)
- **500 Internal Server Error**: Runtime errors (e.g., unknown skill kind, missing buff properties)
- No custom error handling middleware - uses NestJS defaults
