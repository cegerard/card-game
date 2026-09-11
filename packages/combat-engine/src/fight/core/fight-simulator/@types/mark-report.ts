import { CardInfo } from '../../cards/@types/card-info';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { StepKind } from './step';

export type MarkAppliedReport = {
  kind: StepKind.MarkApplied;
  card: CardInfo;
  damageType: DamageType;
  stacks: number;
};
