export interface Trigger {
  id: string;

  isTriggered(triggerId: string): boolean;
}
