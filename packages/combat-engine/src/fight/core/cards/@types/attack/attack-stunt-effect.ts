import { FightingCard } from '../../fighting-card';
import { AttackEffect, EffectResult } from './attack-effect';
import { EffectLevel } from './effect-level';
import { FightingContext } from '../fighting-context';
import { CardStateStunted } from '../state/card-state-stunted';
import { Randomizer } from '../../../randomizer';

export class StuntAttackEffect implements AttackEffect {
  public readonly rate: number;
  public readonly level: EffectLevel;
  public readonly type = 'stunt' as const;
  public readonly terminationEvent?: string;
  public readonly probability?: number;
  private readonly randomizer: Randomizer;

  constructor(
    rate: number,
    level: EffectLevel,
    randomizer: Randomizer,
    probability?: number,
    terminationEvent?: string,
  ) {
    this.rate = rate;
    this.level = level;
    this.randomizer = randomizer;
    this.probability = probability;
    this.terminationEvent = terminationEvent;
  }

  public applyEffect(
    defender: FightingCard,
    _card: FightingCard,
    _context: FightingContext,
  ): EffectResult {
    if (
      this.probability !== undefined &&
      this.randomizer.random() >= this.probability
    )
      return;
    if (defender.isFrozen) return;
    if (defender.isStunted) return;

    const stuntState = new CardStateStunted(
      this.level,
      2 * this.level - 1,
      this.terminationEvent,
    );
    defender.setState(stuntState);

    return { type: this.type, card: defender };
  }
}
