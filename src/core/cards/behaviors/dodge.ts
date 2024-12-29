export class DodgeBehavior {
  public dodge(defenderAgility: number, attackerAccuracy: number): boolean {
    return defenderAgility > attackerAccuracy;
  }
}
