import { CardInfo } from '../card-info';
import { Buff } from '../alteration/buff';

export type BuffResult = {
  target: CardInfo;
  buff: Buff;
};

export type BuffResults = BuffResult[];
