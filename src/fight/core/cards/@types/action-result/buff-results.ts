import { CardInfo } from '../card-info';
import { AlterationDetail } from '../alteration/alteration-detail';

export type BuffResult = {
  target: CardInfo;
  alteration: AlterationDetail;
};

export type BuffResults = BuffResult[];
