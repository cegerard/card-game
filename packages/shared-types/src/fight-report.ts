/**
 * Rapport de combat renvoyé par POST /fight : une étape (`Step`) par
 * événement, numérotées à partir de 0 (`fight_start`). Types seulement :
 * le combat-engine les réexporte et garde ses propres enums, vérifiés
 * identiques à ces unions à la compilation.
 */

import type { BuffType, DamageType } from './index';

export interface CardInfo {
  id: string;
  name: string;
  deckIdentity: string;
}

export type StepKind =
  | 'fight_start'
  | 'fight_end'
  | 'status_change'
  | 'attack'
  | 'special_attack'
  | 'healing'
  | 'state_effect'
  | 'buff'
  | 'debuff'
  | 'buff_removed'
  | 'debuff_removed'
  | 'buff_expired'
  | 'debuff_expired'
  | 'targeting_override'
  | 'targeting_reverted'
  | 'effect_removed'
  | 'shield_applied'
  | 'shield_broken'
  | 'shield_expired'
  | 'survived'
  | 'damage_mitigated'
  | 'stance_started'
  | 'stance_ended'
  | 'mark_applied'
  | 'regenerated'
  | 'protection_started'
  | 'protection_ended'
  | 'attack_intercepted'
  | 'transformation_started'
  | 'transformation_ended'
  | 'concealment_started'
  | 'concealment_ended'
  | 'special_stance'
  | 'executed'
  | 'buff_transferred'
  | 'weak_point_revealed'
  | 'weak_point_ended'
  | 'analysis_charged'
  | 'battlefield_started'
  | 'battlefield_extended'
  | 'battlefield_ended'
  | 'revived'
  | 'attack_empowered'
  | 'damage_shared'
  | 'energy_gained'
  | 'effect_cleansed'
  | 'action_failed'
  | 'energy_drained'
  | 'vulnerability_applied'
  | 'vulnerability_ended'
  | 'support_blocked'
  | 'support_block_ended'
  | 'decoy_struck';

export type StateEffectType =
  'burn' | 'poison' | 'freeze' | 'stunt' | 'bleed' | 'hypothermia' | 'entangle';

export type WeakPointEndReason = 'struck' | 'dodged' | 'expired';

/** Ouvre le rapport : chaque carte des deux decks avec la santé qu'elle peut atteindre. */
export type FightStartReport = {
  kind: 'fight_start';
  cards: { card: CardInfo; maxHealth: number }[];
};

export type WinnerReport = {
  kind: 'fight_end';
  winner: string | null;
};

export type StatusChangeStatus =
  | 'dead'
  | 'poison'
  | 'burn'
  | 'freeze'
  | 'stunt'
  | 'bleed'
  | 'hypothermia'
  | 'entangle';

export type StatusChangeReport = {
  kind: 'status_change';
  card: CardInfo;
  status: StatusChangeStatus;
  stacks?: number;
};

export type Damage = {
  defender: CardInfo;
  damage: number;
  isCritical: boolean;
  dodge: boolean;
  remainingHealth: number;
  kind?: DamageType[];
  /**
   * Part de `damage` absorbée par le bouclier plutôt que par la santé ; absente
   * sans bouclier. Un client qui suit le bouclier depuis `shield_applied` en a
   * besoin pour le décrémenter.
   */
  shieldAbsorbed?: number;
  /** Piles de Saignement qu'une détonation a consommées sur le défenseur. */
  consumedBleedStacks?: number;
};

export type DamageReport = {
  name?: string;
  attacker: CardInfo;
  damages: Damage[];
  energy: number;
  powerId?: string;
};

export type AttackStepReport = { kind: 'attack' } & DamageReport;
export type SpecialAttackStepReport = {
  kind: 'special_attack';
} & DamageReport;

type Healing = {
  target: CardInfo;
  healed: number;
  remainingHealth: number;
};

export type HealingReport = {
  kind: 'healing';
  name?: string;
  source: CardInfo;
  heal: Healing[];
  energy: number;
  powerId?: string;
};

export type StateEffectReport = {
  kind: 'state_effect';
  type: string;
  card: CardInfo;
  damage: number;
  remainingTurns: number;
  remainingHealth: number;
  remainingStacks?: number;
};

type AlterationReport<K extends StepKind> = {
  kind: K;
  name?: string;
  source: CardInfo;
  alterations: {
    target: CardInfo;
    kind: BuffType;
    value: number;
    remainingTurns: number;
  }[];
  energy: number;
  powerId?: string;
};

export type BuffReport = AlterationReport<'buff'>;
export type DebuffReport = AlterationReport<'debuff'>;

type AlterationRemovedReport<K extends StepKind> = {
  kind: K;
  source: CardInfo;
  eventName: string;
  removed: { target: CardInfo; kind: BuffType; value: number }[];
  powerId?: string;
};

export type BuffRemovedReport = AlterationRemovedReport<'buff_removed'>;
export type DebuffRemovedReport = AlterationRemovedReport<'debuff_removed'>;

type AlterationExpiredReport<K extends StepKind> = {
  kind: K;
  card: CardInfo;
  expired: { kind: BuffType; value: number }[];
};

export type BuffExpiredReport = AlterationExpiredReport<'buff_expired'>;
export type DebuffExpiredReport = AlterationExpiredReport<'debuff_expired'>;

export type TargetingOverrideReport = {
  kind: 'targeting_override';
  name?: string;
  source: CardInfo;
  previousStrategy: string;
  newStrategy: string;
  powerId?: string;
};

export type TargetingRevertedReport = {
  kind: 'targeting_reverted';
  source: CardInfo;
  eventName: string;
  revertedStrategy: string;
  restoredStrategy: string;
  powerId?: string;
};

export type EffectRemovedReport = {
  kind: 'effect_removed';
  source: CardInfo;
  eventName: string;
  removed: { target: CardInfo; effectType: StateEffectType }[];
  powerId?: string;
};

export type ShieldAppliedReport = {
  kind: 'shield_applied';
  name?: string;
  source: CardInfo;
  targets: { target: CardInfo; points: number }[];
};

export type ShieldBrokenReport = {
  kind: 'shield_broken';
  card: CardInfo;
};

export type ShieldExpiredReport = {
  kind: 'shield_expired';
  card: CardInfo;
};

export type SurvivedReport = {
  kind: 'survived';
  name: string;
  card: CardInfo;
};

export type DamageMitigatedReport = {
  kind: 'damage_mitigated';
  name: string;
  card: CardInfo;
};

export type StanceStartedReport = {
  kind: 'stance_started';
  name: string;
  card: CardInfo;
  remainingTurns: number;
};

export type StanceEndedReport = {
  kind: 'stance_ended';
  name: string;
  card: CardInfo;
};

export type MarkAppliedReport = {
  kind: 'mark_applied';
  card: CardInfo;
  damageType: DamageType;
  stacks: number;
};

export type RegeneratedReport = {
  kind: 'regenerated';
  card: CardInfo;
  healed: number;
  remainingHealth: number;
};

export type ProtectionStartedReport = {
  kind: 'protection_started';
  name: string;
  card: CardInfo;
  protectedCard: CardInfo;
  remainingTurns: number;
};

export type ProtectionEndedReport = {
  kind: 'protection_ended';
  card: CardInfo;
  protectedCard: CardInfo;
};

export type AttackInterceptedReport = {
  kind: 'attack_intercepted';
  card: CardInfo;
  protectedCard: CardInfo;
};

export type TransformationStartedReport = {
  kind: 'transformation_started';
  name: string;
  card: CardInfo;
  remainingTurns: number;
};

export type TransformationEndedReport = {
  kind: 'transformation_ended';
  name: string;
  card: CardInfo;
  healthCost: number;
  remainingHealth: number;
};

export type ConcealmentStartedReport = {
  kind: 'concealment_started';
  name: string;
  card: CardInfo;
  /** Absent pour une dissimulation qui dure jusqu'à la prochaine attaque. */
  remainingTurns?: number;
};

export type ConcealmentEndReason = 'attacked' | 'expired';

export type ConcealmentEndedReport = {
  kind: 'concealment_ended';
  name: string;
  card: CardInfo;
  reason: ConcealmentEndReason;
};

/** Spéciale qui ne frappe personne : le lanceur entre seulement dans une posture. */
export type SpecialStanceReport = {
  kind: 'special_stance';
  name: string;
  caster: CardInfo;
  energy: number;
};

export type ExecutedReport = {
  kind: 'executed';
  name: string;
  attacker: CardInfo;
  card: CardInfo;
};

export type BuffTransferredReport = {
  kind: 'buff_transferred';
  name: string;
  source: CardInfo;
  target: CardInfo;
  alterations: {
    kind: BuffType;
    value: number;
    remainingTurns: number;
  }[];
};

export type WeakPointRevealedReport = {
  kind: 'weak_point_revealed';
  name: string;
  /** La carte qui l'a révélé. */
  source: CardInfo;
  card: CardInfo;
  /** Absent : il n'expire jamais. */
  remainingTurns?: number;
};

export type WeakPointEndedReport = {
  kind: 'weak_point_ended';
  name: string;
  card: CardInfo;
  reason: WeakPointEndReason;
};

export type AnalysisChargedReport = {
  kind: 'analysis_charged';
  name: string;
  source: CardInfo;
  card: CardInfo;
  charges: number;
};

export type BattlefieldStartedReport = {
  kind: 'battlefield_started';
  name: string;
  source: CardInfo;
  remainingTurns: number;
};

export type BattlefieldExtendedReport = {
  kind: 'battlefield_extended';
  name: string;
  source: CardInfo;
  extraTurns: number;
};

export type BattlefieldEndedReport = {
  kind: 'battlefield_ended';
  name: string;
  card: CardInfo;
};

export type RevivedReport = {
  kind: 'revived';
  name: string;
  source: CardInfo;
  card: CardInfo;
  remainingHealth: number;
};

export type AttackEmpoweredReport = {
  kind: 'attack_empowered';
  name: string;
  source: CardInfo;
  cards: CardInfo[];
};

export type DamageSharedReport = {
  kind: 'damage_shared';
  name: string;
  card: CardInfo;
  shares: { card: CardInfo; damage: number; remainingHealth: number }[];
};

export type EnergyGainedReport = {
  kind: 'energy_gained';
  name: string;
  card: CardInfo;
  amount: number;
  energy: number;
};

export type EffectCleansedReport = {
  kind: 'effect_cleansed';
  name: string;
  source: CardInfo;
  card: CardInfo;
  effectType: StateEffectType;
};

/** Une carte entravée a perdu son action offensive. */
export type ActionFailedReport = {
  kind: 'action_failed';
  card: CardInfo;
  cause: 'entangle';
};

export type EnergyDrainedReport = {
  kind: 'energy_drained';
  card: CardInfo;
  amount: number;
  energy: number;
};

export type VulnerabilityAppliedReport = {
  kind: 'vulnerability_applied';
  card: CardInfo;
  damageType: DamageType;
  rate: number;
  remainingTurns: number;
};

export type VulnerabilityEndedReport = {
  kind: 'vulnerability_ended';
  card: CardInfo;
  damageType: DamageType;
};

/** La carte ne reçoit plus les soins ni les buffs de ses alliés. */
export type SupportBlockedReport = {
  kind: 'support_blocked';
  card: CardInfo;
  remainingTurns: number;
};

export type SupportBlockEndedReport = {
  kind: 'support_block_ended';
  card: CardInfo;
};

/** Un leurre a pris une attaque visant la carte. */
export type DecoyStruckReport = {
  kind: 'decoy_struck';
  name: string;
  card: CardInfo;
  remainingDecoys: number;
};

export type Step =
  | StatusChangeReport
  | AttackStepReport
  | SpecialAttackStepReport
  | HealingReport
  | FightStartReport
  | WinnerReport
  | StateEffectReport
  | BuffReport
  | DebuffReport
  | BuffRemovedReport
  | DebuffRemovedReport
  | BuffExpiredReport
  | DebuffExpiredReport
  | TargetingOverrideReport
  | TargetingRevertedReport
  | EffectRemovedReport
  | ShieldAppliedReport
  | ShieldBrokenReport
  | ShieldExpiredReport
  | SurvivedReport
  | DamageMitigatedReport
  | StanceStartedReport
  | StanceEndedReport
  | MarkAppliedReport
  | RegeneratedReport
  | ProtectionStartedReport
  | ProtectionEndedReport
  | AttackInterceptedReport
  | TransformationStartedReport
  | TransformationEndedReport
  | ConcealmentStartedReport
  | ConcealmentEndedReport
  | SpecialStanceReport
  | ExecutedReport
  | BuffTransferredReport
  | WeakPointRevealedReport
  | WeakPointEndedReport
  | AnalysisChargedReport
  | BattlefieldStartedReport
  | BattlefieldExtendedReport
  | BattlefieldEndedReport
  | RevivedReport
  | AttackEmpoweredReport
  | DamageSharedReport
  | EnergyGainedReport
  | EffectCleansedReport
  | ActionFailedReport
  | EnergyDrainedReport
  | VulnerabilityAppliedReport
  | VulnerabilityEndedReport
  | SupportBlockedReport
  | SupportBlockEndedReport
  | DecoyStruckReport;

export interface FightResult {
  [step: number]: Step;
}
