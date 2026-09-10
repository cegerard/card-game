import { FightingCard } from '../../fighting-card';
import { AttackEffect, MarkEffectResult } from './attack-effect';
import { FightingContext } from '../fighting-context';
import { ElementalMark, MARK_EFFECT_TYPE } from '../mark/elemental-mark';
import { Randomizer } from '../../../randomizer';

export class MarkAttackEffect implements AttackEffect {
  public readonly type = MARK_EFFECT_TYPE;
  public readonly rate: number;
  public readonly probability?: number;
  private readonly mark: ElementalMark;
  private readonly stacks: number;
  private readonly randomizer: Randomizer;

  constructor(
    mark: ElementalMark,
    randomizer: Randomizer,
    stacks: number = 1,
    probability?: number,
  ) {
    if (stacks < 1) {
      throw new Error(
        `MarkAttackEffect stacks must be greater than or equal to 1, got ${stacks}`,
      );
    }

    this.mark = mark;
    this.rate = mark.ratePerStack;
    this.stacks = stacks;
    this.randomizer = randomizer;
    this.probability = probability;
  }

  public applyEffect(
    defender: FightingCard,
    _card: FightingCard,
    _context: FightingContext,
  ): MarkEffectResult {
    if (
      this.probability !== undefined &&
      this.randomizer.random() >= this.probability
    )
      return;
    if (defender.markStacks(this.mark.damageType) >= this.mark.maxStacks)
      return;

    return {
      type: this.type,
      card: defender,
      damageType: this.mark.damageType,
      stacks: defender.applyMark(this.mark, this.stacks),
    };
  }
}
