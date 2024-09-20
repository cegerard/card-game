import { Player } from '../../player';
import { FightingCard } from '../../cards/fighting-card';
import { SpeedWeightedCardSelector } from './speed-weighted-card-pool';

describe('SpeedWeightedCardSelector', () => {
  // Helper function to create a mock FightingCard
  const createMockCard = (name: string, speed: number): FightingCard =>
    new FightingCard(name, {
      damage: 10,
      defense: 10,
      health: 10,
      speed,
      criticalChance: 0,
    });

  // Helper function to count occurrences of cards
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
      createMockCard('10', 10),
      createMockCard('11', 11),
    ]);
    const player2 = new Player('Player 2', [
      createMockCard('12', 12),
      createMockCard('20', 20), // Higher speed card
    ]);
    const selector = new SpeedWeightedCardSelector(player1, player2);
    const occurrences = countCardOccurrences(selector, 1000);

    expect(occurrences['20']).toBeGreaterThanOrEqual(occurrences['10']);
    expect(occurrences['20']).toBeGreaterThan(occurrences['11']);
    expect(occurrences['20']).toBeGreaterThan(occurrences['12']);
  });

  test('Card with lower speed should be less represented in the card pool', () => {
    const player1 = new Player('Player 1', [
      createMockCard('10', 10),
      createMockCard('11', 11),
    ]);
    const player2 = new Player('Player 2', [
      createMockCard('12', 12),
      createMockCard('5', 5), // Lower speed card
    ]);

    const selector = new SpeedWeightedCardSelector(player1, player2);
    const occurrences = countCardOccurrences(selector, 1000);

    expect(occurrences['5']).toBeLessThanOrEqual(occurrences['10']);
    expect(occurrences['5'] * 2).toBeLessThan(occurrences['11']);
    expect(occurrences['5'] * 2).toBeLessThan(occurrences['12']);
  });

  test('Cards with the same speed should be represented equally in the card pool', () => {
    const player1 = new Player('Player 1', [
      createMockCard('1', 10),
      createMockCard('2', 10),
    ]);
    const player2 = new Player('Player 2', [
      createMockCard('3', 10),
      createMockCard('4', 10),
    ]);
    const selector = new SpeedWeightedCardSelector(player1, player2);
    const occurrences = countCardOccurrences(selector, 1000);

    expect(occurrences['1']).toBe(occurrences['2']);
    expect(occurrences['2']).toBe(occurrences['3']);
    expect(occurrences['3']).toBe(occurrences['4']);
  });
});
