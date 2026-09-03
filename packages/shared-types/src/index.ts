/**
 * Contrat de carte partagé entre le combat-engine et les clients.
 *
 * Source de vérité : les DTO du combat-engine
 * (packages/combat-engine/src/fight/http-api/dto/fight-data.dto.ts).
 * Ce fichier reprend la même forme en TypeScript pur (sans les décorateurs
 * class-validator, propres au serveur), afin que le client construise des
 * cartes conformes à ce que l'API accepte réellement.
 */

// ---------------------------------------------------------------------------
// Enums / unions
// ---------------------------------------------------------------------------

export type DamageType = 'PHYSICAL' | 'FIRE' | 'WATER' | 'EARTH' | 'AIR';

/**
 * Élément d'une carte. Techniquement identique à DamageType : le moteur ne
 * distingue pas les deux. Par convention, aucune carte du roster réel
 * (base Notion) n'est de type `PHYSICAL` — cette valeur n'apparaît que sur
 * le roster de test. Non imposé par le système de types pour ne pas
 * contraindre ces fixtures, vouées à disparaître.
 */
export type Element = DamageType;

export type SpecialKind = 'ATTACK' | 'HEALING';

export type SkillKind =
  | 'HEALING'
  | 'ALTERATION'
  | 'CONDITIONAL_ATTACK'
  | 'TARGETING_OVERRIDE'
  | 'SHIELD'
  | 'SURVIVE';

export type BuffType = 'attack' | 'defense' | 'agility' | 'accuracy';

export type EffectType = 'POISON' | 'BURN' | 'FREEZE' | 'STUNT';

export type DodgeStrategy = 'simple-dodge' | 'random-dodge';

export type TriggerEvent =
  | 'turn-end'
  | 'next-action'
  | 'ally-death'
  | 'enemy-death'
  | 'dormant'
  | 'survived'
  | 'ally-health-below';

export type TargetingStrategy =
  | 'position-based'
  | 'target-all'
  | 'line-three'
  | 'all-owner-cards'
  | 'all-allies'
  | 'self'
  | 'targeted-card'
  | 'last-attacker-of-ally'
  | 'linked-ally';

export type CardSelectorStrategy = 'player-by-player' | 'speed-weighted';

export type AlterationConditionType = 'ally-presence' | 'health-threshold';

// ---------------------------------------------------------------------------
// Skill building blocks
// ---------------------------------------------------------------------------

export interface DamageComposition {
  type: DamageType;
  rate: number;
}

export interface BuffCondition {
  type: AlterationConditionType;
  allyName?: string;
  multiplier?: number;
  threshold?: number;
  operator?: 'below' | 'above';
}

export interface EffectTriggeredDebuff {
  debuffType: BuffType;
  debuffRate: number;
  duration: number;
  probability: number;
  terminationEvent?: string;
  powerId?: string;
}

export interface EffectConfig {
  type: EffectType;
  rate: number;
  level: number;
  triggeredDebuff?: EffectTriggeredDebuff;
  terminationEvent?: string;
  probability?: number;
}

export interface StatAlteration {
  type: BuffType;
  rate: number;
  duration: number;
  /** `targeted-card` réservé aux skills TARGETING_OVERRIDE. */
  targetingStrategy: Exclude<TargetingStrategy, 'targeted-card'>;
  polarity: 'buff' | 'debuff';
  condition?: BuffCondition;
  terminationEvent?: string;
}

export interface ShieldApplication {
  rate: number;
  duration: number;
  targetingStrategy: Exclude<TargetingStrategy, 'targeted-card'>;
}

export interface SpecialSkill {
  kind: SpecialKind;
  name: string;
  damages?: DamageComposition[];
  rate?: number;
  energy: number;
  targetingStrategy: Exclude<TargetingStrategy, 'targeted-card'>;
  effect?: EffectConfig;
  statAlterations?: StatAlteration[];
  shieldApplication?: ShieldApplication;
}

export interface SimpleAttackSkill {
  name: string;
  damages: DamageComposition[];
  targetingStrategy: Exclude<TargetingStrategy, 'targeted-card'>;
  effects?: EffectConfig[];
}

export interface MultipleAttackSkill {
  name: string;
  hits: number;
  damages: DamageComposition[];
  targetingStrategy: Exclude<TargetingStrategy, 'targeted-card'>;
  amplifier?: number;
  effects?: EffectConfig[];
  comboFinisher?: DamageComposition[];
}

export interface OtherSkill {
  kind: SkillKind;
  name: string;
  /** Requis pour HEALING, ALTERATION, SHIELD. */
  rate?: number;
  /** Absent uniquement pour SURVIVE. */
  targetingStrategy?: TargetingStrategy;
  /** Absent pour SHIELD et SURVIVE. */
  event?: TriggerEvent;
  /** Requis pour ALTERATION. */
  buffType?: BuffType;
  duration?: number;
  polarity?: 'buff' | 'debuff';
  activationCondition?: BuffCondition;
  /** Requis pour CONDITIONAL_ATTACK. */
  damages?: DamageComposition[];
  interval?: number;
  hits?: number;
  amplifier?: number;
  effect?: EffectConfig;
  comboFinisher?: DamageComposition[];
  /** Requis quand event vaut ally-death, enemy-death ou ally-health-below. */
  targetCardId?: string;
  terminationEvent?: string;
  activationLimit?: number;
  endEvent?: string;
  powerId?: string;
  /** Requis quand event vaut dormant. */
  activationEvent?: TriggerEvent;
  activationTargetCardId?: string;
  replacementEvent?: TriggerEvent;
}

export interface SkillSet {
  special: SpecialSkill;
  /** Exactement l'un de simpleAttack ou multipleAttack. */
  simpleAttack?: SimpleAttackSkill;
  multipleAttack?: MultipleAttackSkill;
  others: OtherSkill[];
}

export interface Behaviors {
  dodge: DodgeStrategy;
}

// ---------------------------------------------------------------------------
// Configuration de combat — forme exacte attendue par POST /fight
// (FightingCardDto). Champs plats : c'est le format de transport, pas de
// design ; il ne doit pas dériver du DTO moteur.
// ---------------------------------------------------------------------------

export interface CardConfig {
  id: string;
  name: string;
  attack: number;
  defense: number;
  health: number;
  speed: number;
  agility: number;
  accuracy: number;
  /** Taux entre 0 et 1 (pas un pourcentage). */
  criticalChance: number;
  /** Optionnel côté moteur ; retombe sur PHYSICAL si absent. */
  element?: DamageType;
  skills: SkillSet;
  behaviors: Behaviors;
  image?: string;
  cardDeckIdentity?: string;
}

export interface FightResult {
  [step: number]: { kind: string; [key: string]: unknown };
}

// ---------------------------------------------------------------------------
// Définition de carte — donnée de design, distincte de la configuration de
// combat ci-dessus. Voir Notion > Les cartes > Système d'expérience > Plan
// d'implémentation > Étape 1 pour le contexte de cette séparation.
// ---------------------------------------------------------------------------

/**
 * Valeurs de la base Notion "Cartes". `Guerrier` correspond à l'archétype
 * Bruiser/Fighter documenté dans le calcul du score global.
 */
export type Archetype = 'Tank' | 'DPS' | 'Assassin' | 'Support' | 'Guerrier';

/**
 * Les six caractéristiques utilisées par le score global et le système
 * d'expérience. Résistance et Régénération en sont volontairement exclues :
 * elles ne sont pas implémentées dans le moteur de combat.
 */
export interface CardStats {
  attack: number;
  defense: number;
  health: number;
  speed: number;
  /** Précisions. */
  accuracy: number;
  /** Esquive. */
  agility: number;
}

export interface CardDefinition {
  id: string;
  name: string;
  archetype: Archetype;
  element: Element;
  stats: CardStats;
  /** Taux entre 0 et 1. Hors système d'expérience. */
  criticalChance: number;
  /**
   * Renseignées en base Notion, non transmises au moteur de combat tant
   * qu'elles n'y sont pas implémentées. Voir Notion > Les cartes.
   */
  resistance?: number;
  regeneration?: number;
  skills: SkillSet;
  behaviors: Behaviors;
  image?: string;
}

/**
 * Projette une définition de carte vers la configuration attendue par
 * POST /fight. Aujourd'hui une simple recopie des champs communs ;
 * `archetype`, `resistance` et `regeneration` restent côté définition,
 * jamais transmis au moteur.
 *
 * C'est le point d'insertion prévu pour la conversion d'expérience
 * (Notion > Système d'expérience) : à l'étape 4 du plan, cette fonction
 * prendra l'XP cumulée et le palier de la carte en paramètres et appliquera
 * les multiplicateurs avant de renvoyer le CardConfig.
 */
export function toCombatConfig(definition: CardDefinition): CardConfig {
  return {
    id: definition.id,
    name: definition.name,
    attack: definition.stats.attack,
    defense: definition.stats.defense,
    health: definition.stats.health,
    speed: definition.stats.speed,
    agility: definition.stats.agility,
    accuracy: definition.stats.accuracy,
    criticalChance: definition.criticalChance,
    element: definition.element,
    skills: definition.skills,
    behaviors: definition.behaviors,
    image: definition.image,
  };
}
