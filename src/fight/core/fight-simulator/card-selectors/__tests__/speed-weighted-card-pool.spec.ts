import { Player } from '../../../player';
import { SpeedWeightedCardSelector } from '../speed-weighted-card-pool';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';

describe('SpeedWeightedCardSelector', () => {
  const countCardOccurrences = (
    selector: SpeedWeightedCardSelector,
    iterations: number,
  ) => {
    const occurrences: { [key: string]: number } = {};
    for (let i = 0; i < iterations; i++) {
      const selectedCard = selector.nextCards()[0];
      occurrences[selectedCard.name] =
        (occurrences[selectedCard.name] || 0) + 1;
    }
    return occurrences;
  };

  test('Card with higher speed should be more represented in the card pool', () => {
    const player1 = new Player('Player 1', [
      createFightingCard({ name: '10', speed: 10 }),
      createFightingCard({ name: '11', speed: 11 }),
    ]);
    const player2 = new Player('Player 2', [
      createFightingCard({ name: '12', speed: 12 }),
      createFightingCard({ name: '20', speed: 20 }),
    ]);
    const selector = new SpeedWeightedCardSelector(player1, player2);
    const occurrences = countCardOccurrences(selector, 1000);

    expect(occurrences['20']).toBeGreaterThanOrEqual(occurrences['10']);
    expect(occurrences['20']).toBeGreaterThan(occurrences['11']);
    expect(occurrences['20']).toBeGreaterThan(occurrences['12']);
  });

  test('Card with lower speed should be less represented in the card pool', () => {
    const player1 = new Player('Player 1', [
      createFightingCard({ name: '10', speed: 10 }),
      createFightingCard({ name: '11', speed: 11 }),
    ]);
    const player2 = new Player('Player 2', [
      createFightingCard({ name: '12', speed: 12 }),
      createFightingCard({ name: '5', speed: 5 }),
    ]);

    const selector = new SpeedWeightedCardSelector(player1, player2);
    const occurrences = countCardOccurrences(selector, 1000);

    expect(occurrences['5']).toBeLessThanOrEqual(occurrences['10']);
    expect(occurrences['5'] * 2).toBeLessThan(occurrences['11']);
    expect(occurrences['5'] * 2).toBeLessThan(occurrences['12']);
  });

  test('Cards with the same speed should be represented equally in the card pool', () => {
    const player1 = new Player('Player 1', [
      createFightingCard({ name: '1', speed: 10 }),
      createFightingCard({ name: '2', speed: 10 }),
    ]);
    const player2 = new Player('Player 2', [
      createFightingCard({ name: '3', speed: 10 }),
      createFightingCard({ name: '4', speed: 10 }),
    ]);
    const selector = new SpeedWeightedCardSelector(player1, player2);
    const occurrences = countCardOccurrences(selector, 1000);

    expect(occurrences['1']).toBe(occurrences['2']);
    expect(occurrences['2']).toBe(occurrences['3']);
    expect(occurrences['3']).toBe(occurrences['4']);
  });
});
