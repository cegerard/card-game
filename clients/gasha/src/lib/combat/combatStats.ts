import type { CardInfo } from '@card-game/shared-types';
import type { FightResult, Step } from '$lib/arcade/types.js';

export interface CardStat {
  id: string;
  name: string;
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  isDead: boolean;
}

export interface CombatStats {
  playerCards: CardStat[];
  enemyCards: CardStat[];
  winner: string | null;
}

function getOrCreate(statsMap: Map<string, CardStat>, { id, name }: CardInfo): CardStat {
  if (!statsMap.has(id)) {
    statsMap.set(id, { id, name, damageDealt: 0, damageTaken: 0, healingDone: 0, isDead: false });
  }
  return statsMap.get(id)!;
}

export function aggregateCombatStats(fightResult: FightResult, playerCardIds: string[]): CombatStats {
  const playerIds = new Set(playerCardIds);
  const statsMap = new Map<string, CardStat>();
  let winner: string | null = null;

  // Object.values types an object with a number index as any[]
  const steps: Step[] = Object.values(fightResult);
  for (const step of steps) {
    switch (step.kind) {
      case 'attack':
      case 'special_attack': {
        const attacker = getOrCreate(statsMap, step.attacker);
        for (const hit of step.damages.filter((d) => !d.dodge)) {
          attacker.damageDealt += hit.damage;
          getOrCreate(statsMap, hit.defender).damageTaken += hit.damage;
        }
        break;
      }
      case 'state_effect':
        getOrCreate(statsMap, step.card).damageTaken += step.damage;
        break;
      case 'healing': {
        const source = getOrCreate(statsMap, step.source);
        for (const h of step.heal) {
          source.healingDone += h.healed;
        }
        break;
      }
      case 'status_change':
        if (step.status === 'dead') {
          getOrCreate(statsMap, step.card).isDead = true;
        }
        break;
      case 'fight_end':
        winner = step.winner;
        break;
    }
  }

  const allStats = Array.from(statsMap.values());
  return {
    playerCards: allStats.filter((c) => playerIds.has(c.id)),
    enemyCards: allStats.filter((c) => !playerIds.has(c.id)),
    winner,
  };
}
