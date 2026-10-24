import {
  BleedStackBonusDto,
  DamageTypeBonusDto,
  EnergyRefundDto,
  ExecutionDto,
  FightingCardDto,
} from './dto/fight-data.dto';
import { SimpleAttack } from '../core/cards/skills/simple-attack';
import { buildTargetingStrategy } from './targeting-strategy-factory';
import { BleedStackBonus } from '../core/cards/@types/attack/bleed-stack-bonus';
import { ConcealedBonus } from '../core/cards/@types/attack/concealed-bonus';
import { DamageTypeBonus } from '../core/cards/@types/attack/damage-type-bonus';
import { EnergyRefund } from '../core/cards/@types/attack/energy-refund';
import { DamageComposition } from '../core/cards/@types/damage/damage-composition';
import { MultipleAttack } from '../core/cards/skills/multiple-attack';
import { AttackSkill } from '../core/cards/skills/attack-skill';
import { Execution } from '../core/cards/@types/attack/execution';
import { buildEffects } from './attack-effect-factory';
import { asBadRequest } from './skill-wiring-factory';

export function buildAttackSkill(
  skills: FightingCardDto['skills'],
): AttackSkill {
  if (skills.multipleAttack) {
    const ma = skills.multipleAttack;
    const maDamages = ma.damages.map(
      (d) => new DamageComposition(d.type, d.rate),
    );
    const maEffects = buildEffects(ma.effects);
    const maComboFinisher = ma.comboFinisher
      ? ma.comboFinisher.map((d) => new DamageComposition(d.type, d.rate))
      : undefined;
    return new MultipleAttack(
      ma.name,
      ma.hits,
      maDamages,
      buildTargetingStrategy(ma.targetingStrategy),
      ma.amplifier ?? 0,
      maEffects,
      maComboFinisher,
      buildEffects(ma.comboFinisherEffects),
      buildDamageBonuses(ma),
    );
  }

  const sa = skills.simpleAttack;
  if (!sa) {
    throw new Error('Either simpleAttack or multipleAttack must be provided');
  }
  const saEffects = buildEffects(sa.effects);
  const damages = sa.damages.map((d) => new DamageComposition(d.type, d.rate));
  return new SimpleAttack(
    sa.name,
    damages,
    buildTargetingStrategy(sa.targetingStrategy),
    saEffects,
    buildDamageBonuses(sa),
  );
}

export function buildEnergyRefund(
  dto: EnergyRefundDto | undefined,
): EnergyRefund | undefined {
  if (!dto) return undefined;

  return new EnergyRefund(dto.amount, dto.minAccuracyMargin);
}

export function buildExecution(dto?: ExecutionDto): Execution | undefined {
  return dto && asBadRequest(() => new Execution(dto.threshold));
}

export function buildDamageBonuses(attack: {
  bleedStackBonus?: BleedStackBonusDto;
  concealedBonus?: DamageTypeBonusDto;
}): DamageTypeBonus[] {
  const { bleedStackBonus, concealedBonus } = attack;
  const bonuses: DamageTypeBonus[] = [];

  if (bleedStackBonus) {
    bonuses.push(
      new BleedStackBonus(
        bleedStackBonus.minStacks,
        bleedStackBonus.damageType,
        bleedStackBonus.multiplier,
      ),
    );
  }
  if (concealedBonus) {
    bonuses.push(
      new ConcealedBonus(concealedBonus.damageType, concealedBonus.multiplier),
    );
  }

  return bonuses;
}
