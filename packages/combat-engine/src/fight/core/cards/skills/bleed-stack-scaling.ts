import { FightingContext } from '../@types/fighting-context';

/**
 * Raises its owner attack by `perStackRate` for every bleed stack on the
 * board, both teams counted, up to `maxRate`. Dedicated to the bleed: it is
 * the one stacked status, and the kit it serves scales on nothing else.
 *
 * Like `SurviveSkill`, this is not a `Skill` implementor: it has no event
 * trigger and no targeting strategy. The bonus is read from the live board
 * each time `FightingCard.attackPower()` is, so it follows the stacks as they
 * are applied and expire.
 */
export class BleedStackScalingSkill {
  constructor(
    public readonly name: string,
    private readonly perStackRate: number,
    private readonly maxRate: number,
  ) {
    if (perStackRate <= 0) {
      throw new Error(
        `BleedStackScalingSkill perStackRate must be greater than 0, got ${perStackRate}`,
      );
    }
    if (maxRate <= 0) {
      throw new Error(
        `BleedStackScalingSkill maxRate must be greater than 0, got ${maxRate}`,
      );
    }
  }

  /** The factor its owner attack is multiplied by: 1 when nothing bleeds. */
  public multiplierFor(context: FightingContext | undefined): number {
    if (!context) return 1;

    const stacks = [
      ...context.sourcePlayer.playableCards,
      ...context.opponentPlayer.playableCards,
    ].reduce((sum, card) => sum + card.bleedStacks(), 0);

    return 1 + Math.min(stacks * this.perStackRate, this.maxRate);
  }
}
