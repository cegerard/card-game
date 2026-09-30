import { FightingCard } from '../fighting-card';

/**
 * Takes the agility bonuses away from a bleeding defender, against its owner
 * only: the defender dodges with its base agility minus its debuffs.
 *
 * Like `SurviveSkill`, this is not a `Skill` implementor: it has no event
 * trigger and no targeting strategy. It is consulted by
 * `FightingCard.dodge()` on every attack its owner makes.
 */
export class DodgeBonusDenialSkill {
  constructor(public readonly name: string) {}

  public appliesTo(defender: FightingCard): boolean {
    return defender.bleedStacks() > 0;
  }
}
