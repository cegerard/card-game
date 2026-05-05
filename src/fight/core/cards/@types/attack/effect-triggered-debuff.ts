import { FightingCard } from '../../fighting-card';
import { Debuff } from '../alteration/debuff';
import { AlterationType } from '../alteration/alteration-type';
import { Randomizer } from '../../../../core/randomizer';

export class EffectTriggeredDebuff {
  public readonly probability: number;
  public readonly debuffType: AlterationType;
  public readonly debuffRate: number;
  public readonly duration: number;
  public readonly terminationEvent?: string;
  private readonly randomizer: Randomizer;

  constructor(
    probability: number,
    debuffType: AlterationType,
    debuffRate: number,
    duration: number,
    randomizer: Randomizer,
    terminationEvent?: string,
  ) {
    this.probability = probability;
    this.debuffType = debuffType;
    this.debuffRate = debuffRate;
    this.duration = duration;
    this.terminationEvent = terminationEvent;
    this.randomizer = randomizer;
  }

  public tryApply(target: FightingCard): Debuff | undefined {
    if (this.randomizer.random_int_between(0, 100) >= this.probability * 100)
      return undefined;

    return target.applyDebuff(
      this.debuffType,
      this.debuffRate,
      this.duration,
      undefined,
      this.terminationEvent,
    );
  }
}
