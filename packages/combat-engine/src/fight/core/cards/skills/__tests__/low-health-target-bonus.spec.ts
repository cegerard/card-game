import { LowHealthTargetBonusSkill } from '../low-health-target-bonus';
import { BleedStackScalingSkill } from '../bleed-stack-scaling';
import { BleedAttackEffect } from '../../@types/attack/attack-bleed-effect';
import { MathRandomizer } from '../../../../tools/math-randomizer';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';

function atHealthRatio(ratio: number): FightingCard {
  const card = createFightingCard({ health: 1000, defense: 0 });
  card.applyFinalDamage(1000 * (1 - ratio));
  return card;
}

const instinct = () =>
  new LowHealthTargetBonusSkill('Instinct de Chasseresse', 0.25, 0.4);

describe('LowHealthTargetBonusSkill', () => {
  it('raises the attack against a target below the threshold', () => {
    expect(instinct().multiplierAgainst(atHealthRatio(0.3))).toBe(1.25);
  });

  it.each([0.4, 0.5, 1])('gives no bonus at a health ratio of %f', (ratio) => {
    expect(instinct().multiplierAgainst(atHealthRatio(ratio))).toBe(1);
  });

  it.each([
    ['rate', () => new LowHealthTargetBonusSkill('Invalid', 0, 0.4)],
    ['threshold of 0', () => new LowHealthTargetBonusSkill('Invalid', 0.25, 0)],
    [
      'threshold above 1',
      () => new LowHealthTargetBonusSkill('Invalid', 0.25, 1.2),
    ],
  ])('rejects an invalid %s', (_field, build) => {
    expect(build).toThrow();
  });
});

describe('Attack power with a low health target bonus', () => {
  const selkhet = (bleedStackScaling?: BleedStackScalingSkill) =>
    createFightingCard({
      attack: 100,
      lowHealthTargetBonus: instinct(),
      bleedStackScaling,
    });

  it('applies the bonus against a weakened defender', () => {
    expect(selkhet().attackPower(undefined, atHealthRatio(0.3))).toBe(125);
  });

  it('is the plain attack without a defender', () => {
    expect(selkhet().attackPower()).toBe(100);
  });

  it('stacks with the other attack multipliers', () => {
    const prey = atHealthRatio(0.3);
    new BleedAttackEffect(0.05, 3, 20, new MathRandomizer(), 5).applyEffect(
      prey,
      createFightingCard({ attack: 100 }),
      null,
    );
    const context = {
      sourcePlayer: new Player('p1', [createFightingCard({})]),
      opponentPlayer: new Player('p2', [prey]),
    };
    const card = selkhet(new BleedStackScalingSkill('Anatomie', 0.02, 0.3));

    expect(card.attackPower(context, prey)).toBeCloseTo(137.5);
  });
});
