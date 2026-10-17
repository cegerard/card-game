import { FightingContext } from '../@types/fighting-context';
import { FightingCard } from '../fighting-card';
import { BaseSpecial } from './special';
import { assertConcealmentDuration } from './concealment-duration';
import { SpecialResult } from '../@types/action-result/special-result';
import { StanceActivation } from '../@types/stance/stance';
import { Alteration } from '../@types/alteration/alteration';
import { ShieldApplication } from '../@types/shield/shield-application';
import {
  BuffResult,
  DebuffResult,
} from '../@types/action-result/alteration-result';

/**
 * A special that strikes nobody: its caster enters a stance, and may alter
 * stats, shield and conceal itself for its duration. Since it is no attack,
 * it does not lift a concealment, which is how a power can hide its caster.
 */
export class SpecialStance extends BaseSpecial {
  constructor(
    name: string,
    energyNeeded: number,
    private readonly stanceActivation: StanceActivation,
    private readonly alterations: Alteration[] = [],
    private readonly shieldApplication?: ShieldApplication,
    private readonly concealmentDuration?: number,
  ) {
    super(name, energyNeeded);
    if (!stanceActivation) {
      throw new Error('SpecialStance requires a stanceActivation');
    }
    assertConcealmentDuration(concealmentDuration);
  }

  public launch(source: FightingCard, context: FightingContext): SpecialResult {
    const stanceStarted = source.activateStance(this.stanceActivation);
    const alterationResults = this.alterations.flatMap(
      (alteration) =>
        alteration.apply(source, context) as (BuffResult | DebuffResult)[],
    );
    const shieldResults = this.shieldApplication?.apply(source, context) ?? [];
    const concealmentStarted =
      this.concealmentDuration !== undefined
        ? source.conceal(this.name, this.concealmentDuration)
        : undefined;

    return {
      name: this.name,
      actionResults: [],
      alterationResults,
      shieldResults,
      stanceStarted,
      concealmentStarted,
    };
  }

  public getSpecialKind(): string {
    return 'specialStance';
  }
}
