import { FightingCard } from '../../fighting-card';
import { AttackResult } from '../action-result/attack-result';
import { BuffResult, DebuffResult } from '../action-result/alteration-result';
import { AlterationType } from '../alteration/alteration-type';

export type HitAlterationSpec = {
  polarity: 'buff' | 'debuff';
  type: AlterationType;
  rate: number;
  duration: number;
  terminationEvent?: string;
};

/**
 * Alterations an attack leaves on every defender it hit: a dodged hit or a
 * killed defender gets none, and a defender hit several times gets each
 * alteration once. Debuffs go through `applyDebuff()`, so resistance applies.
 */
export class HitAlterations {
  constructor(private readonly specs: HitAlterationSpec[]) {}

  public apply(results: AttackResult[]): {
    buffs: BuffResult[];
    debuffs: DebuffResult[];
  } {
    const defenders = new Set(
      results
        .filter((r) => !r.dodge && !r.defender.isDead())
        .map((r) => r.defender),
    );

    const buffs: BuffResult[] = [];
    const debuffs: DebuffResult[] = [];
    defenders.forEach((defender) =>
      this.specs.forEach((spec) =>
        spec.polarity === 'buff'
          ? buffs.push(...this.landed(defender, this.buff(defender, spec)))
          : debuffs.push(...this.landed(defender, this.debuff(defender, spec))),
      ),
    );

    return { buffs, debuffs };
  }

  private buff(defender: FightingCard, spec: HitAlterationSpec) {
    return defender.applyBuff(
      spec.type,
      spec.rate,
      spec.duration,
      spec.terminationEvent,
    );
  }

  private debuff(defender: FightingCard, spec: HitAlterationSpec) {
    return defender.applyDebuff(
      spec.type,
      spec.rate,
      spec.duration,
      spec.terminationEvent,
    );
  }

  // A refused application (resistance) returns undefined and reports nothing.
  private landed<A>(defender: FightingCard, alteration: A | undefined) {
    return alteration === undefined
      ? []
      : [{ target: defender.identityInfo, alteration }];
  }
}
