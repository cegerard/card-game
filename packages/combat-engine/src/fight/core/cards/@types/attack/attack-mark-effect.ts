import { FightingCard } from '../../fighting-card';
import { AttackEffect, MarkEffectResult } from './attack-effect';
import { FightingContext } from '../fighting-context';
import { ElementalMark, MARK_EFFECT_TYPE } from '../mark/elemental-mark';
import { EffectTriggeredDebuff } from './effect-triggered-debuff';
import { Randomizer } from '../../../randomizer';

export class MarkAttackEffect implements AttackEffect {
  public readonly type = MARK_EFFECT_TYPE;
  public readonly rate: number;
  public readonly probability?: number;
  public readonly triggeredDebuff?: EffectTriggeredDebuff;
  private readonly mark: ElementalMark;
  private readonly stacks: number;
  private readonly randomizer: Randomizer;

  constructor(
    mark: ElementalMark,
    randomizer: Randomizer,
    stacks: number = 1,
    probability?: number,
    triggeredDebuff?: EffectTriggeredDebuff,
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
    this.triggeredDebuff = triggeredDebuff;
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

    const effectResult: MarkEffectResult = {
      type: this.type,
      card: defender,
      damageType: this.mark.damageType,
      stacks: defender.applyMark(this.mark, this.stacks),
    };

    const appliedDebuff = this.triggeredDebuff?.tryApply(defender);
    if (appliedDebuff) {
      effectResult.triggeredDebuff = { card: defender, debuff: appliedDebuff };
    }

    return effectResult;
  }
}
