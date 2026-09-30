import { SimpleAttack } from '../simple-attack';
import { MultipleAttack } from '../multiple-attack';
import { SpecialAttack } from '../special-attack';
import { BleedStackBonus } from '../../@types/attack/bleed-stack-bonus';
import { BleedAttackEffect } from '../../@types/attack/attack-bleed-effect';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { TargetedFromPosition } from '../../../targeting-card-strategies/targeted-from-position';
import { MathRandomizer } from '../../../../tools/math-randomizer';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { AttackResult } from '../../@types/action-result/attack-result';

const damages = [
  new DamageComposition(DamageType.PHYSICAL, 0.6),
  new DamageComposition(DamageType.AIR, 0.4),
];
const bonus = new BleedStackBonus(3, DamageType.PHYSICAL, 1.2);
const bleed = (stacks = 1) =>
  new BleedAttackEffect(0.05, 3, 8, new MathRandomizer(), stacks);

const attacks = {
  simple: () =>
    new SimpleAttack(
      'Lacération',
      damages,
      new TargetedFromPosition(),
      [],
      bonus,
    ),
  multiple: () =>
    new MultipleAttack(
      'Lacération',
      1,
      damages,
      new TargetedFromPosition(),
      0,
      [],
      undefined,
      undefined,
      bonus,
    ),
};

describe('Attacks with a bleed stack bonus', () => {
  let attacker: FightingCard;

  const defenderWith = (stacks: number) => {
    const defender = createFightingCard({
      defense: 0,
      agility: 0,
      health: 1000,
    });
    if (stacks) bleed(stacks).applyEffect(defender, attacker, null);
    return defender;
  };
  const contextFor = (defender: FightingCard) => ({
    sourcePlayer: new Player('p1', [attacker]),
    opponentPlayer: new Player('p2', [defender]),
  });

  beforeEach(() => {
    attacker = createFightingCard({
      attack: 100,
      criticalChance: 0,
      accuracy: 50,
    });
  });

  describe.each(Object.entries(attacks))('%s attack', (_kind, build) => {
    const hit = (defender: FightingCard) =>
      build().launch(attacker, contextFor(defender)).results[0].damage;

    it('deals its base damage below the threshold', () => {
      expect(hit(defenderWith(2))).toBe(100);
    });

    it('boosts the physical part from the threshold on', () => {
      expect(hit(defenderWith(3))).toBe(112);
    });
  });

  it('boosts a special attack from the threshold on', () => {
    const defender = defenderWith(3);
    const special = new SpecialAttack(
      'Dissection',
      damages,
      0,
      new TargetedFromPosition(),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      1,
      bonus,
    );

    const [result] = special.launch(attacker, contextFor(defender))
      .actionResults as AttackResult[];

    expect(result.damage).toBe(112);
  });

  it('ignores the stacks the hit applies itself', () => {
    const defender = defenderWith(2);
    const attack = new SimpleAttack(
      'Lacération',
      damages,
      new TargetedFromPosition(),
      [bleed()],
      bonus,
    );

    expect(
      attack.launch(attacker, contextFor(defender)).results[0].damage,
    ).toBe(100);
  });
});
