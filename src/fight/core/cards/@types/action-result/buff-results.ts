import { CardInfo } from '../card-info';
import { Buff } from '../buff/buff';

export type BuffResult = {
  target: CardInfo;
  buff: Buff;
};

export type BuffResults = BuffResult[];
