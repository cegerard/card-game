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

/** STANCE : spéciale qui ne frappe ni ne soigne, elle ouvre une posture sur le lanceur. */
export type SpecialKind = 'ATTACK' | 'HEALING' | 'STANCE';

export type SkillKind =
  | 'HEALING'
  | 'ALTERATION'
  | 'CONDITIONAL_ATTACK'
  | 'TARGETING_OVERRIDE'
  | 'SHIELD'
  | 'SURVIVE'
  | 'TRANSFORMATION'
  | 'DAMAGE_REDUCTION'
  | 'PROTECTION'
  | 'DODGE_BONUS_DENIAL'
  | 'BLEED_STACK_SCALING'
  | 'LOW_HEALTH_TARGET_BONUS'
  | 'STANCE'
  | 'BLEED_EMPOWERMENT'
  | 'BLEED_DETONATION'
  | 'CONCEALMENT';

export type BuffType =
  | 'attack'
  | 'defense'
  | 'agility'
  | 'accuracy'
  | 'speed'
  | 'criticalChance'
  | 'regeneration'
  | 'resistance';

export type EffectType =
  | 'POISON'
  | 'BURN'
  | 'FREEZE'
  | 'STUNT'
  | 'MARK'
  | 'BLEED';

/**
 * Ce que fait un statut à sa cible, et donc ce contre quoi une immunité est
 * accordée : `control` prive du tour, `damage-over-time` ne fait que mordre.
 */
export type StatusCategory = 'control' | 'damage-over-time';

/**
 * Ce dont le taux d'un soin ou d'un saignement est une part. `source-attack`
 * suit l'attaque du lanceur, `target-max-health` les PV max de la carte qui
 * reçoit — ce que veut dire un kit formulé « l'allié récupère 10 % de ses PV
 * par tour » ou « saigne de 2 % de ses PV max par tour ».
 */
export type RateBasis = 'source-attack' | 'target-max-health';

export type DodgeStrategy = 'simple-dodge' | 'random-dodge';

export type TriggerEvent =
  | 'turn-end'
  | 'next-action'
  | 'ally-death'
  | 'enemy-death'
  | 'dormant'
  | 'survived'
  | 'ally-health-below'
  | 'any-ally-health-below'
  | 'self-death'
  | 'enemy-bleed-death'
  | 'turn-start'
  | 'bleed-stacks-applied'
  | 'damage-taken'
  | 'fight-start'
  /** Sur la carte qui a porté le coup fatal ; `activationCondition.threshold` : santé de la victime avant le coup. */
  | 'enemy-killed';

export type TargetingStrategy =
  | 'position-based'
  | 'target-all'
  | 'line-three'
  | 'all-owner-cards'
  | 'all-allies'
  | 'self'
  | 'targeted-card'
  | 'last-attacker-of-ally'
  | 'linked-ally'
  | 'most-wounded-ally'
  | 'protected-ally'
  | 'first-bleeding-enemy';

export type CardSelectorStrategy = 'player-by-player' | 'speed-weighted';

export type AlterationConditionType =
  | 'ally-presence'
  | 'health-threshold'
  | 'probability';

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
  /** Condition 'probability' uniquement : chance d'activation du skill. */
  probability?: number;
}

export interface EffectTriggeredDebuff {
  /**
   * Nom de la pile de cumul. Les debuffs qui le partagent comptent ensemble
   * contre `maxStacks`. Les deux champs vont de pair.
   */
  stackId?: string;
  maxStacks?: number;
  debuffType: BuffType;
  debuffRate: number;
  duration: number;
  probability: number;
  terminationEvent?: string;
  powerId?: string;
}

export interface EffectConfig {
  type: EffectType;
  /**
   * Coefficient de dégâts par tick ; pour MARK, amplification par cumul ;
   * pour BLEED, dégâts de chaque pile par tour.
   */
  rate: number;
  /** Requis sauf pour MARK et BLEED. */
  level?: number;
  /** BLEED uniquement (requis) : tours pendant lesquels chaque pile saigne. */
  duration?: number;
  /** BLEED uniquement : ce dont `rate` est une part (défaut `source-attack`). */
  basis?: RateBasis;
  /** MARK uniquement : type de dégâts amplifié par la marque. */
  damageType?: DamageType;
  /** MARK et BLEED (requis) : nombre maximal de cumuls. */
  maxStacks?: number;
  /** MARK et BLEED : cumuls appliqués par déclenchement (défaut 1). */
  stacks?: number;
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

export interface StanceActivation {
  /** Nom de la posture ouverte sur le lanceur. */
  name: string;
  /** Nombre de tours pendant lesquels elle reste active. */
  duration: number;
  /** Catégories de statuts refusées par le porteur pendant la posture. */
  immunities?: StatusCategory[];
  /** Le porteur peut cibler les ennemis dissimulés pendant la posture. */
  revealsConcealed?: boolean;
}

export interface MarkedTargetBonus {
  damageType: DamageType;
  /** Multiplicateur appliqué aux dégâts, par exemple 1.3 pour +30%. */
  multiplier: number;
}

export interface EnergyRefund {
  /** Énergie conservée après la spéciale au lieu de retomber à 0. */
  amount: number;
  /** Écart Précision − Esquive de la cible principale à dépasser strictement. */
  minAccuracyMargin: number;
}

export interface DamageTypeBonus {
  damageType: DamageType;
  /** Multiplicateur appliqué à la seule part de dégâts de ce type, par exemple 1.2 pour +20%. */
  multiplier: number;
}

export interface BleedStackBonus extends DamageTypeBonus {
  minStacks: number;
}

export interface AttackBonuses {
  /** Bonus sur un type de dégâts quand la cible saigne d'au moins `minStacks` piles. */
  bleedStackBonus?: BleedStackBonus;
  /** Bonus sur un type de dégâts quand l'attaquant frappe depuis la Dissimulation. */
  concealedBonus?: DamageTypeBonus;
}

export interface ShieldApplication {
  rate: number;
  duration: number;
  targetingStrategy: Exclude<TargetingStrategy, 'targeted-card'>;
}

export interface SpecialSkill extends AttackBonuses {
  kind: SpecialKind;
  name: string;
  damages?: DamageComposition[];
  rate?: number;
  energy: number;
  /** ATTACK uniquement : nombre de coups (défaut 1), l'effet est tenté à chaque coup réussi. */
  hits?: number;
  /** Requis sauf pour STANCE, qui ne cible personne. */
  targetingStrategy?: Exclude<TargetingStrategy, 'targeted-card'>;
  effect?: EffectConfig;
  /** STANCE uniquement : dissimule le lanceur pendant ce nombre de tours. */
  concealment?: { duration: number };
  statAlterations?: StatAlteration[];
  shieldApplication?: ShieldApplication;
  /** Bonus de dégâts quand la cible porte déjà une marque de ce type. */
  markedTargetBonus?: MarkedTargetBonus;
  /**
   * Ouvre une posture nommée sur le lanceur : les skills portant
   * `requiresStance` avec ce nom ne sont actifs que pendant sa durée.
   */
  stanceActivation?: StanceActivation;
  /** ATTACK uniquement : énergie rendue si la Précision dépasse assez l'Esquive de la cible. */
  energyRefund?: EnergyRefund;
}

export interface SimpleAttackSkill extends AttackBonuses {
  name: string;
  damages: DamageComposition[];
  targetingStrategy: Exclude<TargetingStrategy, 'targeted-card'>;
  effects?: EffectConfig[];
}

export interface MultipleAttackSkill extends AttackBonuses {
  name: string;
  hits: number;
  damages: DamageComposition[];
  targetingStrategy: Exclude<TargetingStrategy, 'targeted-card'>;
  amplifier?: number;
  effects?: EffectConfig[];
  comboFinisher?: DamageComposition[];
  /** Effets appliqués uniquement sur le coup final du combo. */
  comboFinisherEffects?: EffectConfig[];
}

export interface OtherSkill {
  kind: SkillKind;
  name: string;
  /** Requis pour HEALING, ALTERATION, SHIELD, DAMAGE_REDUCTION ; bonus par pile pour BLEED_STACK_SCALING ; taux du Saignement renforcé pour BLEED_EMPOWERMENT ; part de l'Attaque infligée par carte pour BLEED_DETONATION ; bonus de dégâts contre une cible affaiblie pour LOW_HEALTH_TARGET_BONUS. */
  rate?: number;
  /** BLEED_STACK_SCALING uniquement (requis) : plafond du bonus d'Attaque. */
  maxRate?: number;
  /** STANCE (requis) : posture ouverte sur le porteur quand l'événement arrive ; CONDITIONAL_ATTACK (facultatif) : posture ouverte quand l'attaque part. */
  stanceActivation?: StanceActivation;
  /** Requis avec bleed-stacks-applied (piles posées par le porteur) et le ciblage first-bleeding-enemy (piles portées par la cible). */
  stackThreshold?: number;
  /** BLEED_EMPOWERMENT uniquement (entier ≥ 0, défaut 0) : piles posées en plus par chaque Saignement pendant la posture. */
  extraStacks?: number;
  /** BLEED_EMPOWERMENT uniquement : base de calcul des Saignements posés pendant la posture (remplace celle de l'effet). */
  basis?: RateBasis;
  /** BLEED_EMPOWERMENT uniquement : debuff roulé quand un Saignement renforcé est posé (remplace celui de l'effet). */
  triggeredDebuff?: EffectTriggeredDebuff;
  /**
   * DAMAGE_REDUCTION uniquement : probabilité du tirage à chaque coup reçu.
   * Omise, la réduction est permanente.
   */
  probability?: number;
  /**
   * ALTERATION (buff ou debuff) : nom de la pile de cumul et son plafond. Les
   * deux champs vont de pair ; une pile est partagée entre tous les skills de
   * même polarité qui déclarent le même `stackId`.
   */
  stackId?: string;
  maxStacks?: number;
  /** @deprecated Ancien nom de `maxStacks`, toujours accepté. */
  debuffMaxStacks?: number;
  /** Absent pour SURVIVE, DAMAGE_REDUCTION, DODGE_BONUS_DENIAL, BLEED_STACK_SCALING, BLEED_EMPOWERMENT, STANCE, BLEED_DETONATION et LOW_HEALTH_TARGET_BONUS. */
  targetingStrategy?: TargetingStrategy;
  /** Absent pour SHIELD, SURVIVE, DAMAGE_REDUCTION, DODGE_BONUS_DENIAL, BLEED_STACK_SCALING, BLEED_EMPOWERMENT et LOW_HEALTH_TARGET_BONUS. */
  event?: TriggerEvent;
  /** Le skill n'est actif que si son porteur tient cette posture ; requis pour BLEED_EMPOWERMENT. */
  requiresStance?: string;
  /** Requis pour ALTERATION. */
  buffType?: BuffType;
  /** Requis pour ALTERATION et PROTECTION ; facultatif pour CONCEALMENT (sans durée, jusqu'à la première attaque) et BLEED_EMPOWERMENT (durée des piles posées pendant la posture, entier ≥ 1). */
  duration?: number;
  polarity?: 'buff' | 'debuff';
  /** LOW_HEALTH_TARGET_BONUS (requis) : `threshold` est le ratio de santé sous lequel la cible prend le bonus, lu avant le coup. */
  activationCondition?: BuffCondition;
  /** Requis pour CONDITIONAL_ATTACK. */
  damages?: DamageComposition[];
  interval?: number;
  hits?: number;
  amplifier?: number;
  effect?: EffectConfig;
  comboFinisher?: DamageComposition[];
  /** Effets appliqués uniquement sur le coup final du combo. */
  comboFinisherEffects?: EffectConfig[];
  /** CONDITIONAL_ATTACK : part de la Défense de la cible ignorée, dans [0, 1]. */
  defensePenetration?: number;
  /** CONDITIONAL_ATTACK : énergie dépensée, seulement quand l'attaque touche quelqu'un. */
  energyCost?: number;
  /** CONDITIONAL_ATTACK : ne part jamais si le porteur a perdu des points de vie depuis le début de sa dernière action (bouclier et esquive exclus). */
  requiresUndamaged?: boolean;
  /** CONDITIONAL_ATTACK : consomme toutes les piles de Saignement de la cible, `ratePerStack` d'Attaque par pile. */
  bleedDetonation?: { ratePerStack: number };
  /** CONDITIONAL_ATTACK : frappe secondaire sur la cible principale et ses deux voisins, après la frappe principale. */
  splash?: { name: string; damages: DamageComposition[]; effects?: EffectConfig[] };
  /** CONDITIONAL_ATTACK : debuffs posés sur la cible principale si elle reste vivante sous `threshold` (ratio de santé) après la frappe principale. */
  onLowHealthAfterHit?: {
    name: string;
    threshold: number;
    debuffs: { type: BuffType; rate: number; duration: number }[];
  };
  /**
   * Requis quand event vaut ally-death, enemy-death, ally-health-below ou
   * damage-taken. Jamais pour any-ally-health-below, qui surveille toute
   * l'équipe et se passe d'une cible nommée.
   */
  targetCardId?: string;
  terminationEvent?: string;
  activationLimit?: number;
  endEvent?: string;
  powerId?: string;
  /**
   * HEALING uniquement : ce dont le `rate` est une part. Défaut
   * `source-attack`.
   */
  healBasis?: RateBasis;
  /** TRANSFORMATION uniquement. */
  statAlterations?: StatAlteration[];
  lifestealRate?: number;
  statusImmunity?: boolean;
  endCostRate?: number;
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
  /** Points de vie rendus à chaque fin de tour. Optionnel ; 0 si absent. */
  regeneration?: number;
  /**
   * Chance de refuser un statut ou un debuff entrant : la stat divisée par
   * 200. Optionnel ; 0 si absent.
   */
  resistance?: number;
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
 * Les huit caractéristiques portées par le score global et le système
 * d'expérience. Résistance et Régénération en font partie depuis qu'elles
 * agissent en combat : les laisser sur CardDefinition les rendait invisibles
 * aux deux calculs, qui n'itèrent que sur les clés de CardStats.
 * Voir Notion > Les cartes > Calcul du score global.
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
  /** Points de vie rendus à chaque fin de tour. */
  regeneration: number;
  /** Chance de refuser un statut ou un debuff entrant : la stat divisée par 200. */
  resistance: number;
}

export interface CardDefinition {
  id: string;
  name: string;
  archetype: Archetype;
  element: Element;
  stats: CardStats;
  /** Taux entre 0 et 1. Hors système d'expérience. */
  criticalChance: number;
  skills: SkillSet;
  behaviors: Behaviors;
  image?: string;
}

/**
 * Projette une définition de carte vers la configuration attendue par
 * POST /fight. Une simple recopie des champs communs ; seul `archetype`
 * reste côté définition, jamais transmis au moteur.
 *
 * Reste volontairement une fonction pure, sans connaissance de l'XP :
 * shared-types est partagé avec le combat-engine et ne doit pas dépendre
 * de la logique de progression, qui vit côté client
 * (clients/gasha/src/lib/experience). La conversion XP → stats effectives
 * (Notion > Système d'expérience > Plan d'implémentation > Étape 4) se fait
 * en amont, sur une CardDefinition, avant l'appel à cette fonction — voir
 * applyExperience() puis toCombatConfig() dans clients/gasha/src/lib/deck/deck-store.ts.
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
    regeneration: definition.stats.regeneration,
    resistance: definition.stats.resistance,
    element: definition.element,
    skills: definition.skills,
    behaviors: definition.behaviors,
    image: definition.image,
  };
}
