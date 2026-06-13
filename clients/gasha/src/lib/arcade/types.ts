export type ArcadePhase =
  | 'idle'
  | 'combat'
  | 'victory'
  | 'game-over'
  | 'final-victory';

export interface ArcadeSession {
  currentLevel: number;
  phase: ArcadePhase;
  fightResult: FightResult | null;
}

export interface ArcadeLevel {
  index: number;
  name: string;
  enemyTeam: CardConfig[];
}

export interface CardConfig {
  id: string;
  name: string;
  attack: number;
  defense: number;
  health: number;
  speed: number;
  agility: number;
  accuracy: number;
  criticalChance: number;
  element?: string;
  skills: {
    special: SpecialConfig;
    simpleAttack: SimpleAttackConfig;
    others: OtherSkillConfig[];
  };
  behaviors: {
    dodge: 'simple-dodge' | 'random-dodge';
  };
}

export interface DamageCompositionConfig {
  type: 'PHYSICAL' | 'FIRE' | 'WATER' | 'EARTH' | 'AIR';
  rate: number;
}

export interface SpecialConfig {
  kind: 'ATTACK' | 'HEALING';
  name: string;
  damages?: DamageCompositionConfig[];
  rate?: number;
  energy: number;
  targetingStrategy: string;
}

export interface SimpleAttackConfig {
  name: string;
  damages: DamageCompositionConfig[];
  targetingStrategy: string;
}

export interface OtherSkillConfig {
  kind: string;
  name: string;
  rate?: number;
  targetingStrategy?: string;
  event?: string;
  buffType?: string;
  duration?: number;
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
