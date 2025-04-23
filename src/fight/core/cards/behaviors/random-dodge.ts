import { Randomizer } from '../../randomizer';
import { DodgeBehavior } from './dodge-behaviors';

export class RandomDodge implements DodgeBehavior {
  public static readonly MAX_AGILITY = 80;

  private randomizer: Randomizer;

  public constructor(randomizer: Randomizer) {
    this.randomizer = randomizer;
  }

  public dodge(defenderAgility: number, attackerAccuracy: number): boolean {
    const dodgeRate = (defenderAgility / RandomDodge.MAX_AGILITY) * 100;
    const reducedDodgeRate = dodgeRate - attackerAccuracy;
    const random = this.randomizer.random_int_between(0, 100);

    return random < reducedDodgeRate;
  }
}
