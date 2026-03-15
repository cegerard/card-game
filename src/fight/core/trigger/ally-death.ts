import { Trigger } from './trigger';

export class AllyDeath implements Trigger {
  public id = 'ally-death';
  private targetCardId: string;

  constructor(targetCardId: string) {
    this.targetCardId = targetCardId;
  }

  isTriggered(triggerId: string): boolean {
    return triggerId === `ally-death:${this.targetCardId}`;
  }
}
