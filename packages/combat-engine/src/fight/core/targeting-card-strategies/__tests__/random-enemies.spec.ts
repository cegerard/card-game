import { RandomEnemiesStrategy } from '../random-enemies';
import { Player } from '../../player';
import { FightingCard } from '../../cards/fighting-card';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { RandomizerFake } from '../../../../../test/helpers/randomizer-fake';

describe('RandomEnemiesStrategy', () => {
  const randomizer = new RandomizerFake();
  let attacker: FightingCard;
  let enemies: FightingCard[];
  let defending: Player;

  const target = (count = 2) =>
    new RandomEnemiesStrategy(count, randomizer).targetedCards(
      attacker,
      new Player('p1', [attacker]),
      defending,
    );

  beforeEach(() => {
    randomizer.reset();
    attacker = createFightingCard({});
    enemies = [1, 2, 3, 4].map(() => createFightingCard({}));
    defending = new Player('p2', enemies);
  });

  it('picks as many distinct enemies as asked', () => {
    expect(new Set(target()).size).toBe(2);
  });

  it('draws each enemy from the ones left, reported in deck order', () => {
    randomizer.setNextRandomValue(0.99);

    expect(target()).toEqual([enemies[2], enemies[3]]);
  });

  it('takes every enemy when fewer are left than asked', () => {
    enemies[0].addRealDamage(enemies[0].maxHealth);

    expect(target(5)).toEqual(enemies.slice(1));
  });

  it('never picks an enemy hidden from the attacker', () => {
    enemies.slice(1).forEach((enemy) => enemy.conceal('Abysses'));

    expect(target()).toEqual([enemies[0]]);
  });

  it('rejects a count below 1', () => {
    expect(() => new RandomEnemiesStrategy(0, randomizer)).toThrow(
      'RandomEnemiesStrategy count must be an integer >= 1, got 0',
    );
  });
});
