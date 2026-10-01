import { StackScalingSkill } from '../stack-scaling';
import { BleedAttackEffect } from '../../@types/attack/attack-bleed-effect';
import { MathRandomizer } from '../../../../tools/math-randomizer';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { FightingContext } from '../../@types/fighting-context';

function bleeding(stacks: number): FightingCard {
  const card = createFightingCard({ health: 1000 });
  if (stacks) {
    new BleedAttackEffect(
      0.05,
      3,
      20,
      new MathRandomizer(),
      stacks,
    ).applyEffect(card, createFightingCard({ attack: 100 }), null);
  }
  return card;
}

function board(allyStacks: number, enemyStacks: number): FightingContext {
  return {
    sourcePlayer: new Player('p1', [bleeding(allyStacks)]),
    opponentPlayer: new Player('p2', [bleeding(enemyStacks)]),
  };
}

describe('StackScalingSkill', () => {
  const anatomy = new StackScalingSkill('Anatomie Prédatrice', 0.02, 0.3);

  it.each([
    [0, 0, 0],
    [0, 5, 0.1],
    [2, 3, 0.1],
    [5, 15, 0.3],
  ])(
    'grants a bonus for %i allied and %i enemy stacks',
    (allyStacks, enemyStacks, bonus) => {
      expect(anatomy.bonusFor(board(allyStacks, enemyStacks))).toBeCloseTo(
        bonus,
      );
    },
  );

  it('grants nothing without a fighting context', () => {
    expect(anatomy.bonusFor(undefined)).toBe(0);
  });

  it.each([
    ['perStackRate', () => new StackScalingSkill('Invalid', 0, 0.3)],
    ['maxRate', () => new StackScalingSkill('Invalid', 0.02, 0)],
  ])('rejects an invalid %s', (_field, build) => {
    expect(build).toThrow();
  });
});

describe('Attack power with a stack scaling', () => {
  it('raises the attack by the bonus of the board', () => {
    const scythra = createFightingCard({
      attack: 100,
      stackScaling: new StackScalingSkill('Anatomie Prédatrice', 0.02, 0.3),
    });

    expect(scythra.attackPower(board(0, 5))).toBeCloseTo(110);
  });

  it('is the plain attack for a card without the passive', () => {
    const card = createFightingCard({ attack: 100 });

    expect(card.attackPower(board(0, 5))).toBe(100);
  });
});
