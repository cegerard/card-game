import { FightingCard } from 'src/core/cards/fighting-card';

export interface CardSelector {
  nextCards(): FightingCard[];
}
