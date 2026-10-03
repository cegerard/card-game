import { FirstBleedingEnemyStrategy } from '../first-bleeding-enemy';
import { Player } from '../../player';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { CardStateBleeding } from '../../cards/@types/state/card-state-bleeding';

const bleedingWith = (stacks: number): FightingCard => {
  const card = createFightingCard({ health: 1000 });
  if (stacks > 0) {
    card.setState(
      new CardStateBleeding(
        Array.from({ length: stacks }, () => ({
          remainingTurns: 3,
          damageValue: 5,
        })),
      ),
    );
  }
  return card;
};

describe('FirstBleedingEnemyStrategy', () => {
  const strategy = new FirstBleedingEnemyStrategy(5);
  const caster = createFightingCard();

  const targetsAmong = (enemies: FightingCard[]) =>
    strategy.targetedCards(
      caster,
      new Player('p1', [caster]),
      new Player('p2', enemies),
    );

  it('targets the first enemy in deck order at the threshold', () => {
    const second = bleedingWith(6);
    const third = bleedingWith(7);

    expect(targetsAmong([bleedingWith(4), second, third])).toEqual([second]);
  });

  it('targets nobody below the threshold', () => {
    expect(targetsAmong([bleedingWith(4), bleedingWith(0)])).toEqual([]);
  });

  it('skips a dead enemy', () => {
    const dead = bleedingWith(6);
    dead.addRealDamage(100000);

    expect(targetsAmong([dead])).toEqual([]);
  });
});
