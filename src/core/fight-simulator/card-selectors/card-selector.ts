import { FightingCard } from '../../cards/fighting-card';

export interface CardSelector {
  nextCards(): FightingCard[];
}
