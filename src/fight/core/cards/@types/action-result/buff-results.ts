import { CardInfo } from '../card-info';
import { Buff } from '../alteration/alteration-detail';

export type BuffResult = {
  target: CardInfo;
  alteration: Buff;
};

export type BuffResults = BuffResult[];
