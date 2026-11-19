import { DamageType, type Step } from '@card-game/shared-types';
import { DamageComposition } from '../../src/fight/core/cards/@types/damage/damage-composition';
import { CardState } from '../../src/fight/core/cards/@types/state/card-state';
import { FightingCard } from '../../src/fight/core/cards/fighting-card';
import { PlayerByPlayerCardSelector } from '../../src/fight/core/fight-simulator/card-selectors/player-by-player';
import { Fight } from '../../src/fight/core/fight-simulator/fight';
import { Player } from '../../src/fight/core/player';
import { createFightingCard } from './fighting-card';

/*
 * One-on-one fights to check how a status effect behaves: a fast striker
 * against a slow, defenceless target, and builders for the steps the fight
 * reports, so a spec reads as the exact sequence it expects.
 */

type LevelEffect = { type: string; rate: number; level: 1 | 2 | 3 };

const physicalHit = [new DamageComposition(DamageType.PHYSICAL, 1.0)];

/** Plays first, hits for its whole `attack`, laying `effect` on every hit. */
export const striker = (effect?: LevelEffect, attack = 100): FightingCard =>
  createFightingCard({
    attack,
    defense: 100,
    health: 100,
    speed: 100,
    criticalChance: 0,
    agility: 0,
    skills: { simpleAttack: { damages: physicalHit, effect } },
  });

/** Plays second, no defense, hits for 1: it already carries `state`. */
export const target = (health: number, state?: CardState): FightingCard => {
  const card = createFightingCard({
    attack: 1,
    defense: 0,
    health,
    speed: 1,
    criticalChance: 0,
    agility: 0,
    skills: { simpleAttack: { damages: physicalHit } },
  });
  if (state) card.setState(state);
  return card;
};

/** Plays `first` against `second`, player by player: every step but fight_start. */
export const duel = (first: FightingCard, second: FightingCard): Step[] => {
  const player1 = new Player('Player 1', [first]);
  const player2 = new Player('Player 2', [second]);
  const selector = new PlayerByPlayerCardSelector(player1, player2);
  return Object.values(new Fight(player1, player2, selector).start()).slice(1);
};

/** A plain attack landing one hit, neither dodged nor critical. */
export const hit = (
  attacker: FightingCard,
  defender: FightingCard,
  damage: number,
  remainingHealth: number,
  energy = 10,
) => ({
  kind: 'attack',
  attacker: attacker.identityInfo,
  damages: [
    {
      defender: defender.identityInfo,
      damage,
      dodge: false,
      isCritical: false,
      remainingHealth,
    },
  ],
  energy,
});

/** A status ticking on `card` at turn end. */
export const tick = (
  card: FightingCard,
  type: string,
  damage: number,
  remainingHealth: number,
  remainingTurns = 0,
) => ({
  kind: 'state_effect',
  type,
  card: card.identityInfo,
  damage,
  remainingTurns,
  remainingHealth,
});

export const statusChange = (card: FightingCard, status: string) => ({
  kind: 'status_change',
  card: card.identityInfo,
  status,
});

const fightEnd = (winner: string) => ({ kind: 'fight_end', winner });

/** How every duel ends: `card` dies, then `winner` wins. */
export const knockOut = (card: FightingCard, winner: string) => [
  statusChange(card, 'dead'),
  fightEnd(winner),
];
