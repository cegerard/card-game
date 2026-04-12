import { CardInfo } from '../../cards/@types/card-info';

export type status = 'dead' | 'poison' | 'burn' | 'freeze';

export type StatusChangeReport = {
  card: CardInfo;
  status: status;
};
