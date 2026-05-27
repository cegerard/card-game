import { AllyPresenceCondition } from '../ally-presence-condition';
import { createFightingCard } from '../../../../../../../../test/helpers/fighting-card';
import { Player } from '../../../../../player';

describe('AllyPresenceCondition', () => {
  const condition = new AllyPresenceCondition('Kaelion');

  describe('when named ally is alive in source player team', () => {
    let result: boolean;

    beforeEach(() => {
      const source = createFightingCard({ name: 'Arionis' });
      const ally = createFightingCard({ name: 'Kaelion', health: 100 });
      const opponent = createFightingCard({ name: 'Enemy' });
      const sourcePlayer = new Player('P1', [source, ally]);
      const opponentPlayer = new Player('P2', [opponent]);
      result = condition.evaluate(source, { sourcePlayer, opponentPlayer });
    });

    it('returns true', () => {
      expect(result).toBe(true);
    });
  });

  describe('when named ally is absent from source player team', () => {
    let result: boolean;

    beforeEach(() => {
      const source = createFightingCard({ name: 'Arionis' });
      const opponent = createFightingCard({ name: 'Enemy' });
      const sourcePlayer = new Player('P1', [source]);
      const opponentPlayer = new Player('P2', [opponent]);
      result = condition.evaluate(source, { sourcePlayer, opponentPlayer });
    });

    it('returns false', () => {
      expect(result).toBe(false);
    });
  });

  describe('when named ally is dead', () => {
    let result: boolean;

    beforeEach(() => {
      const source = createFightingCard({ name: 'Arionis' });
      const deadAlly = createFightingCard({ name: 'Kaelion', health: 1 });
      deadAlly.addRealDamage(1);
      const opponent = createFightingCard({ name: 'Enemy' });
      const sourcePlayer = new Player('P1', [source, deadAlly]);
      const opponentPlayer = new Player('P2', [opponent]);
      result = condition.evaluate(source, { sourcePlayer, opponentPlayer });
    });

    it('returns false', () => {
      expect(result).toBe(false);
    });
  });
});
