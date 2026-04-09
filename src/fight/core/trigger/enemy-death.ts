import { Trigger } from './trigger';

export class EnemyDeath implements Trigger {
  public id = 'enemy-death';
  private targetCardId: string;

  constructor(targetCardId: string) {
    this.targetCardId = targetCardId;
  }

  isTriggered(triggerId: string): boolean {
    return triggerId === `enemy-death:${this.targetCardId}`;
  }
}
