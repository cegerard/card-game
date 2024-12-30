import { DodgeBehavior } from './dodge-behaviors';

export class SimpleDodge implements DodgeBehavior {
  public dodge(defenderAgility: number, attackerAccuracy: number): boolean {
    return defenderAgility > attackerAccuracy;
  }
}
