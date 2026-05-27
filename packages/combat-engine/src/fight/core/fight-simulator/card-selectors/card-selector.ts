import { FightingCard } from '../../cards/fighting-card';
import { CardDeathSubscriber } from '../card-death-subscriber';

export interface CardSelector extends CardDeathSubscriber {
  id: string;

  nextCards(): FightingCard[];
}
