import { FightingCard } from '../../fighting-card';
import { Debuff } from '../buff/debuff';
import { DebuffType } from '../buff/type';
import { Randomizer } from '../../../../core/randomizer';

export class EffectTriggeredDebuff {
  public readonly probability: number;
  public readonly debuffType: DebuffType;
  public readonly debuffRate: number;
  public readonly duration: number;
  private readonly randomizer: Randomizer;

  constructor(
    probability: number,
    debuffType: DebuffType,
    debuffRate: number,
    duration: number,
    randomizer: Randomizer,
  ) {
    this.probability = probability;
    this.debuffType = debuffType;
    this.debuffRate = debuffRate;
    this.duration = duration;
    this.randomizer = randomizer;
  }

  public tryApply(target: FightingCard): Debuff | undefined {
    if (this.randomizer.random_int_between(0, 100) >= this.probability * 100)
      return undefined;

    return target.applyDebuff(this.debuffType, this.debuffRate, this.duration);
  }
}
