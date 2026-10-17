import { FightingContext } from '../@types/fighting-context';
import { FightingCard } from '../fighting-card';
import { Special } from './special';
import { assertConcealmentDuration } from './concealment-duration';
import { SpecialResult } from '../@types/action-result/special-result';
import { StanceActivation } from '../@types/stance/stance';
import { Alteration } from '../@types/alteration/alteration';
import { ShieldApplication } from '../@types/shield/shield-application';
import {
  BuffResult,
  DebuffResult,
} from '../@types/action-result/alteration-result';

const ENERGY_INCREASE_FACTOR = 10;

/**
 * A special that strikes nobody: its caster enters a stance, and may alter
 * stats, shield and conceal itself for its duration. Since it is no attack,
 * it does not lift a concealment, which is how a power can hide its caster.
 */
export class SpecialStance implements Special {
  constructor(
    readonly name: string,
    private readonly energyNeeded: number,
    private readonly stanceActivation: StanceActivation,
    private readonly alterations: Alteration[] = [],
    private readonly shieldApplication?: ShieldApplication,
    private readonly concealmentDuration?: number,
  ) {
    if (!stanceActivation) {
      throw new Error('SpecialStance requires a stanceActivation');
    }
    assertConcealmentDuration(concealmentDuration);
  }

  public ready(actualEnergy: number): boolean {
    return actualEnergy >= this.energyNeeded;
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

  public increaseEnergy(actualEnergy: number): number {
    return Math.min(actualEnergy + ENERGY_INCREASE_FACTOR, this.energyNeeded);
  }

  public getSpecialKind(): string {
    return 'specialStance';
  }
}
