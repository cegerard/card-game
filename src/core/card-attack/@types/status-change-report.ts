import { FightingCard } from '../../cards/fighting-card';

export type status = 'dead';

export type StatusChangeReport = {
  card: FightingCard;
  status: status;
};
