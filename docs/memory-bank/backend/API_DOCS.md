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
  concealment?: { duration: number },     // STANCE only (400 otherwise): conceals the caster for `duration` turns (integer >= 0), see CONCEALMENT
  buffApplication?: BuffApplicationDto,   // Optional buff application (for special attacks)
  shieldApplication?: ShieldApplicationDto,  // Optional shield application (independent targeting)
  markedTargetBonus?: {                   // Optional damage bonus against an already marked target
    damageType: "PHYSICAL" | "FIRE" | "WATER" | "EARTH" | "AIR",
    multiplier: number                    // Must be > 0, e.g. 1.3 for +30%
  },
  stanceActivation?: {                    // Optional: opens a named stance on the caster
    name: string,                         // Stance name that skills reference with requiresStance
    duration: number,                     // Turns it runs; re-casting refreshes instead of stacking
    immunities?: ("control" | "damage-over-time")[],  // Status categories the caster refuses while it runs
    revealsConcealed?: boolean            // While it runs, the caster's attacks can target concealed enemies (their concealment is not lifted)
  },  // Required for STANCE
  energyRefund?: {                        // ATTACK only: energy kept after the special instead of emptying the gauge
    amount: number,                       // Integer >= 1, energy the caster keeps (shown in the special_attack step energy)
    minAccuracyMargin: number             // >= 0: caster accuracy minus the agility of the primary target (first defender struck) must be strictly greater
  },
  bleedStackBonus?: {                     // Optional: boosts one damage type when the target already bleeds
    minStacks: number,                    // Integer >= 1: bleed stacks the target must carry before the hit
    damageType: "PHYSICAL" | "FIRE" | "WATER" | "EARTH" | "AIR",  // Only this composition is multiplied
    multiplier: number                    // Must be > 0, e.g. 1.2 for +20%
  },
  concealedBonus?: {                      // Optional: boosts one damage type when the attacker strikes from concealment (see CONCEALMENT)
    damageType: "PHYSICAL" | "FIRE" | "WATER" | "EARTH" | "AIR",  // Only this composition is multiplied
    multiplier: number                    // Must be > 0, e.g. 1.5 for +50%
  },
  execution?: { threshold: number }       // ATTACK only (400 on STANCE): see OtherSkillDto.execution — applied after the last hit
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
  effects?: EffectDto[],            // Status effects (poison, burn, freeze, stunt, mark, bleed)
  bleedStackBonus?: ...,            // Same as SpecialDto.bleedStackBonus
  concealedBonus?: ...              // Same as SpecialDto.concealedBonus
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
  kind: "HEALING" | "BUFF" | "CONDITIONAL_ATTACK" | "TARGETING_OVERRIDE" | "SHIELD" | "SURVIVE" | "DAMAGE_REDUCTION" | "PROTECTION" | "DODGE_BONUS_DENIAL" | "BLEED_STACK_SCALING" | "STANCE" | "BLEED_EMPOWERMENT" | "BLEED_DETONATION" | "CONCEALMENT" | "LOW_HEALTH_TARGET_BONUS" | "BUFF_TRANSFER",
  name: string,
  rate?: number,                // Optional — not required for TARGETING_OVERRIDE or SURVIVE; required for SHIELD and DAMAGE_REDUCTION (share of incoming damage removed, in ]0, 1]); required for BLEED_STACK_SCALING (attack bonus per bleed stack, > 0); required for BLEED_EMPOWERMENT (bleed rate used during the stance, > 0); required for BLEED_DETONATION (share of the source attack dealt to each bleeding card, > 0); required for LOW_HEALTH_TARGET_BONUS (damage bonus against a weakened target, > 0)
  maxRate?: number,             // BLEED_STACK_SCALING only (required, > 0): cap of the attack bonus
  stanceActivation?: { name: string, duration: number, immunities?: ("control" | "damage-over-time")[] },  // STANCE (required): stance opened on the owner when its event fires. CONCEALMENT (optional): stance opened with the concealment. CONDITIONAL_ATTACK (optional): stance opened on the owner only when the attack fires (somebody targeted, energy paid), reported as `stance_started` after the attack step
  stackThreshold?: number,      // Integer >= 1. Required when event=bleed-stacks-applied (bleed stacks the owner must have laid) and when targetingStrategy=first-bleeding-enemy (bleed stacks the target must carry)
  extraStacks?: number,         // BLEED_EMPOWERMENT only (integer >= 0, default 0): stacks each bleed of the owner lays on top of its own during the stance
  basis?: "source-attack" | "target-max-health",  // BLEED_EMPOWERMENT only: replaces the basis of the bleeds laid during the stance (see RateBasis)
  triggeredDebuff?: { debuffType, debuffRate, duration, probability, stackId?, maxStacks?, terminationEvent? },  // BLEED_EMPOWERMENT only: same shape as EffectDto.triggeredDebuff; replaces the debuff rolled when a bleed lands during the stance
  probability?: number,         // DAMAGE_REDUCTION only: per-hit roll (0-1); omit for a permanent reduction
  targetingStrategy?: TargetingStrategy,  // Not required for SHIELD, SURVIVE, DAMAGE_REDUCTION, DODGE_BONUS_DENIAL, BLEED_STACK_SCALING, BLEED_EMPOWERMENT, STANCE, BLEED_DETONATION, CONCEALMENT or LOW_HEALTH_TARGET_BONUS kinds
  event?: "turn-end" | "next-action" | "ally-death" | "ally-health-below" | "any-ally-health-below" | "self-death" | "enemy-bleed-death" | "bleed-stacks-applied" | "turn-start" | "damage-taken" | "fight-start" | "enemy-killed",  // When skill triggers; NOT required for SHIELD, SURVIVE, DAMAGE_REDUCTION, DODGE_BONUS_DENIAL, BLEED_STACK_SCALING, BLEED_EMPOWERMENT or LOW_HEALTH_TARGET_BONUS kinds
  targetCardId?: string,        // Required when event=ally-death, ally-health-below or damage-taken (never for any-ally-health-below): id of the monitored card
  requiresStance?: string,      // Skill only fires while its owner holds that stance (see SpecialDto.stanceActivation); required for BLEED_EMPOWERMENT
  // SHIELD-specific fields:
  activationCondition?: { type?: "health-threshold" | "ally-presence" | "probability", operator?: "below" | "above", threshold?: number, allyName?: string, probability?: number },  // Health ratio threshold (0–1) for SHIELD/ally-health-below/any-ally-health-below activation, most-wounded-ally targeting and the LOW_HEALTH_TARGET_BONUS target health (required there, in ]0, 1]); type "probability" gates any triggered ALTERATION skill on a per-event roll. On `any-ally-health-below` the field belongs to the trigger alone and is NOT reused as the skill own activation condition — it says an ally fell low, not that the caster did
  buffType?: "attack" | "defense" | "agility" | "accuracy" | "speed" | "criticalChance" | "regeneration" | "resistance",  // Required if kind=BUFF or BUFF_TRANSFER (type of the buffs handed over)
  duration?: number,            // Required if kind=BUFF (0 = infinite: permanent or event-bound). CONCEALMENT: optional integer >= 0, omitted = until the card attacks. BLEED_EMPOWERMENT: optional integer >= 1 (400 otherwise), turns each stack laid during the stance bleeds
  stackId?: string,             // ALTERATION (buff or debuff): name of the stack pile it counts against, shared by the alterations of the same polarity carrying that id
  maxStacks?: number,           // Cap of that pile (>= 1); goes with stackId, both or neither (400). An application at the cap is refused and emits no step
  debuffMaxStacks?: number,     // Former name of maxStacks, still accepted
  terminationEvent?: string,    // Event name that removes this skill's buff/targeting override when fired
  activationLimit?: number,     // Max activations (>=1) before skill lifecycle ends — supported for HEALING, TARGETING_OVERRIDE and CONDITIONAL_ATTACK kinds. On CONDITIONAL_ATTACK only an attack that struck somebody spends one, so `activationLimit: 1` on `ally-health-below` is "once per fight under a health threshold": a heal back above it and a second drop do not fire it again
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
  // CONDITIONAL_ATTACK fields:
  damages?: DamageCompositionDto[],  // Required unless bleedDetonation is set
  hits?: number,                // Not allowed with bleedDetonation (400)
  interval?: number,            // CONDITIONAL_ATTACK and CONCEALMENT only (400 on any other kind). Turns between two activations (integer >= 1); omit for a skill whose cadence is driven by its event (ally-health-below, damage-taken, turn-start). CONCEALMENT accepts it too, as the cooldown of a dive
  amplifier?: number,
  effect?: EffectDto,
  comboFinisher?: DamageCompositionDto[],
  comboFinisherEffects?: EffectDto[],  // Effects applied on the finisher hit only
  defensePenetration?: number,  // In [0, 1] (400 outside): share of the defender defense the attack ignores — defense used = actualDefense × (1 − defensePenetration); default 0
  energyCost?: number,          // Integer >= 1: the attack does not fire below that special energy, and spends it only when it strikes somebody
  endsStance?: boolean,         // CONDITIONAL_ATTACK only (400 on any other kind, and without `requiresStance`): once the attack fired (somebody targeted), closes its `requiresStance` on its owner and reports `stance_ended` — so it fires once per stance
  requiresUndamaged?: boolean,  // CONDITIONAL_ATTACK and CONCEALMENT only (400 on any other kind): the skill never fires when its owner lost health since the start of its previous action — attacks, status ticks, bleed detonation and transformation cost all count; a hit fully absorbed by a shield or dodged does not. Combined with `interval`, both must hold, and a turn blocked by this condition does not reset the cooldown. On `next-action` the card then makes its plain attack
  hitAlterations?: {           // CONDITIONAL_ATTACK only (400 on any other kind): alterations left on every defender the main attack hit — once per defender however many hits landed, none on a dodged hit or a defender the hit killed, a guardian that intercepted getting them in place of its ward. No targeting of their own. Debuffs go through resistance. Applied after the hit effects and before `onLowHealthAfterHit` and the splash; reported as a `buff` and/or `debuff` step named after the skill, right after the attack step (turn-start, next-action and reactive paths alike)
    type: BuffType,
    rate: number,
    duration: number,
    polarity: "buff" | "debuff",
    terminationEvent?: string
  }[],
  execution?: { threshold: number },  // CONDITIONAL_ATTACK only (400 on any other kind); threshold in ]0, 1[ (400 outside). Once the main attack is over, every defender it hit (not dodged) and left alive strictly under `threshold` of its health loses all its remaining health as real damage — shield and damage reduction ignored. A fatal blow like any other: an unconsumed SURVIVE holds the defender at 1 HP (`survived` step, then its `survived` skills). Applied before `hitAlterations`, `onLowHealthAfterHit` and the splash, so an executed defender gets none of them. The death runs the usual cascade with the attacker as killer (`status_change: dead`, `ally-death`, `enemy-death`, `enemy-killed`). Reported as an `executed` step right after the attack step
  bleedDetonation?: { ratePerStack: number },  // > 0: consumes every bleed stack of the target and hits for ratePerStack × consumed stacks of the attack, as a PHYSICAL composition replacing `damages`
  splash?: {                    // Secondary strike after the main one, on the zone centered on the primary target: that target and its two deck neighbors (living only). Centered on the card the attack was aimed at, even when a guardian intercepted it. Runs through the regular attack pipeline (dodge, protection, shield) and is reported as its own `attack` step right after the main one. Fires only when the main strike targeted somebody
    name: string,               // Name of the splash attack step
    damages: DamageCompositionDto[],  // Min 1 entry
    effects?: EffectDto[]
  },
  onLowHealthAfterHit?: {       // Once the main hit landed (not dodged), debuffs its defender when it is left alive under `threshold` of its health — being under it after the hit is enough, the hit need not cross it. Read before the splash lands. Resistance applies. Reported as a `debuff` step named `name`, right after the main attack step
    name: string,
    threshold: number,          // Health ratio in ]0, 1]
    debuffs: { type: BuffType, rate: number, duration: number }[]  // Min 1; rate > 0, duration integer >= 1
  }
}
```

**EffectDto**:

```typescript
{
  type: "POISON" | "BURN" | "FREEZE" | "STUNT" | "MARK" | "BLEED",
  rate: number,               // Damage coefficient per tick (unused for STUNT); amplification per stack for MARK; damage of each stack per turn for BLEED
  level: 1 | 2 | 3,           // Required except for MARK and BLEED. Duration: STUNT = 2*level-1 turns; others = level 1=1, 2=3, 3=5 ticks
  duration?: number,          // BLEED only (required, >= 1): turns each stack bleeds
  basis?: "source-attack" | "target-max-health",  // BLEED only: what `rate` is a share of (default source-attack), see RateBasis
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
| `status_change` | `card`, `status: dead \| poison \| burn \| freeze \| stunt \| bleed`, `stacks?` | After an attack: status applied or card dead; `stacks` (bleed) = count after application |
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
- `protected-ally`: Targets the ally the caster is currently standing in front of (see `PROTECTION`). Needs no `targetCardId` and no threshold — the protection itself says who, and its absence says nobody, so a skill using it is silent outside the power that opened the protection. Returns nothing if that ally is dead; still resolves when the **caster** is dead, which is what a guardian parting gift needs. Built with `ProtectedAllyStrategy`
- `linked-ally`: Targets a specific ally by ID (requires `targetCardId`); built inline in controller with `AlliedCardByIdStrategy`
- `first-bleeding-enemy`: Targets the first living enemy, in deck order, carrying at least `stackThreshold` bleed stacks; nobody otherwise. Built with `FirstBleedingEnemyStrategy`
- `fastest-ally`: Targets the caster's living ally with the highest speed, speed buffs included; the caster is excluded and ties keep deck order. Like `protected-ally`, it still resolves when the **caster** is dead, which is what a legacy left on death needs. Built with `FastestAllyStrategy`
- `most-wounded-ally`: Targets the caster’s ally in the worst shape among those below `activationCondition.threshold`, resolved against the live board at each launch (requires the threshold, never a `targetCardId`). Excludes the caster and the dead; targets nobody when every ally is above the threshold. Ties keep deck order, so the choice is reproducible. Built with `MostWoundedAllyStrategy`

### DodgeStrategy

- `simple-dodge`: Uses agility stat for dodge calculation
- `random-dodge`: Random dodge chance

### TriggerEvent

Mechanics behind each event: see [ARCHITECTURE.md](ARCHITECTURE.md) (Death Cascade, Reactive Events).

- `turn-end`: end of turn
- `next-action`: replaces the card plain attack on its next action (skipped when the special is ready)
- `turn-start`: on the card about to act, before its action and its special check; adds to the action. A card skipping its turn never sees it. Only attack skills that struck are reported, before the action steps
- `fight-start`: once on every card, right after `fight_start`, before the first action. No `targetCardId`
- `ally-death` / `enemy-death`: when a specific card dies; require `targetCardId` (the dead card id)
- `self-death`: on the card that just died (own id implied). Runs before the survivors answer, so what the card leaves lands first. Pairs with `protected-ally` or `fastest-ally`
- `enemy-bleed-death`: on the opposing survivors when a card dies from its bleed tick. No `targetCardId`. Runs after `enemy-death`
- `enemy-killed`: on the living killer only. Optional `activationCondition { type: "health-threshold", threshold }` in `]0, 1]` restricts it to victims strictly under that health ratio before the blow. A status tick has no killer. Runs last in the cascade
- `survived`: after the owner survives a fatal blow through SURVIVE
- `dormant`: starts inactive; requires `activationEvent`, `activationTargetCardId`, `replacementEvent` (its target id resolved from the killer at activation)
- `ally-health-below`: edge-triggered when one monitored ally crosses `activationCondition.threshold` downward; requires `targetCardId` and the threshold. A card monitors itself with its own id. A `CONDITIONAL_ATTACK` on it uses the regular attack path (its own `targetingStrategy`, `hits`, `splash`, …) and must say `last-attacker-of-ally` itself to counter its aggressor; cards it kills run the full death cascade
- `any-ally-health-below`: same for any ally except the owner, each ally edge-triggered on its own. Requires the threshold, never a `targetCardId`; the field belongs to the trigger alone. Pairs with `most-wounded-ally`
- `damage-taken`: on every landed hit on the monitored card (not edge-triggered); requires `targetCardId`; `last-attacker-of-ally` then resolves to the attacker
- `bleed-stacks-applied`: once per fight, after the owner attack that brings the stacks it has **laid** to `stackThreshold` (a jump over it still fires). Stacks lost at the cap or refused do not count. Each skill on the event has its own once-flag

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
- `STANCE`: opens `stanceActivation` on its owner when its `event` fires; no `targetingStrategy`. Emits `stance_started`, then `stance_ended` at turn end
- `CONCEALMENT`: hides its owner from every enemy targeting (area attacks included) unless the attacker holds a `revealsConcealed` stance; allies still target it. `duration` optional (integer >= 0): without it, until the card attacks somebody; ends at the first attack that targets somebody, even dodged (a `concealedBonus` still applies to every hit of it). Accepts `stanceActivation`, `interval` cooldown, `requiresUndamaged`. On `next-action` it takes the action (no attack that turn). Emits `concealment_started` / `concealment_ended`
- `TRANSFORMATION`: no `event` or `targetingStrategy`; requires `duration` and an `activationCondition` threshold; applies `statAlterations`, optional `lifestealRate`, `statusImmunity`, `endCostRate` (never below 1 HP). Once per fight

### RateBasis

What a `HEALING` `healBasis` or a `BLEED` `basis` is a share of; default `source-attack`.

- `source-attack`: the caster attack
- `target-max-health`: the receiver maximum health (same amount whoever casts; the bleed reads it when the stack is laid)

An unknown basis throws. Heals are capped at the target maximum health.

### StatusCategory

Used by `stanceActivation.immunities`: `control` (`FREEZE`, `STUNT`) and `damage-over-time` (`POISON`, `BURN`, `BLEED`). An elemental `MARK` is not a status and no immunity refuses it.

### Effect

- `POISON`: Damage over time
- `BURN`: Damage over time
- `FREEZE`: Prevents action for 1-5 turns, increases damage taken by 20%
- `STUNT`: Prevents action for 1-5 turns (2*level-1), increases damage taken by 20%; no damage tick; does not stack with freeze (whichever is active takes precedence)
- `BLEED`: Cumulative damage over time — each application adds `stacks` stacks, each bleeding `rate × source attack` — or `rate × target max health` with `basis: "target-max-health"` — (fixed when applied) per turn for its own `duration`, so stacks applied at different turns expire independently. Capped at `maxStacks`: extra stacks are lost, and an application at the cap emits no step. Cannot be applied to a frozen card, and a freeze pauses it: no damage and no stack duration spent until the card thaws. Refused as a whole by a `damage-over-time` immunity or a won resistance roll (one roll per application). An end event removes only the stacks it bound
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

DTOs use `class-validator` decorators (`@IsString`, `@IsNumber`, `@IsEnum`, `@ValidateNested`, `@IsOptional`, `@ArrayMinSize(1)` / `@ArrayMaxSize(5)` for decks…). Errors return 400 with detailed messages.

## Error Handling

- **400 Bad Request**: Validation failures from `ValidationPipe`, plus the domain checks the controller converts explicitly — composite power consistency (`validatePowerIdConsistency`), the DAMAGE_REDUCTION rate range, and an alteration stack budget given by halves (`stackId` without its cap, or the reverse), and a field reserved to one skill kind carried by another (`KIND_ONLY_FIELDS`: `extraStacks`, `basis`, `triggeredDebuff` for BLEED_EMPOWERMENT, `hitAlterations`, `endsStance` and `execution` for CONDITIONAL_ATTACK, `requiresUndamaged` and `interval` for CONDITIONAL_ATTACK and CONCEALMENT — an `interval` on any other kind used to be ignored silently and is now refused)
- **500 Internal Server Error**: Runtime errors (e.g., unknown skill kind, missing buff properties)
- No custom error handling middleware - uses NestJS defaults

## Factory Functions

DTO enums map to domain objects in `packages/combat-engine/src/fight/http-api/`: `buildTargetingStrategy()` (`targeting-strategy-factory.ts`), `buildDodgeStrategy()` (`dodge-strategy-factory.ts`), `buildTriggerStrategy()` (`trigger-factory.ts`).
