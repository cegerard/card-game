import { FightingCard } from '../fighting-card';
import { AttackEffect } from './attack-effect';
import { CardStatePoisoned } from './card-state-poisoned';
import { EffectLevel } from './effect-level';
import { FightingContext } from './fighting-context';

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
  ): void {
    const poisonedState = new CardStatePoisoned(
      3,
      card.actualAttack * this.rate,
    );
    defender.setState(poisonedState);
  }
}
