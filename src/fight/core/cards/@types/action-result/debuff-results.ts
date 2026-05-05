import { CardInfo } from '../card-info';
import { AlterationDetail } from '../alteration/alteration-detail';

export type DebuffResult = {
  target: CardInfo;
  debuff: AlterationDetail;
};

export type DebuffResults = DebuffResult[];
