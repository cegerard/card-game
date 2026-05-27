import { FightingCard } from '../../fighting-card';
import { FightingContext } from '../fighting-context';
import { CardStateFrozen } from '../state/card-state-frozen';
import { AttackEffect, EffectResult } from './attack-effect';
import { EffectLevel } from './effect-level';
import { EffectTriggeredDebuff } from './effect-triggered-debuff';
import { Randomizer } from '../../../randomizer';

export class FreezeAttackEffect implements AttackEffect {
  public readonly rate: number;
  public readonly level: EffectLevel;
  public readonly type = 'freeze' as const;
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
    _card: FightingCard,
    _context: FightingContext,
  ): EffectResult {
    if (
      this.probability !== undefined &&
      this.randomizer.random() >= this.probability
    )
      return;
    if (defender.frozenLevel >= this.level) return;
    if (defender.burnLevel > this.level) return;

    if (defender.burnLevel === this.level) {
      defender.unBurn();
      return;
    }

    let effectLevel = this.level;
    if (defender.burnLevel > 0 && defender.burnLevel < this.level) {
      defender.unBurn();
      effectLevel = effectLevel - 1;
    }

    const frozenState = new CardStateFrozen(
      effectLevel,
      this.computeFrozenTurns(effectLevel),
      this.rate,
      this.terminationEvent,
    );
    defender.setState(frozenState);

    const effectResult: EffectResult = { type: this.type, card: defender };
    const appliedDebuff = this.triggeredDebuff?.tryApply(defender);
    if (appliedDebuff) {
      effectResult.triggeredDebuff = { card: defender, debuff: appliedDebuff };
    }
    return effectResult;
  }

  private computeFrozenTurns(effectLevel: EffectLevel): number {
    return 2 * effectLevel - 1;
  }
}
