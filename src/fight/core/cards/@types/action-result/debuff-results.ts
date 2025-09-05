import { CardInfo } from '../card-info';
import { Debuff } from '../buff/debuff';

export type DebuffResult = {
  target: CardInfo;
  debuff: Debuff;
};

export type DebuffResults = DebuffResult[];
