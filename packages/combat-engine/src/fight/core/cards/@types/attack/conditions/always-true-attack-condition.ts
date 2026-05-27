import { AttackCondition } from '../attack-condition';

export class AlwaysTrueAttackCondition implements AttackCondition {
  isTriggered(): boolean {
    return true;
  }

  tick(): void {}

  reset(): void {}
}
