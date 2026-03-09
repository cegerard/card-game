import { AttackCondition } from '../attack-condition';

export class EveryNTurnsCondition implements AttackCondition {
  private counter: number = 0;

  constructor(private readonly n: number) {}

  isTriggered(): boolean {
    return this.counter >= this.n;
  }

  tick(): void {
    this.counter++;
  }

  reset(): void {
    this.counter = 0;
  }
}
