import { CardInfo } from '../../cards/@types/card-info';

export type status = 'dead';

export type StatusChangeReport = {
  card: CardInfo;
  status: status;
};
