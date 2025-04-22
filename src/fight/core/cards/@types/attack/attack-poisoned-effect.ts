import { FightingCard } from '../../fighting-card';
import { AttackEffect, EffectResult } from './attack-effect';
import { CardStatePoisoned } from '../state/card-state-poisoned';
import { EffectLevel } from './effect-level';
import { FightingContext } from '../fighting-context';

export class PoisonedAttackEffect implements AttackEffect {
  public readonly rate: number;
  public readonly level: EffectLevel;

  constructor(rate: number, level: EffectLevel) {
    this.rate = rate;
    this.level = level;
  }

  public applyEffect(
    defender: FightingCard,
    card: FightingCard,
    _context: FightingContext,
  ): EffectResult {
    if (defender.isPoisoned()) return;

    const poisonedState = new CardStatePoisoned(
      3,
      card.actualAttack * this.rate,
    );
    defender.setState(poisonedState);

    return { type: 'poisoned', card: defender };
  }
}
