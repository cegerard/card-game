import { TargetAndNeighborsStrategy } from '../target-and-neighbors';
import { Player } from '../../player';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';

describe('TargetAndNeighborsStrategy', () => {
  const caster = createFightingCard();
  let enemies: FightingCard[];

  const zoneAround = (center: FightingCard) =>
    new TargetAndNeighborsStrategy(center).targetedCards(
      caster,
      new Player('p1', [caster]),
      new Player('p2', enemies),
    );

  beforeEach(() => {
    enemies = [1, 2, 3, 4].map(() => createFightingCard({ health: 1000 }));
  });

  it('targets the card and both its neighbors', () => {
    expect(zoneAround(enemies[1])).toEqual([
      enemies[0],
      enemies[1],
      enemies[2],
    ]);
  });

  it('targets a single neighbor at the edge of the deck', () => {
    expect(zoneAround(enemies[0])).toEqual([enemies[0], enemies[1]]);
  });

  it('skips a dead neighbor', () => {
    enemies[2].addRealDamage(100000);

    expect(zoneAround(enemies[1])).toEqual([enemies[0], enemies[1]]);
  });

  it('still strikes the neighbors of a dead center', () => {
    enemies[1].addRealDamage(100000);

    expect(zoneAround(enemies[1])).toEqual([enemies[0], enemies[2]]);
  });
});
