import type { FightResult } from '$lib/arcade/types.js';

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

interface CardInfo {
  id: string;
  name: string;
}

interface DamageEntry {
  defender: CardInfo;
  damage: number;
  dodge: boolean;
}

interface HealEntry {
  target: CardInfo;
  healed: number;
}

function getOrCreate(statsMap: Map<string, CardStat>, id: string, name: string): CardStat {
  if (!statsMap.has(id)) {
    statsMap.set(id, { id, name, damageDealt: 0, damageTaken: 0, healingDone: 0, isDead: false });
  }
  return statsMap.get(id)!;
}

export function aggregateCombatStats(fightResult: FightResult, playerCardIds: string[]): CombatStats {
  const playerIds = new Set(playerCardIds);
  const statsMap = new Map<string, CardStat>();
  let winner: string | null = null;

  for (const step of Object.values(fightResult)) {
    if (step.kind === 'attack' || step.kind === 'special_attack') {
      const attacker = step['attacker'] as CardInfo | undefined;
      const damages = step['damages'] as DamageEntry[] | undefined;
      if (attacker && damages) {
        getOrCreate(statsMap, attacker.id, attacker.name);
        for (const d of damages) {
          if (!d.dodge) {
            getOrCreate(statsMap, attacker.id, attacker.name).damageDealt += d.damage;
            getOrCreate(statsMap, d.defender.id, d.defender.name).damageTaken += d.damage;
          }
        }
      }
    } else if (step.kind === 'state_effect') {
      const card = step['card'] as CardInfo | undefined;
      const damage = step['damage'] as number | undefined;
      if (card && damage !== undefined) {
        getOrCreate(statsMap, card.id, card.name).damageTaken += damage;
      }
    } else if (step.kind === 'healing') {
      const source = step['source'] as CardInfo | undefined;
      const heal = step['heal'] as HealEntry[] | undefined;
      if (source && heal) {
        const sourceStat = getOrCreate(statsMap, source.id, source.name);
        for (const h of heal) {
          sourceStat.healingDone += h.healed;
        }
      }
    } else if (step.kind === 'status_change') {
      const card = step.card as CardInfo;
      if (step.status === 'dead' && card?.id) {
        getOrCreate(statsMap, card.id, card.name).isDead = true;
      }
    } else if (step.kind === 'fight_end') {
      winner = (step.winner as string | undefined) ?? null;
    }
  }

  const allStats = Array.from(statsMap.values());
  return {
    playerCards: allStats.filter((c) => playerIds.has(c.id)),
    enemyCards: allStats.filter((c) => !playerIds.has(c.id)),
    winner,
  };
}
