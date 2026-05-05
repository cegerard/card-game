import { CardInfo } from '../card-info';
import { AlterationDetail } from '../alteration/alteration-detail';

export type BuffResult = {
  target: CardInfo;
  buff: AlterationDetail;
};

export type BuffResults = BuffResult[];
