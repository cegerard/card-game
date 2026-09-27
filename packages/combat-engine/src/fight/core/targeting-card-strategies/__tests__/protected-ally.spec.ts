import { ProtectedAllyStrategy } from '../protected-ally';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';

describe('ProtectedAllyStrategy', () => {
  let guardian: FightingCard;
  let ally: FightingCard;
  let team: Player;
  let opponents: Player;
  let strategy: ProtectedAllyStrategy;

  function target(): FightingCard[] {
    return strategy.targetedCards(guardian, team, opponents);
  }

  beforeEach(() => {
    guardian = createFightingCard({ id: 'guardian', health: 1000 });
    ally = createFightingCard({ id: 'ally', health: 1000 });
    team = new Player('team', [guardian, ally]);
    opponents = new Player('opponents', [createFightingCard()]);
    strategy = new ProtectedAllyStrategy();
  });

  describe('while the caster protects an ally', () => {
    it('targets that ally', () => {
      guardian.protect(ally, 2);

      expect(target()).toEqual([ally]);
    });
  });

  describe('when the caster protects nobody', () => {
    it('targets nobody', () => {
      expect(target()).toEqual([]);
    });
  });

  describe('once the protection is over', () => {
    it('targets nobody', () => {
      guardian.protect(ally, 0);
      guardian.decreaseProtectionDuration();

      expect(target()).toEqual([]);
    });
  });

  describe('when the protected ally is dead', () => {
    it('targets nobody', () => {
      guardian.protect(ally, 2);
      ally.addRealDamage(1000);

      expect(target()).toEqual([]);
    });
  });

  describe('when the caster itself is dead', () => {
    it('still names the ally it was covering', () => {
      guardian.protect(ally, 2);
      guardian.addRealDamage(1000);

      expect(target()).toEqual([ally]);
    });
  });
});
