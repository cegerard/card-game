import { Trigger } from './trigger';

type DeathPrefix = 'ally-death' | 'enemy-death';

export class DeathTrigger implements Trigger {
  public id: DeathPrefix;
  private targetCardId: string;

  constructor(prefix: DeathPrefix, targetCardId: string) {
    this.id = prefix;
    this.targetCardId = targetCardId;
  }

  isTriggered(triggerId: string): boolean {
    return triggerId === `${this.id}:${this.targetCardId}`;
  }
}
