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
  | 'CONCEALMENT'
  /** Transmet à la première cible tous les buffs d'un type que porte son propriétaire. */
  | 'BUFF_TRANSFER'
  /** Passif : Esquive +`rate` (part de l'Esquive de base) par carte vivante portant un Poison à charges du propriétaire, plafonné à `maxRate`. */
  | 'POISONED_ENEMY_AGILITY'
  /** Dégâts réels (ni esquive, ni défense, ni bouclier) : `rate` de `basis` à chaque cible. */
  | 'REAL_DAMAGE'
  /** Pose `effect` sur chaque cible, sans attaque. */
  | 'AFFLICTION'
  /** Pose une charge sur l'ennemi qui vient d'attaquer (`maxStacks` par ennemi) ; la charge qui le remplit pose `effect`. */
  | 'ANALYSIS'
  /** Frappe les voisins de la carte visée par l'attaque du porteur (sans elle) ; pensé pour `after-attack`. */
  | 'AFTERSHOCK'
  /** Rend permanents les Points Faibles révélés par le porteur et amplifie de `rate` les coups qu'ils subissent ; pensé pour `self-death`. */
  | 'WEAK_POINT_LEGACY'
  /** Action d'appui (sur `next-action`, avec `interval`) : bouclier en part de la santé max du lanceur, purge, altérations, sur chaque cible ; ne frappe personne. */
  | 'SUPPORT'
  /** Remplit la jauge du porteur de `amount` à chaque déclenchement. */
  | 'ENERGY_GAIN'
  /** Passif : Précision +`accuracyRate` et Esquive +`agilityRate` (parts des stats de base) contre un ennemi qui a déjà attaqué pendant le combat. */
  | 'ATTACKER_INSIGHT'
  /** Relance la spéciale ATTACK du porteur, jauge intacte ; pensé pour `self-death` avec `requiresStance`. */
  | 'SPECIAL_ECHO';

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
  | 'BLEED'
  /** Révèle un Point Faible (`weakPoint`) : ni statut, ni immunité, ni résistance. */
  | 'WEAK_POINT'
  /** Dégâts sur la durée : `rate` de la santé max de la cible par tour pendant `duration` ; se pose et mord sur une carte gelée. */
  | 'HYPOTHERMIA'
  /** Statut de contrôle : la prochaine action offensive de la cible échoue sur la chance `rate`. */
  | 'ENTANGLE'
  /** Retire `rate` points d'énergie spéciale à la cible (jamais sous 0). */
  | 'ENERGY_DRAIN'
  /** La cible subit `1 + rate` fois les dégâts de `damageType` pendant `duration` tours. */
  | 'VULNERABILITY'
  /** Les soins et buffs des alliés de la cible ne l'atteignent plus pendant `duration` tours. */
  | 'SUPPORT_BLOCK';

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
  | 'enemy-killed'
  /** Chaque attaque esquivée par la carte surveillée (`targetCardId`), évasion comprise. */
  | 'dodge'
  /** Sur la carte qui a posé le Poison à charges que portait l'ennemi mort, quel que soit le tueur. */
  | 'poisoned-enemy-death'
  /** Sur toute l'équipe attaquée, une fois par attaque ennemie (touchée ou esquivée), `lastAttacker` = l'attaquant. */
  | 'enemy-attack'
  /** Sur l'attaquant après chacune de ses attaques ayant ciblé quelqu'un, avec la carte visée. */
  | 'after-attack'
  /** Sur la carte qui vient de se transformer. */
  | 'transformed'
  /** Sur la carte dont l'ANALYSIS a rempli tous les ennemis vivants. */
  | 'enemies-analysed'
  /** Sur les alliés survivants, quel que soit l'allié tombé. */
  | 'any-ally-death'
  /** Sur les alliés d'une carte dont l'action n'est pas l'attaque simple (spéciale, compétence d'action, frappe de début de tour). */
  | 'ally-skill-used';

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
  | 'first-bleeding-enemy'
  /** Allié vivant le plus rapide (buffs compris), lanceur exclu ; se résout même lanceur mort. */
  | 'fastest-ally'
  /** Dernier attaquant esquivé par la carte `targetCardId` : la riposte à un coup manqué. */
  | 'last-dodged-attacker'
  /** Allié vivant au plus faible ratio de santé, lanceur exclu, quel que soit ce ratio. */
  | 'lowest-health-ally'
  /** Spéciales uniquement : `targetCount` ennemis ciblables tirés au hasard à chaque lancer. */
  | 'random-enemies';

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
  /** Requis pour POISON, BURN, FREEZE et STUNT (hors POISON à charges). */
  level?: number;
  /** BLEED (requis) : tours pendant lesquels chaque pile saigne ; POISON à charges (requis) : durée relancée à chaque pose ; HYPOTHERMIA, VULNERABILITY et SUPPORT_BLOCK (requis). */
  duration?: number;
  /** BLEED et POISON à charges : ce dont `rate` est une part (défaut `source-attack`). */
  basis?: RateBasis;
  /** MARK et VULNERABILITY (requis) : type de dégâts amplifié. */
  damageType?: DamageType;
  /** MARK et BLEED (requis) : nombre maximal de cumuls ; sur POISON, en fait un Poison à charges. */
  maxStacks?: number;
  /** MARK et BLEED : cumuls appliqués par déclenchement (défaut 1) ; POISON à charges aussi. */
  stacks?: number;
  /** POISON avec `maxStacks` (requis) : facteur appliqué au tick à chaque charge (2 : 3 %, 6 %, 12 %). */
  stackMultiplier?: number;
  /** POISON à charges : se pose malgré une immunité aux dégâts sur la durée. */
  ignoresImmunity?: boolean;
  triggeredDebuff?: EffectTriggeredDebuff;
  terminationEvent?: string;
  probability?: number;
  /** WEAK_POINT uniquement (requis). */
  weakPoint?: WeakPoint;
}

/** Faiblesse révélée sur la cible, l'attaquant en étant le révélateur. */
export interface WeakPoint {
  /** Révéler à nouveau le même nom remplace le Point Faible. */
  name: string;
  /** Tours de présence ; sans durée, il n'expire jamais. */
  duration?: number;
  /** Multiplie les dégâts de chaque coup reçu par le porteur (défaut 1). */
  damageMultiplier?: number;
  /** Ajouté à la chance de critique de chaque attaquant du porteur. */
  criticalChanceBonus?: number;
  /** Disparaît à la prochaine attaque visant le porteur, touchée ou esquivée. */
  consumable?: boolean;
  /** Révélateur seul : part de sa Précision de base ajoutée contre le porteur. */
  revealerAccuracyRate?: number;
  /** Révélateur seul : son Attaque contre le porteur est multipliée par 1 + rate. */
  revealerAttackRate?: number;
  /** Révélateur seul : ses coups sur le porteur sont multipliés par 1 + rate. */
  revealerDamageRate?: number;
  /** Consommable uniquement : effet posé par le révélateur quand un coup le touche. */
  exploitEffect?: EffectConfig;
}

/** Exécution : la cible encore en vie sous ce ratio de santé perd toute sa santé restante (dégâts réels). */
export interface Execution {
  threshold: number;
}

export interface BattlefieldAlteration {
  type: BuffType;
  rate: number;
  polarity: 'buff' | 'debuff';
  /** `rate` par allié vivant du porteur (lui exclu), plafonné à `maxRate`, relu en continu. */
  perLivingAlly?: { maxRate: number };
}

/** Altération du champ de bataille : aura sur le camp du lanceur, péril sur l'autre, chaque carte la portant sur son propre compteur de tours. */
export interface Battlefield {
  name: string;
  duration: number;
  /** Élément du champ de bataille, lu par `battlefieldBonus`. */
  element?: Element;
  allies?: {
    alterations?: BattlefieldAlteration[];
    /** Part de sa santé max que chaque allié récupère en fin de tour. */
    healRate?: number;
    /** Chaque coup sur un membre perd `rate`, porté par les autres membres, `maxShareRate` du coup chacun au plus ; jamais mortel. */
    damageSharing?: { rate: number; maxShareRate: number };
    /** `count` leurres partagés par les alliés : chacun prend, sur `chance`, une attaque visant l'un d'eux, puis disparaît. */
    decoys?: { count: number; chance: number };
  };
  enemies?: {
    alterations?: BattlefieldAlteration[];
    /** `rate` de l'Attaque du lanceur en dégâts réels de ce type, en fin de tour de chaque ennemi. */
    damage?: { rate: number; damageType: DamageType };
    /** Énergie en plus que coûte chaque spéciale ennemie tant qu'elle s'y tient. */
    energySurcharge?: number;
  };
  /** Les alliés tombés depuis moins de `withinTurns` tours de leur camp reviennent avec `rate` de leur santé max. */
  revival?: { rate: number; withinTurns: number };
  /** Si le lanceur tombe pendant qu'elle court : `duration` tours de plus, et ses alliés vivants frappent une fois plus fort. */
  legacy?: { duration: number; empowerment?: { name: string; rate: number } };
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
  /** Chance qu'une attaque visant le porteur le manque d'emblée, avant le jet d'esquive. */
  evasionChance?: number;
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
  /** Bonus contre une cible déjà gelée, sur tous les types de dégâts sans `damageType`. */
  frozenTargetBonus?: { damageType?: DamageType; multiplier: number };
  /** Bonus tant qu'un champ de bataille de cet élément court (l'attaquant ou la cible s'y tient), sur tous les types sans `damageType`. */
  battlefieldBonus?: {
    element: Element;
    damageType?: DamageType;
    multiplier: number;
  };
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
  /** ATTACK uniquement : effets supplémentaires tentés à chaque coup réussi, après `effect`. */
  effects?: EffectConfig[];
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
  /** ATTACK uniquement : achève les cibles touchées laissées strictement sous `threshold` de leur santé, dans ]0, 1[. */
  execution?: Execution;
  /** ATTACK uniquement : part de la Défense de la cible ignorée, dans [0, 1]. */
  defensePenetration?: number;
  /** ATTACK uniquement : ni jet d'esquive ni évasion. */
  undodgeable?: boolean;
  /** STANCE uniquement : altère le champ de bataille. */
  battlefield?: Battlefield;
  /** Requis avec le ciblage `random-enemies` : nombre d'ennemis tirés. */
  targetCount?: number;
  /** ATTACK uniquement : champ de bataille posé sur les cibles voisines l'une de l'autre dans leur deck (deux au moins). */
  adjacentTargetsBattlefield?: Battlefield;
}

export interface SimpleAttackSkill extends AttackBonuses {
  name: string;
  damages: DamageComposition[];
  targetingStrategy: Exclude<TargetingStrategy, 'targeted-card'>;
  effects?: EffectConfig[];
  /** Altérations laissées sur le défenseur touché (coups esquivés exclus), sans ciblage propre. */
  hitAlterations?: Omit<StatAlteration, 'targetingStrategy' | 'condition'>[];
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
  /** Requis pour HEALING, ALTERATION, SHIELD, DAMAGE_REDUCTION ; bonus par pile pour BLEED_STACK_SCALING ; taux du Saignement renforcé pour BLEED_EMPOWERMENT ; part de l'Attaque infligée par carte pour BLEED_DETONATION ; bonus de dégâts contre une cible affaiblie pour LOW_HEALTH_TARGET_BONUS ; amplification des Points Faibles hérités pour WEAK_POINT_LEGACY. */
  rate?: number;
  /** BLEED_STACK_SCALING uniquement (requis) : plafond du bonus d'Attaque. */
  maxRate?: number;
  /** STANCE (requis) : posture ouverte sur le porteur quand l'événement arrive ; CONDITIONAL_ATTACK (facultatif) : posture ouverte quand l'attaque part ; CONCEALMENT (facultatif) : posture ouverte avec la dissimulation. */
  stanceActivation?: StanceActivation;
  /** Requis avec bleed-stacks-applied (piles posées par le porteur) et le ciblage first-bleeding-enemy (piles portées par la cible). */
  stackThreshold?: number;
  /** BLEED_EMPOWERMENT uniquement (entier ≥ 0, défaut 0) : piles posées en plus par chaque Saignement pendant la posture. */
  extraStacks?: number;
  /** BLEED_EMPOWERMENT : base de calcul des Saignements posés pendant la posture (remplace celle de l'effet) ; REAL_DAMAGE : ce dont `rate` est une part (défaut `source-attack`). */
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
  /** ANALYSIS (requis) : charges posées sur chaque ennemi avant que `effect` ne tombe. */
  maxStacks?: number;
  /** @deprecated Ancien nom de `maxStacks`, toujours accepté. */
  debuffMaxStacks?: number;
  /** Absent pour SURVIVE, DAMAGE_REDUCTION, DODGE_BONUS_DENIAL, BLEED_STACK_SCALING, BLEED_EMPOWERMENT, STANCE, BLEED_DETONATION, LOW_HEALTH_TARGET_BONUS, ANALYSIS (cible l'attaquant), AFTERSHOCK et WEAK_POINT_LEGACY. */
  targetingStrategy?: TargetingStrategy;
  /** Absent pour SHIELD, SURVIVE, DAMAGE_REDUCTION, DODGE_BONUS_DENIAL, BLEED_STACK_SCALING, BLEED_EMPOWERMENT et LOW_HEALTH_TARGET_BONUS. */
  event?: TriggerEvent;
  /** Le skill n'est actif que si son porteur tient cette posture ; requis pour BLEED_EMPOWERMENT. */
  requiresStance?: string;
  /** Requis pour ALTERATION et BUFF_TRANSFER (type des buffs transmis). */
  buffType?: BuffType;
  /** Requis pour ALTERATION et PROTECTION ; facultatif pour CONCEALMENT (sans durée, jusqu'à la première attaque) et BLEED_EMPOWERMENT (durée des piles posées pendant la posture, entier ≥ 1). */
  duration?: number;
  polarity?: 'buff' | 'debuff';
  /** LOW_HEALTH_TARGET_BONUS (requis) : `threshold` est le ratio de santé sous lequel la cible prend le bonus, lu avant le coup. */
  activationCondition?: BuffCondition;
  /** Requis pour CONDITIONAL_ATTACK. */
  damages?: DamageComposition[];
  /** CONDITIONAL_ATTACK, CONCEALMENT et SUPPORT : actions entre deux déclenchements (recharge). */
  interval?: number;
  hits?: number;
  amplifier?: number;
  /** CONDITIONAL_ATTACK et AFTERSHOCK : effet du coup ; AFFLICTION (requis) : effet posé sur chaque cible ; ANALYSIS (requis) : effet posé sur un ennemi rempli. */
  effect?: EffectConfig;
  comboFinisher?: DamageComposition[];
  /** Effets appliqués uniquement sur le coup final du combo. */
  comboFinisherEffects?: EffectConfig[];
  /** CONDITIONAL_ATTACK : part de la Défense de la cible ignorée, dans [0, 1]. */
  defensePenetration?: number;
  /** CONDITIONAL_ATTACK : part de la Défense ignorée à la place contre une cible portant un Point Faible, dans [0, 1]. */
  weakPointPenetration?: number;
  /** CONDITIONAL_ATTACK : énergie dépensée, seulement quand l'attaque touche quelqu'un. */
  energyCost?: number;
  /** CONDITIONAL_ATTACK et CONCEALMENT : ne part jamais si le porteur a perdu des points de vie depuis le début de sa dernière action (bouclier et esquive exclus). */
  requiresUndamaged?: boolean;
  /** CONDITIONAL_ATTACK (avec `requiresStance`) : ferme la posture requise une fois l'attaque partie, pour ne frapper qu'une fois par posture. */
  endsStance?: boolean;
  /** CONDITIONAL_ATTACK : altérations laissées sur chaque défenseur touché par l'attaque principale (une fois par défenseur, coups esquivés exclus), sans ciblage propre. */
  hitAlterations?: Omit<StatAlteration, 'targetingStrategy' | 'condition'>[];
  /** CONDITIONAL_ATTACK : achève les cibles touchées par l'attaque principale laissées strictement sous `threshold` de leur santé, dans ]0, 1[ ; SURVIVE l'intercepte. */
  execution?: Execution;
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
  /**
   * Nombre maximal de déclenchements (HEALING, TARGETING_OVERRIDE,
   * CONDITIONAL_ATTACK). Sur CONDITIONAL_ATTACK, seule une attaque qui a
   * ciblé quelqu'un en consomme un : `1` sur `ally-health-below` donne un
   * ultime unique par combat, même si un soin réarme le seuil.
   */
  activationLimit?: number;
  /** Évènement émis au dernier déclenchement autorisé par `activationLimit`. */
  endEvent?: string;
  powerId?: string;
  /**
   * HEALING uniquement : ce dont le `rate` est une part. Défaut
   * `source-attack`.
   */
  healBasis?: RateBasis;
  /** TRANSFORMATION, et STANCE (appliquées à l'ouverture de la posture). */
  statAlterations?: StatAlteration[];
  lifestealRate?: number;
  statusImmunity?: boolean;
  endCostRate?: number;
  /** TRANSFORMATION : postures ouvertes sur le porteur, chacune pour sa durée. */
  stanceActivations?: StanceActivation[];
  /** TRANSFORMATION : multiplie les dégâts de ses coups critiques par 1 + rate. */
  criticalDamageRate?: number;
  /** TRANSFORMATION : porte chaque Poison à charges du terrain à `stacks` au moins et multiplie ses dégâts. */
  poisonSurge?: { stacks: number; damageMultiplier: number };
  /** TRANSFORMATION : altère le champ de bataille à son déclenchement. */
  battlefield?: Battlefield;
  /** TRANSFORMATION avec `activationEvent: 'any-ally-health-below'` (requis) : seuil de santé de l'allié. */
  activationEventThreshold?: number;
  /** ALTERATION : `rate` par allié vivant du porteur (lui exclu), plafonné à `maxRate`, relu en continu. */
  perLivingAlly?: { maxRate: number };
  /** ALTERATION : l'altération ne compte que tant que la santé du porteur est sous ce ratio. */
  whileHealthBelow?: number;
  /** ALTERATION : `terminationEvent` ne la retire que sur un coup coûtant strictement plus que cette part de la santé max. */
  terminationDamageRate?: number;
  /** ATTACKER_INSIGHT (requis) : part de la Précision de base gagnée contre un ennemi qui a déjà attaqué. */
  accuracyRate?: number;
  /** ATTACKER_INSIGHT (requis) : part de l'Esquive de base gagnée contre un ennemi qui a déjà attaqué. */
  agilityRate?: number;
  /** ENERGY_GAIN (requis) : énergie gagnée à chaque déclenchement. */
  amount?: number;
  /** SUPPORT : bouclier de `rate` × la santé max du lanceur, pour `duration` tours. */
  shield?: { rate: number; duration: number };
  /** SUPPORT : statuts retirés au hasard de chaque cible. */
  cleanse?: number;
  /** SUPPORT : altérations laissées sur chaque cible. */
  alterations?: Omit<StatAlteration, 'targetingStrategy' | 'condition'>[];
  /** STANCE : chance d'ouverture, nulle avant `fromTurn`, +`increment` à chaque échec, 0 après ouverture ; jamais pendant la posture. */
  rampingChance?: { startChance: number; increment: number; fromTurn: number };
  /** Requis quand event vaut dormant ; TRANSFORMATION : événement qui la déclenche aussi, une fois par combat. */
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
