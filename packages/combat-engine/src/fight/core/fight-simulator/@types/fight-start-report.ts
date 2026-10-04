import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

/** Opens the report: every card of both decks with the health it can reach. */
export type FightStartReport = {
  kind: StepKind.FightStart;
  cards: { card: CardInfo; maxHealth: number }[];
};
