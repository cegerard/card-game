import { CardInfo } from '../../cards/@types/card-info';

export type status = 'dead' | 'poisoned';

export type StatusChangeReport = {
  card: CardInfo;
  status: status;
};
