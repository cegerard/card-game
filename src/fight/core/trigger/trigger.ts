export interface Trigger {
  isTriggered(triggerName: string): boolean;
}
