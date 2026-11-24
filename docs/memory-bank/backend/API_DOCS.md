# API Documentation

One unversioned, unauthenticated JSON endpoint on `http://localhost:3000` (`PORT`), in @packages/combat-engine/src/fight/http-api/fight.controller.ts. `ValidationPipe` on `FightController` (`transform`, `whitelist`, `forbidNonWhitelisted`), so the e2e tests, which build the app without `main.ts`, validate as production does.

## POST /fight

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
  cardSelectorStrategy: "player-by-player" | "speed-weighted",
  seed?: number // Integer in [0, 2^32 - 1]: same seed and decks, same fight
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
  regeneration?: number, // Health points restored at each turn end (default 0)
  resistance?: number, // Chance to refuse a status or debuff = resistance / 200 (default 0)
  skills: {
    special: SpecialDto, // Ultimate ability (attack or healing)
    simpleAttack: SimpleAttackDto, // Basic attack
    others: OtherSkillDto[] // Additional skills (healing, buffs)
  },
  behaviors: {
    dodge: "simple-dodge" | "random-dodge"
  },
  image?: string, // Optional card image
  cardDeckIdentity?: string, // Optional identifier
  id: string // Unique card identifier (used for ally-death trigger targeting)
}
```

**SpecialDto**:

```typescript
{
  kind: "ATTACK" | "HEALING" | "STANCE", // STANCE strikes nobody: see SpecialKind
  name: string,
  rate: number, // Damage/healing multiplier
  energy: number, // Energy cost to use special
  hits?: number, // ATTACK only, integer >= 1 (default 1): ARCHITECTURE (Multi-hit special)
  targetingStrategy: TargetingStrategy, // Required except for STANCE (400 if given)
  effect?: EffectDto, // Optional status effect (poison, burn, freeze)
  effects?: EffectDto[], // ATTACK only: more effects, tried after `effect` on every landed hit
  concealment?: { duration: number }, // STANCE only (400 otherwise): conceals the caster for `duration` turns (integer >= 0), see CONCEALMENT
  buffApplication?: BuffApplicationDto, // Optional buff application (for special attacks)
  shieldApplication?: ShieldApplicationDto, // Optional shield application (independent targeting)
  healBasis?: RateBasis, // HEALING only (400 otherwise)
  healOverTime?: { rate, duration }, // HEALING only: ARCHITECTURE (Heal over time)
  markedTargetBonus?: { damageType, multiplier }, // x multiplier (> 0) against a target already marked of that type
  stanceActivation?: { name, duration, immunities?: StatusCategory[], revealsConcealed?: boolean, evasionChance?: number }, // Required for STANCE: stance opened on the caster, ARCHITECTURE (Stance); evasionChance in [0, 1]
  energyRefund?: { amount, minAccuracyMargin }, // ATTACK only, integer amount >= 1, margin >= 0: ARCHITECTURE (Energy refund); amount shown in the special_attack step energy
  // Damage type bonuses: only the `damageType` composition is multiplied (multiplier > 0, 1.2 = +20%)
  bleedStackBonus?: { minStacks, damageType, multiplier }, // target carries >= minStacks (integer >= 1) bleed stacks
  concealedBonus?: { damageType, multiplier }, // attacker strikes from concealment
  execution?: { threshold: number } // ATTACK only (400 on STANCE): see OtherSkillDto.execution — applied after the last hit
  defensePenetration?: number, // ATTACK only (400 on STANCE): see OtherSkillDto.defensePenetration
  undodgeable?: boolean, // ATTACK only (400 on STANCE): no dodge roll and no stance evasion
  battlefield?: BattlefieldDto, // STANCE only (400 otherwise): see ARCHITECTURE (Battlefield)
  targetCount?: number, // Required by random-enemies (integer >= 1)
  adjacentTargetsBattlefield?: BattlefieldDto // ATTACK only: laid on the defenders standing next to each other (2 at least)
}
```

**ShieldApplicationDto**:

```typescript
{
  rate: number, // Shield points = rate * maxHealth of target
  duration: number, // Number of turns shield lasts
  targetingStrategy: TargetingStrategy // Cannot be targeted-card
}
```

**SimpleAttackDto**:

```typescript
{
  name: string,
  damages: DamageCompositionDto[], // Min 1 entry — multi-type damage compositions
  targetingStrategy: TargetingStrategy,
  effects?: EffectDto[],
  hitAlterations?: ..., // Same as OtherSkillDto.hitAlterations
  bleedStackBonus?: ..., concealedBonus?: ..., // Same as SpecialDto
  // Any attack (simple, multiple, special): x multiplier, every type unless damageType
  frozenTargetBonus?: { multiplier: number, damageType?: ... }, // against an already frozen defender
  battlefieldBonus?: { element: Element, multiplier: number, damageType?: ... } // while the attacker or the defender stands in a battlefield of that element
}
```

**MultipleAttackDto** (alternative to `simpleAttack`, for multi-hit attacks):

```typescript
{
  name: string,
  hits: number,
  damages: DamageCompositionDto[], // Min 1 entry
  targetingStrategy: TargetingStrategy,
  amplifier?: number, // Optional damage amplifier
  effects?: EffectDto[],
  comboFinisher?: DamageCompositionDto[], // Optional finisher hit compositions
  comboFinisherEffects?: EffectDto[], // Effects applied on the finisher hit only
  bleedStackBonus?: ..., // As SpecialDto.bleedStackBonus, finisher included
  concealedBonus?: ... // As SpecialDto.concealedBonus: every hit of the action, finisher included
}
```

**Note**: `skills.simpleAttack` and `skills.multipleAttack` are both optional — provide exactly one.

**OtherSkillDto**:

```typescript
{
  kind: SkillKind, // See Enums
  name: string,
  rate?: number, // Required for HEALING, ALTERATION, SHIELD, DAMAGE_REDUCTION (in ]0, 1]), BLEED_STACK_SCALING, BLEED_EMPOWERMENT, BLEED_DETONATION, LOW_HEALTH_TARGET_BONUS, REAL_DAMAGE, WEAK_POINT_LEGACY (> 0 for the last ones)
  maxRate?: number, // BLEED_STACK_SCALING only (required, > 0): cap of the attack bonus
  stanceActivation?: { name: string, duration: number, immunities?: ("control" | "damage-over-time")[] }, // Required by STANCE; CONCEALMENT: opened with the concealment; CONDITIONAL_ATTACK: opened only when the attack fires, `stance_started` after the attack step
  rampingChance?: { startChance: number, increment: number, fromTurn: number }, // STANCE only (400 otherwise): chance the stance opens, see ARCHITECTURE (Stance). `statAlterations` (STANCE too) apply when it opens
  stackThreshold?: number, // Integer >= 1. Required when event=bleed-stacks-applied (bleed stacks the owner must have laid) and when targetingStrategy=first-bleeding-enemy (bleed stacks the target must carry)
  extraStacks?: number, // BLEED_EMPOWERMENT only (integer >= 0, default 0): stacks each bleed of the owner lays on top of its own during the stance
  basis?: "source-attack" | "target-max-health", // BLEED_EMPOWERMENT only: replaces the basis of the bleeds laid during the stance (see RateBasis)
  triggeredDebuff?: { debuffType, debuffRate, duration, probability, stackId?, maxStacks?, terminationEvent? }, // BLEED_EMPOWERMENT only: same shape as EffectDto.triggeredDebuff; replaces the debuff rolled when a bleed lands during the stance
  probability?: number, // DAMAGE_REDUCTION only: per-hit roll (0-1); omit for a permanent reduction
  targetingStrategy?: TargetingStrategy, // Absent on the passive and self-acting kinds (see SkillKind)
  event?: TriggerEvent, // See Enums; absent on SHIELD, TRANSFORMATION and the passive kinds
  targetCardId?: string, // Required when event=ally-death, ally-health-below, damage-taken or dodge, and for the last-attacker-of-ally and last-dodged-attacker targetings (never for any-ally-health-below): id of the monitored card
  requiresStance?: string, // Skill only fires while its owner holds that stance (see SpecialDto.stanceActivation); required for BLEED_EMPOWERMENT
  // SHIELD-specific fields:
  activationCondition?: { type?: "health-threshold" | "ally-presence" | "probability", operator?: "below" | "above", threshold?: number, allyName?: string, probability?: number }, // Health ratio threshold of SHIELD, ally-health-below, any-ally-health-below, most-wounded-ally and LOW_HEALTH_TARGET_BONUS (required there, in ]0, 1]); "probability" gates a triggered ALTERATION per event; the trigger alone reads it on any-ally-health-below and enemy-killed (ARCHITECTURE)
  buffType?: BuffType, // Required by BUFF and BUFF_TRANSFER (type of the buffs handed over)
  duration?: number, // Required if kind=BUFF (0 = infinite: permanent or event-bound). CONCEALMENT: optional integer >= 0, omitted = until the card attacks. BLEED_EMPOWERMENT: optional integer >= 1 (400 otherwise), turns each stack laid during the stance bleeds
  stackId?: string, // ALTERATION (buff or debuff): name of the stack pile it counts against, shared by the alterations of the same polarity carrying that id
  maxStacks?: number, // Cap of that pile (>= 1); goes with stackId, both or neither (400). An application at the cap is refused and emits no step
  debuffMaxStacks?: number, // Former name of maxStacks, still accepted
  terminationEvent?: string, // Event name that removes this skill's buff/targeting override when fired
  activationLimit?: number, // Max activations (>=1) before the lifecycle ends — HEALING, TARGETING_OVERRIDE, CONDITIONAL_ATTACK (only an attack that struck spends one)
  endEvent?: string, // Event emitted when activation limit is reached — supported for HEALING, TARGETING_OVERRIDE and CONDITIONAL_ATTACK kinds
  healBasis?: "source-attack" | "target-max-health", // HEALING only: what the rate is a share of (default source-attack)
  powerId?: string, // Groups multiple skills as a composite power (must share same event + terminationEvent)
  // DORMANT trigger fields (required when event="dormant"):
  activationEvent?: TriggerEvent, // Event that activates the dormant skill (e.g., "ally-death")
  activationTargetCardId?: string, // Card ID for the activation event trigger
  replacementEvent?: TriggerEvent, // Event to use after activation (e.g., "enemy-death"). Target card ID resolved dynamically from killer card at activation time
  // TRANSFORMATION fields:
  statAlterations?: StatAlterationDto[], // Alterations applied on transformation
  lifestealRate?: number, // Share of max health healed on every landed attack
  statusImmunity?: boolean, // Refuses every status effect while transformed
  endCostRate?: number, // Share of max health paid when the transformation ends
  stanceActivations?: StanceActivation[], // TRANSFORMATION only (400 otherwise): stances opened on the owner, each for its own duration
  criticalDamageRate?: number, // TRANSFORMATION only: critical multiplier x (1 + rate) while it runs
  activationEvent?: TriggerEvent, // DORMANT (above); TRANSFORMATION: an event setting it off too, still once
  poisonSurge?: { stacks: number, damageMultiplier: number }, // TRANSFORMATION only: surges every living stacked poison (ARCHITECTURE), `status_change: poison` per card
  battlefield?: BattlefieldDto, // TRANSFORMATION only: laid when it starts
  activationEventThreshold?: number, // TRANSFORMATION, required with activationEvent any-ally-health-below: the ally health ratio
  perLivingAlly?: { maxRate }, // ALTERATION only: `rate` per living ally of the bearer (bearer excluded), capped, read live
  whileHealthBelow?: number, // ALTERATION only (not with perLivingAlly): counts only while the bearer health ratio is under it
  whileShielded?: string, // ALTERATION only (not with the other live rates): counts only while the bearer holds the shield of the SHIELD skill of that name
  terminationDamageRate?: number, // ALTERATION only, in ]0, 1]: `terminationEvent` ends it only on a hit costing more than that share of max health
  accuracyRate?: number, agilityRate?: number, // ATTACKER_INSIGHT (required, >= 0)
  amount?: number, // ENERGY_GAIN (required, integer >= 1)
  shield?: { rate, duration }, cleanse?: number, alterations?: { type, rate, duration, polarity }[], // SUPPORT only: shield of rate × caster max health, statuses removed at random, alterations — on each target
  // CONDITIONAL_ATTACK fields:
  damages?: DamageCompositionDto[], // Required unless bleedDetonation is set
  hits?: number, // Not allowed with bleedDetonation (400)
  interval?: number, // CONDITIONAL_ATTACK, CONCEALMENT and SUPPORT only (400 elsewhere): turns between two activations (integer >= 1)
  amplifier?: number,
  effect?: EffectDto, // CONDITIONAL_ATTACK: effect of the hit; AFFLICTION (required): effect laid on every target
  comboFinisher?: DamageCompositionDto[],
  comboFinisherEffects?: EffectDto[], // Effects applied on the finisher hit only
  weakPointPenetration?: number, // CONDITIONAL_ATTACK only, in [0, 1]: replaces defensePenetration against a defender carrying a weak point
  defensePenetration?: number, // In [0, 1] (400 outside), default 0: ARCHITECTURE (Defense penetration)
  energyCost?: number, // CONDITIONAL_ATTACK and SUPPORT, integer >= 1: nothing fires below that special energy, spent only when it strikes or helps somebody
  endsStance?: boolean, // CONDITIONAL_ATTACK with `requiresStance` only (400 otherwise): ARCHITECTURE (Stance on fire)
  requiresUndamaged?: boolean, // CONDITIONAL_ATTACK and CONCEALMENT only: ARCHITECTURE (Undamaged since last action); with `interval`, both must hold
  hitAlterations?: { // CONDITIONAL_ATTACK (and SimpleAttackDto): see ARCHITECTURE (Attack Add-ons)
    type: BuffType,
    rate: number,
    duration: number,
    polarity: "buff" | "debuff",
    terminationEvent?: string
  }[],
  execution?: { threshold: number }, // CONDITIONAL_ATTACK only, threshold in ]0, 1[: see ARCHITECTURE (Attack Add-ons); reported as `executed`
  bleedDetonation?: { ratePerStack: number }, // > 0: ARCHITECTURE (Bleed detonation), replaces `damages`
  splash?: { // Secondary strike around the primary target: see ARCHITECTURE (Attack Add-ons)
    name: string, // Name of the splash attack step
    damages: DamageCompositionDto[], // Min 1 entry
    effects?: EffectDto[]
  },
  onLowHealthAfterHit?: { // Debuffs the main defender left alive under `threshold`: see ARCHITECTURE (Attack Add-ons)
    name: string,
    threshold: number, // Health ratio in ]0, 1]
    debuffs: { type: BuffType, rate: number, duration: number }[] // Min 1; rate > 0, duration integer >= 1
  }
}
```

**EffectDto**:

```typescript
{
  type: Effect, // See Enums
  weakPoint?: { name, duration?, damageMultiplier?, criticalChanceBonus?, accuracyRate?, consumable?, revealerAccuracyRate?, revealerAttackRate?, revealerDamageRate?, exploitEffect?: EffectDto }, // WEAK_POINT (required): see Effect
  rate: number, // Meaning per type: see Effect
  level: 1 | 2 | 3, // POISON, BURN, FREEZE, STUNT only: 2*level-1 turns
  duration?: number, // Required (>= 1) for BLEED, stacked POISON, HYPOTHERMIA, VULNERABILITY, SUPPORT_BLOCK; BURN, FREEZE: optional, replaces the level turns
  basis?: "source-attack" | "target-max-health", // BLEED and stacked POISON: what `rate` is a share of (default source-attack), see RateBasis
  damageType?: DamageType, // MARK and VULNERABILITY (required): amplified damage type
  maxStacks?: number, // MARK and BLEED (required): stack cap; on POISON, makes it a stacked poison
  stacks?: number, // MARK, BLEED and stacked POISON: stacks applied per trigger (default 1)
  stackMultiplier?: number, // Stacked POISON (required, > 0): the tick is multiplied by it at each stack (2: 3%, 6%, 12%)
  ignoresImmunity?: boolean, // Stacked POISON: laid through a damage-over-time immunity (resistance still rolls)
  probability?: number, // 0-1 chance to apply effect on hit; omit for guaranteed application
  triggeredDebuff?: { // Optional debuff applied on effect hit (not on STUNT and the control effects)
    debuffType: BuffType,
    debuffRate: number,
    duration: number,
    probability: number,
    stackId?: string, // Name of the stack pile this debuff counts against
    maxStacks?: number, // Cap of that pile; goes with stackId, both or neither
    terminationEvent?: string // Event name that removes this triggered debuff when fired
  },
  terminationEvent?: string // Event name that removes this effect when fired
}
```

**BattlefieldDto** (mechanics: ARCHITECTURE, Battlefield):

```typescript
{
  name: string, duration: number, // integer >= 1
  element?: Element, // read by battlefieldBonus
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
  type: BuffType,
  rate: number, // Buff strength multiplier
  duration: number, // Number of turns buff lasts (0 = infinite: permanent if no terminationEvent, event-bound if terminationEvent is set)
  targetingStrategy: TargetingStrategy,
  condition?: BuffConditionDto, // Optional conditional multiplier
  terminationEvent?: string // Event name that removes this buff when fired
}
```

**Response** (`FightResult`): an object `{ [stepNumber]: Step }`. Step `0` is always `fight_start`; the others are numbered from 1. Types: @packages/shared-types/src/fight-report.ts (`StepKind` values included).

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

### CardSelectorStrategy and DodgeStrategy

- Card selector: `player-by-player` (players alternate) or `speed-weighted` (speed-weighted draw)
- Dodge: `simple-dodge` (agility) or `random-dodge` (random chance)

### TargetingStrategy

- `position-based` (opponent at the same position), `target-all` (every opponent), `line-three` (3 cards in a line), `all-owner-cards`, `all-allies`, `self`
- `last-attacker-of-ally`: the card that last attacked the `targetCardId` ally
- `protected-ally`: the ally the caster stands in front of (see `PROTECTION`); nobody without a protection or if that ally is dead; resolves even when the caster is dead (guardian parting gift)
- `linked-ally`: the `targetCardId` ally
- `first-bleeding-enemy`: the first living enemy, in deck order, carrying at least `stackThreshold` bleed stacks; nobody otherwise
- `fastest-ally`: the caster's fastest living ally (speed buffs included, caster excluded, ties in deck order); resolves even when the caster is dead
- `last-dodged-attacker`: the card whose attack the `targetCardId` card dodged last (`FightingCard.lastDodgedAttacker`); nobody if it cannot be targeted. Pairs with `dodge`
- `lowest-health-ally`: like `most-wounded-ally` without threshold: nobody only when the caster stands alone
- `lowest-health-points-ally` / `strongest-ally`: like `fastest-ally`, on the fewest health points / the highest attack at launch
- `random-enemies`: specials only (400 elsewhere, and `targetCount` without it), `targetCount` targetable enemies drawn per launch, in deck order
- `special-targets`: in the `shieldApplication` of a HEALING special only (400 elsewhere), the healed targets
- `most-wounded-ally`: the caster's ally in the worst shape below `activationCondition.threshold` (required, never a `targetCardId`), on the live board; caster and dead excluded, nobody when every ally is above, ties in deck order

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
- `HEALING`: heals, then shields; the attack and stance fields, `statAlterations` and `random-enemies` are refused (400)
- `STANCE`: strikes nobody. `stanceActivation` required; optional `statAlterations`, `shieldApplication`, `concealment`. Being no attack, it does not lift a concealment. `damages`, `rate`, `hits`, `targetingStrategy`, `effect`, `energyRefund`, `markedTargetBonus`, `bleedStackBonus`, `concealedBonus` and `execution` are refused (400). Reported as `special_stance`; the gauge empties as for any special

### SkillKind

Required fields below, the others in OtherSkillDto; mechanics in ARCHITECTURE. *Passive* kinds take no `event` and no `targetingStrategy`, emit no step and stay on the card (ARCHITECTURE, Card-bound passives): `SURVIVE` (`name` only), `DAMAGE_REDUCTION`, `DODGE_BONUS_DENIAL`, `BLEED_STACK_SCALING`, `BLEED_EMPOWERMENT` (`requiresStance`, `rate`), `LOW_HEALTH_TARGET_BONUS` (`rate` > 0, `activationCondition.threshold`), `POISONED_ENEMY_AGILITY` (`rate`, `maxRate` > 0), `ATTACKER_INSIGHT`.

- `HEALING`: optional `healBasis`, `activationLimit`, `endEvent`
- `BUFF`: `buffType`, `duration` (0 = permanent or event-bound)
- `CONDITIONAL_ATTACK`: attack on an event, through the regular attack path; add-ons in OtherSkillDto
- `TARGETING_OVERRIDE`: overrides the card attack targeting; `terminationEvent`
- `SHIELD`, `TRANSFORMATION`: no `event` or targeting; fire when health crosses `activationCondition.threshold` downward. SHIELD rearms on recovery; TRANSFORMATION needs `duration`, fires once per fight
- `PROTECTION`: `duration`, `event`, `targetingStrategy`; covers the first card targeted; optional `activationLimit`
- `BLEED_DETONATION`: `rate`, no targeting; meant for `self-death` + `requiresStance`; an `attack` step, none when nobody bleeds
- `BUFF_TRANSFER`: `event`, `targetingStrategy`, `buffType`
- `STANCE`: `event`, `stanceActivation`, no targeting; optional `statAlterations`, `rampingChance`
- `CONCEALMENT`: hides its owner; on `next-action` it takes the action (no attack that turn)
- `REAL_DAMAGE`, `AFFLICTION`: `event`, `targetingStrategy` and `rate` (optional `basis`) / `effect`; optional `requiresStance`
- `ANALYSIS`: `event`, `maxStacks`, `effect`; no targeting
- `AFTERSHOCK`: `event`, `damages`; optional `effect`, `requiresStance`
- `WEAK_POINT_LEGACY`: `event`, `rate`; optional `requiresStance`
- `SUPPORT`: `event`, `targetingStrategy` and a `shield`, `cleanse` or `alterations`; optional `interval`, `energyCost`; on `next-action` it takes the action when it helps somebody
- `ENERGY_GAIN`: `event`, `amount`, no targeting; never fills past the special cost
- `SPECIAL_ECHO`: `event`, no targeting; optional `requiresStance`; 400 unless the owner special is an ATTACK

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
- `FREEZE`, `STUNT`: skip the action, +20% damage taken; STUNT has no tick
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

`attack`, `defense`, `agility`, `accuracy`, `speed` (turn order in both selectors), `criticalChance`, `regeneration`, `resistance` (chance to refuse a status or debuff). A value is a rate of the base stat: a 0.1 critical rate needs 2.5 to reach 0.35 (capped at 1).

## Errors

- **400**: `class-validator` failures (detailed messages), plus the domain checks the controller converts explicitly — composite power consistency (`validatePowerIdConsistency`), the DAMAGE_REDUCTION rate range, an alteration stack budget given by halves (`stackId` without its cap, or the reverse), and a field reserved to some skill kinds carried by another (`RESERVED_FIELDS` in `skill-kind-fields.ts` is the list; effects have their own guards)
- **500**: runtime errors (unknown skill kind, missing buff property…); NestJS defaults, no custom middleware
