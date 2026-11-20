import { AttackerInsightSkill } from './attacker-insight';
import { BleedEmpowermentSkill } from './bleed-empowerment';
import { BleedStackScalingSkill } from './bleed-stack-scaling';
import { DamageReductionSkill } from './damage-reduction';
import { DodgeBonusDenialSkill } from './dodge-bonus-denial';
import { LowHealthTargetBonusSkill } from './low-health-target-bonus';
import { PoisonedEnemyAgilitySkill } from './poisoned-enemy-agility';
import { SurviveSkill } from './survive';

/**
 * The passives a card holds itself: no event, no targeting, read by the card
 * when it strikes, dodges or takes a hit. At most one of each kind.
 */
export type CardBoundPassives = {
  survive?: SurviveSkill;
  damageReduction?: DamageReductionSkill;
  dodgeBonusDenial?: DodgeBonusDenialSkill;
  bleedStackScaling?: BleedStackScalingSkill;
  bleedEmpowerment?: BleedEmpowermentSkill;
  lowHealthTargetBonus?: LowHealthTargetBonusSkill;
  poisonedEnemyAgility?: PoisonedEnemyAgilitySkill;
  attackerInsight?: AttackerInsightSkill;
};
