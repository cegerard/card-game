export interface AttackCondition {
  isTriggered(): boolean;
  tick(): void;
  reset(): void;
}
