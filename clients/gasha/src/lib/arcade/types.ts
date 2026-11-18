import type { CardDefinition, FightResult } from '@card-game/shared-types';

// Le contrat de carte (CardConfig et ses composants) vit désormais dans
// @card-game/shared-types, contrat unique partagé avec le combat-engine.
// Voir Notion > Les cartes > Système d'expérience > Plan d'implémentation.
export type {
  CardConfig,
  DamageComposition as DamageCompositionConfig,
  SpecialSkill as SpecialConfig,
  EffectConfig,
  SimpleAttackSkill as SimpleAttackConfig,
  OtherSkill as OtherSkillConfig,
  FightRequest,
  FightResult,
  Step,
} from '@card-game/shared-types';

export type ArcadePhase =
  'idle' | 'combat' | 'victory' | 'game-over' | 'final-victory';

export interface ArcadeSession {
  currentLevel: number;
  phase: ArcadePhase;
  fightResult: FightResult | null;
}

export interface ArcadeLevel {
  index: number;
  name: string;
  enemyTeam: CardDefinition[];
}
