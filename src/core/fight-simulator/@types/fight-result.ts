import { Step } from './step';

export type StepKind =
  | 'fight_end'
  | 'status_change'
  | 'attack'
  | 'special_attack'
  | 'winner';

export type FightResult = {
  [step: number]: { kind: StepKind } & Step;
};
