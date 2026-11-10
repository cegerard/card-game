import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { RandomizerFake } from '../../../../../test/helpers/randomizer-fake';
import { FightingCard } from '../fighting-card';
import { CardStatePoisoned } from '../@types/state/card-state-poisoned';
import { CardStateBurned } from '../@types/state/card-state-burned';

describe('FightingCard support buffers', () => {
  let card: FightingCard;

  beforeEach(() => {
    card = createFightingCard({ health: 1000, attack: 100, resistance: 0 });
  });

  describe('gainEnergy()', () => {
    it('adds the amount to the gauge', () => {
      expect(card.gainEnergy(3)).toBe(3);
    });

    it('never fills the gauge past what the special needs', () => {
      const full = card.gainEnergy(Number.MAX_SAFE_INTEGER);

      expect(card.gainEnergy(3)).toBe(full);
    });
  });

  describe('cleanseRandomStatus()', () => {
    it('returns nothing on a healthy card', () => {
      expect(card.cleanseRandomStatus()).toBeUndefined();
    });

    it('removes the status the roll picks', () => {
      const picky = createFightingCard({
        randomizer: new RandomizerFake().setNextRandomValue(0.9),
      });
      picky.setState(new CardStatePoisoned(1, 3, 10));
      picky.setState(new CardStateBurned(1, 3, 10));

      expect(picky.cleanseRandomStatus()).toBe('burn');
    });

    it('leaves the other statuses in place', () => {
      card.setState(new CardStatePoisoned(1, 3, 10));
      card.setState(new CardStateBurned(1, 3, 10));
      card.cleanseRandomStatus();

      expect(card.poisonLevel + card.burnLevel).toBe(1);
    });
  });

  describe('applyShieldPoints()', () => {
    it('absorbs the points given, whatever the bearer health', () => {
      card.applyShieldPoints(208, 2);

      expect(card.applyFinalDamage(300).shieldAbsorbed).toBe(208);
    });
  });

  describe('empower()', () => {
    it('multiplies the bonus against a defender', () => {
      card.empower('Rage', 0.5);

      expect(card.targetBonusAgainst(createFightingCard())).toBe(1.5);
    });

    it('is gone once consumed', () => {
      card.empower('Rage', 0.5);
      card.consumeEmpowerment();

      expect(card.isEmpowered).toBe(false);
    });
  });

  describe('revive()', () => {
    beforeEach(() => {
      card.setState(new CardStatePoisoned(1, 3, 10));
      card.addRealDamage(card.maxHealth);
    });

    it('brings the card back with a share of its max health', () => {
      card.revive(0.3);

      expect(card.actualHealth).toBe(300);
    });

    it('clears the statuses it fell with', () => {
      card.revive(0.3);

      expect(card.poisonLevel).toBe(0);
    });

    it('counts the revival', () => {
      card.revive(0.3);

      expect(card.revivals).toBe(1);
    });

    it('restarts the count of turns spent dead', () => {
      card.countTurnDead();
      card.revive(0.3);

      expect(card.turnsSinceDeath).toBe(0);
    });
  });

  describe('countTurnDead()', () => {
    it('counts nothing for a living card', () => {
      card.countTurnDead();

      expect(card.turnsSinceDeath).toBe(0);
    });
  });
});
