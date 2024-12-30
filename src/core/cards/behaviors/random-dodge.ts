import { DodgeBehavior } from './dodge-behaviors';

export class RandomDodge implements DodgeBehavior {
  public dodge(defenderAgility: number, attackerAccuracy: number): boolean {
    return defenderAgility > attackerAccuracy;
  }
}
