import { FightingCard } from '../../cards/fighting-card';
import { CardDeathSubscriber } from '../card-death-subscriber';

export interface CardSelector extends CardDeathSubscriber {
  nextCards(): FightingCard[];
}
