import type {
  AttackStepReport,
  CardInfo,
  HealingReport,
  StateEffectReport,
  StatusChangeReport,
  WinnerReport,
} from '@card-game/shared-types';

const card = (id: string, name: string): CardInfo => ({
  id,
  name,
  deckIdentity: `${id}-deck`,
});

export const warrior = card('p1', 'Warrior');
export const healer = card('p2', 'Healer');
export const goblin = card('e1', 'Goblin');

export const attack = (
  attacker: CardInfo,
  defender: CardInfo,
  damage: number,
  dodge = false,
): AttackStepReport => ({
  kind: 'attack',
  attacker,
  damages: [
    { defender, damage, dodge, isCritical: false, remainingHealth: 100 },
  ],
  energy: 0,
});

export const heal = (
  source: CardInfo,
  target: CardInfo,
  healed: number,
): HealingReport => ({
  kind: 'healing',
  source,
  heal: [{ target, healed, remainingHealth: 100 }],
  energy: 0,
});

export const poisonTick = (
  target: CardInfo,
  damage: number,
): StateEffectReport => ({
  kind: 'state_effect',
  type: 'poison',
  card: target,
  damage,
  remainingTurns: 1,
  remainingHealth: 100,
});

export const death = (target: CardInfo): StatusChangeReport => ({
  kind: 'status_change',
  card: target,
  status: 'dead',
});

export const fightEnd = (winner: string | null): WinnerReport => ({
  kind: 'fight_end',
  winner,
});
