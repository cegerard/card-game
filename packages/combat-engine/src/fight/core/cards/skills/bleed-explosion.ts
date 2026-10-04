import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { AttackResult } from '../@types/action-result/attack-result';
import { Trigger } from '../../trigger/trigger';
import { round2 } from '../../../tools/round';
import { Skill, SkillKind, SkillResults } from './skill';

/**
 * Makes every bleed on the board burst: each living card carrying a stack,
 * whatever its team, takes `rate` of its source attack — once per card, not
 * per stack — as real damage ignoring defense, then loses its stacks.
 *
 * Meant for `self-death` with a `requiredStance`, a card's last words while a
 * power runs: the stance outlives its dead bearer until the death cascade ends.
 */
export class BleedExplosionSkill implements Skill {
  public readonly id = 'bleed-explosion';

  constructor(
    public readonly name: string,
    private readonly rate: number,
    private readonly trigger: Trigger,
    public readonly requiredStance?: string,
  ) {
    if (rate <= 0) {
      throw new Error(
        `BleedExplosionSkill rate must be greater than 0, got ${rate}`,
      );
    }
  }

  launch(source: FightingCard, context: FightingContext): SkillResults {
    const damage = round2(source.attackPower(context) * this.rate);
    const bleedingCards = [
      ...context.sourcePlayer.playableCards,
      ...context.opponentPlayer.playableCards,
    ].filter((card) => card.bleedStacks() > 0);

    return {
      skillKind: SkillKind.Attack,
      name: this.name,
      results: bleedingCards.map((card): AttackResult => {
        const dealt = card.addRealDamage(damage);

        return {
          damage: dealt,
          isCritical: false,
          dodge: false,
          defender: card,
          remainingHealth: card.actualHealth,
          consumedBleedStacks: card.consumeBleedStacks(),
        };
      }),
    };
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }
}
