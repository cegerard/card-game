import { toCombatConfig } from '@card-game/shared-types';
import type { CardConfig, CardDefinition } from '@card-game/shared-types';
import { PLAYER_NAME, fetchFight } from '$lib/combat/engine-client.js';
import { aggregateCombatStats } from '$lib/combat/combatStats.js';
import { attributeExperience } from '$lib/experience/attribute-experience.js';
import type { ProgressionStore } from '$lib/progression/progression-store.js';
import { defaultProgression } from '$lib/progression/types.js';
import {
  computeDifficulty,
  computeTeamPower,
} from '$lib/score/combat-power.js';
import { ARCADE_LEVELS } from './levels.js';
import type { ArcadeLevel, ArcadePhase, FightResult } from './types.js';

/** Écran qui suit un combat. */
export type FightOutcomePhase = Extract<
  ArcadePhase,
  'victory' | 'final-victory' | 'game-over'
>;

/** Gain d'XP d'une carte, nommé pour l'écran de fin de combat. */
export interface NamedXpGain {
  cardId: string;
  name: string;
  gain: number;
}

export interface FightSettlement {
  phase: FightOutcomePhase;
  xpGains: NamedXpGain[];
}

/** Combat d'un niveau : le deck du joueur, XP appliquée, contre l'équipe du niveau. */
export function fightLevel(
  level: ArcadeLevel,
  playerDeck: CardConfig[],
): Promise<FightResult> {
  return fetchFight(
    playerDeck,
    level.enemyTeam.map(toCombatConfig),
    level.name,
  );
}

/**
 * Solde un combat joué : crédite l'XP aux cartes engagées du joueur et
 * donne l'écran qui suit.
 */
export function settleFight(
  level: ArcadeLevel,
  fightResult: FightResult,
  playerDeck: CardDefinition[],
  progression: ProgressionStore,
): FightSettlement {
  const playerCardIds = playerDeck.map((card) => card.id);
  const combatStats = aggregateCombatStats(fightResult, playerCardIds);
  // Difficulté lue avant l'attribution : la progression de ce combat ne
  // doit pas influencer sa propre difficulté.
  const difficulty = levelDifficulty(level, playerDeck, progression);
  const gains = attributeExperience(
    playerCardIds,
    combatStats,
    PLAYER_NAME,
    progression,
    difficulty,
  );
  return {
    phase: phaseAfter(level, combatStats.winner),
    xpGains: gains.map(({ cardId, gain }) => ({
      cardId,
      name: playerDeck.find((card) => card.id === cardId)!.name,
      gain,
    })),
  };
}

function levelDifficulty(
  level: ArcadeLevel,
  playerDeck: CardDefinition[],
  progression: ProgressionStore,
): number {
  const playerPower = computeTeamPower(
    playerDeck.map((definition) => ({
      definition,
      progression: progression.getProgression(definition.id),
    })),
  );
  const opponentPower = computeTeamPower(
    level.enemyTeam.map((definition) => ({
      definition,
      progression: defaultProgression(definition.id),
    })),
  );
  return computeDifficulty(opponentPower, playerPower);
}

function phaseAfter(
  level: ArcadeLevel,
  winner: string | null,
): FightOutcomePhase {
  if (winner !== PLAYER_NAME) return 'game-over';
  return level.index >= ARCADE_LEVELS.length ? 'final-victory' : 'victory';
}
