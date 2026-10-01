import { FightingContext } from '../@types/fighting-context';

/**
 * Raises its owner attack by `perStackRate` for every bleed stack on the
 * board, both teams counted, up to `maxRate`.
 *
 * Like `SurviveSkill`, this is not a `Skill` implementor: it has no event
 * trigger and no targeting strategy. The bonus is read from the live board
 * each time `FightingCard.attackPower()` is, so it follows the stacks as they
 * are applied and expire.
 */
export class StackScalingSkill {
  constructor(
    public readonly name: string,
    private readonly perStackRate: number,
    private readonly maxRate: number,
  ) {
    if (perStackRate <= 0) {
      throw new Error(
        `StackScalingSkill perStackRate must be greater than 0, got ${perStackRate}`,
      );
    }
    if (maxRate <= 0) {
      throw new Error(
        `StackScalingSkill maxRate must be greater than 0, got ${maxRate}`,
      );
    }
  }

  public bonusFor(context: FightingContext | undefined): number {
    if (!context) return 0;

    const stacks = [
      ...context.sourcePlayer.playableCards,
      ...context.opponentPlayer.playableCards,
    ].reduce((sum, card) => sum + card.bleedStacks(), 0);

    return Math.min(stacks * this.perStackRate, this.maxRate);
  }
}
