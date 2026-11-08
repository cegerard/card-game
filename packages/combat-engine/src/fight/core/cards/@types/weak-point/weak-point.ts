import { FightingCard } from '../../fighting-card';
import { AttackEffect } from '../attack/attack-effect';

export const WEAK_POINT_EFFECT_TYPE = 'weak_point';
export const WEAK_POINT_ENDED_TYPE = 'weak_point_ended';

/** Bonuses only the card that revealed the weak point gets against its bearer. */
export type RevealerBonus = {
  /** Share of the revealer base accuracy added against the bearer. */
  accuracyRate?: number;
  /** Multiplies the revealer attack power against the bearer by `1 + rate`. */
  attackRate?: number;
  /** Multiplies the damage of the revealer hits on the bearer by `1 + rate`. */
  damageRate?: number;
};

/** What a weak point grants, as a power describes it. */
export type WeakPointSpec = {
  name: string;
  /** Turns it lasts; absent, it never expires. */
  duration?: number;
  /** Multiplies the damage of every hit on the bearer (default 1). */
  damageMultiplier?: number;
  /** Added to the critical chance of every attacker of the bearer (default 0). */
  criticalChanceBonus?: number;
  revealerBonus?: RevealerBonus;
  /** Gone at the next attack aimed at the bearer, landed or dodged. */
  consumable?: boolean;
  /** Laid on the bearer, by the revealer, when a hit lands on a consumable weak point. */
  exploitEffect?: AttackEffect;
};

export type WeakPointEndReason = 'struck' | 'dodged' | 'expired';

/** Throws on a spec no weak point could be built from. */
export function validateWeakPointSpec(spec: WeakPointSpec): void {
  if ((spec.damageMultiplier ?? 1) <= 0) {
    throw new Error(
      `WeakPoint damageMultiplier must be greater than 0, got ${spec.damageMultiplier}`,
    );
  }
  if (spec.exploitEffect && !spec.consumable) {
    throw new Error(
      `WeakPoint ${spec.name}: only a consumable weak point is exploited`,
    );
  }
  if (spec.duration !== undefined && spec.duration < 1) {
    throw new Error(
      `WeakPoint duration must be greater than or equal to 1, got ${spec.duration}`,
    );
  }
}

/**
 * A weakness revealed on a card: it is no status, so no immunity or
 * resistance refuses it. Every attacker reads its damage and critical bonuses;
 * the revealer alone reads its revealer bonus.
 */
export class WeakPoint {
  public readonly name: string;
  public readonly consumable: boolean;
  public readonly exploitEffect?: AttackEffect;
  public readonly criticalChanceBonus: number;
  private readonly revealerBonus: RevealerBonus;
  private damageMultiplier: number;
  private turnsLeft?: number;

  constructor(
    spec: WeakPointSpec,
    public readonly revealer: FightingCard,
  ) {
    validateWeakPointSpec(spec);
    this.name = spec.name;
    this.turnsLeft = spec.duration;
    this.damageMultiplier = spec.damageMultiplier ?? 1;
    this.criticalChanceBonus = spec.criticalChanceBonus ?? 0;
    this.revealerBonus = spec.revealerBonus ?? {};
    this.consumable = spec.consumable ?? false;
    this.exploitEffect = spec.exploitEffect;
  }

  public get remainingTurns(): number | undefined {
    return this.turnsLeft;
  }

  public damageMultiplierFor(attacker: FightingCard): number {
    return this.damageMultiplier * (1 + this.bonusOf(attacker, 'damageRate'));
  }

  public bonusOf(attacker: FightingCard, bonus: keyof RevealerBonus): number {
    return attacker === this.revealer ? (this.revealerBonus[bonus] ?? 0) : 0;
  }

  /** Same clock as a stance: returns true on the turn end it runs out. */
  public tick(): boolean {
    if (this.turnsLeft === undefined) return false;

    this.turnsLeft--;
    return this.turnsLeft < 0;
  }

  /** It never expires any more and every hit on its bearer is amplified. */
  public persist(damageRate: number): void {
    this.turnsLeft = undefined;
    this.damageMultiplier *= 1 + damageRate;
  }
}
