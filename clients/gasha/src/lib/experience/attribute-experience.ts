import type { CombatStats } from '$lib/combat/combatStats.js';
import type { ProgressionStore } from '$lib/progression/progression-store.js';

const XP_BASE = 100;
const RESULT_VICTORY = 1;
const RESULT_DEFEAT = 0.3;
const PARTICIPATION_SURVIVED = 1;
const PARTICIPATION_KO = 0.5;
const PARTICIPATION_NOT_ENGAGED = 0;

/**
 * Valeur utilisée quand aucune difficulté n'est fournie à
 * attributeExperience (tests, appels ne calculant pas encore le ratio).
 * En production, +page.svelte calcule le ratio réel via
 * computeDifficulty (étape 6 du plan) et le transmet explicitement.
 */
const DEFAULT_DIFFICULTY = 1;

/** Facteur Résultat : victoire si le vainqueur du combat est le joueur. */
export function computeCombatResult(
  winner: string | null,
  playerName: string,
): number {
  return winner === playerName ? RESULT_VICTORY : RESULT_DEFEAT;
}

/**
 * Facteur Participation d'une carte. Une carte absente de `playerCards`
 * n'a jamais agi ni subi d'action pendant le combat : c'est le cas
 * « Non engagée » documenté (0 XP).
 */
export function computeParticipation(
  cardId: string,
  playerCards: CombatStats['playerCards'],
): number {
  const stat = playerCards.find((c) => c.id === cardId);
  if (!stat) return PARTICIPATION_NOT_ENGAGED;
  return stat.isDead ? PARTICIPATION_KO : PARTICIPATION_SURVIVED;
}

/** XP gagnée pour un combat : XP_base × Résultat × Participation × Difficulté. */
export function computeXpGain(
  result: number,
  participation: number,
  difficulty: number = DEFAULT_DIFFICULTY,
): number {
  return XP_BASE * result * participation * difficulty;
}

/**
 * Crédite l'XP de fin de combat à chaque carte engagée du deck du joueur,
 * et persiste le résultat via le contrat de l'étape 2. Une carte dont le
 * gain est nul (non engagée) n'est pas réécrite. La difficulté par défaut
 * (1) est utilisée si l'appelant ne calcule pas encore le ratio réel.
 */
export function attributeExperience(
  playerCardIds: string[],
  combatStats: CombatStats,
  playerName: string,
  progressionStore: ProgressionStore,
  difficulty: number = DEFAULT_DIFFICULTY,
): void {
  const result = computeCombatResult(combatStats.winner, playerName);
  for (const cardId of playerCardIds) {
    const participation = computeParticipation(cardId, combatStats.playerCards);
    const gain = computeXpGain(result, participation, difficulty);
    if (gain === 0) continue;
    const current = progressionStore.getProgression(cardId);
    progressionStore.setProgression({
      ...current,
      experience: current.experience + gain,
    });
  }
}
