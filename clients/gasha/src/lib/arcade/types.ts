import type { CardDefinition } from '@card-game/shared-types';

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

export type Step =
  | { kind: 'attack'; [key: string]: unknown }
  | { kind: 'special_attack'; [key: string]: unknown }
  | { kind: 'healing'; [key: string]: unknown }
  | { kind: 'status_change'; card: { name: string }; status: string }
  | { kind: 'fight_end'; winner?: string }
  | { kind: string; [key: string]: unknown };

export interface FightResult {
  [step: number]: Step;
}
