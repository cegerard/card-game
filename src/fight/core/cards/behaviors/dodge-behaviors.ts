export interface DodgeBehavior {
  id: string;

  dodge(defenderAgility: number, attackerAccuracy: number): boolean;
}
