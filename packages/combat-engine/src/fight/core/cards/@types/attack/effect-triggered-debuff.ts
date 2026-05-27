import { FightingCard } from '../../fighting-card';
import { Debuff } from '../alteration/alteration-detail';
import { AlterationType } from '../alteration/alteration-type';
import { Randomizer } from '../../../randomizer';

export class EffectTriggeredDebuff {
  public readonly probability: number;
  public readonly debuffType: AlterationType;
  public readonly debuffRate: number;
  public readonly duration: number;
  public readonly terminationEvent?: string;
  public readonly powerId?: string;
  private readonly randomizer: Randomizer;

  constructor(
    probability: number,
    debuffType: AlterationType,
    debuffRate: number,
    duration: number,
    randomizer: Randomizer,
    terminationEvent?: string,
    powerId?: string,
  ) {
    if (probability < 0 || probability > 1) {
      throw new Error(`probability must be in [0, 1], got: ${probability}`);
    }
    this.probability = probability;
    this.debuffType = debuffType;
    this.debuffRate = debuffRate;
    this.duration = duration;
    this.terminationEvent = terminationEvent;
    this.powerId = powerId;
    this.randomizer = randomizer;
  }

  public tryApply(target: FightingCard): Debuff | undefined {
    if (this.randomizer.random_int_between(0, 100) >= this.probability * 100)
      return undefined;

    return target.applyDebuff(
      this.debuffType,
      this.debuffRate,
      this.duration,
      this.terminationEvent,
      this.powerId,
    );
  }
}
