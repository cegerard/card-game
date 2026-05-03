import { FightingCard } from '../../fighting-card';
import { AttackEffect, EffectResult } from './attack-effect';
import { EffectLevel } from './effect-level';
import { FightingContext } from '../fighting-context';
import { CardStateBurned } from '../state/card-state-burned';
import { EffectTriggeredDebuff } from './effect-triggered-debuff';
import { round2 } from '../../../../tools/round';
import { Randomizer } from '../../../randomizer';

export class BurnAttackEffect implements AttackEffect {
  public readonly rate: number;
  public readonly level: EffectLevel;
  public readonly type = 'burn' as const;
  public readonly triggeredDebuff?: EffectTriggeredDebuff;
  public readonly terminationEvent?: string;
  public readonly probability?: number;
  private readonly randomizer: Randomizer;

  constructor(
    rate: number,
    level: EffectLevel,
    randomizer: Randomizer,
    triggeredDebuff?: EffectTriggeredDebuff,
    terminationEvent?: string,
    probability?: number,
  ) {
    this.rate = rate;
    this.level = level;
    this.randomizer = randomizer;
    this.triggeredDebuff = triggeredDebuff;
    this.terminationEvent = terminationEvent;
    this.probability = probability;
  }

  public applyEffect(
    defender: FightingCard,
    card: FightingCard,
    _context: FightingContext,
  ): EffectResult {
    if (
      this.probability !== undefined &&
      this.randomizer.random() >= this.probability
    )
      return;
    if (defender.burnLevel >= this.level) return;
    if (defender.frozenLevel > this.level) return;

    if (defender.frozenLevel === this.level) {
      defender.unFreeze();
      return;
    }

    let effectLevel = this.level;
    if (defender.frozenLevel > 0 && defender.frozenLevel < this.level) {
      defender.unFreeze();
      effectLevel = effectLevel - 1;
    }

    const burnedState = new CardStateBurned(
      effectLevel,
      this.computeBurnedTurns(effectLevel),
      round2(card.actualAttack * this.rate),
      this.terminationEvent,
    );
    defender.setState(burnedState);

    const effectResult: EffectResult = { type: this.type, card: defender };
    const appliedDebuff = this.triggeredDebuff?.tryApply(defender);
    if (appliedDebuff) {
      effectResult.triggeredDebuff = { card: defender, debuff: appliedDebuff };
    }
    return effectResult;
  }

  private computeBurnedTurns(effectLevel: EffectLevel) {
    return 2 * effectLevel - 1;
  }
}
