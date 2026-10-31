import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { PoisonedEnemyAgilitySkill } from '../skills/poisoned-enemy-agility';
import { StackedPoisonAttackEffect } from '../@types/attack/attack-stacked-poison-effect';
import { MathRandomizer } from '../../../tools/math-randomizer';
import { FightingCard } from '../fighting-card';

const venom = new StackedPoisonAttackEffect(
  0.03,
  3,
  3,
  2,
  new MathRandomizer(),
);

describe('FightingCard poisoned enemy agility', () => {
  let owner: FightingCard;

  const poisonCards = (count: number) =>
    [...Array(count)].map(() => {
      const card = createFightingCard({ health: 1000 });
      venom.applyEffect(card, owner, null);
      return card;
    });

  beforeEach(() => {
    owner = createFightingCard({
      agility: 100,
      poisonedEnemyAgility: new PoisonedEnemyAgilitySkill(
        'Instinct',
        0.02,
        0.1,
      ),
    });
  });

  it('keeps its agility while nobody is poisoned', () => {
    expect(owner.actualAgility).toBe(100);
  });

  it('gains a share of its agility per poisoned card', () => {
    poisonCards(2);

    expect(owner.actualAgility).toBe(104);
  });

  it('caps the bonus', () => {
    poisonCards(6);

    expect(owner.actualAgility).toBe(110);
  });

  it('stops counting a dead card', () => {
    const [victim] = poisonCards(1);
    victim.addRealDamage(1000);

    expect(owner.actualAgility).toBe(100);
  });

  it('rejects a non positive rate', () => {
    expect(() => new PoisonedEnemyAgilitySkill('Instinct', 0, 0.1)).toThrow(
      'perEnemyRate',
    );
  });
});
