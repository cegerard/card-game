import { CardInfo } from '../card-info';
import { Debuff } from '../alteration/alteration-detail';

export type DebuffResult = {
  target: CardInfo;
  debuff: Debuff;
};

export type DebuffResults = DebuffResult[];
