import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { FightingCard } from '../cards/fighting-card';

describe('when launching a self healing skill', () => {
  const fightingContext = {
    sourcePlayer: null,
    opponentPlayer: null,
  };
  let healer: FightingCard;

  beforeEach(() => {
    healer = createFightingCard({
      attack: 100,
      defense: 0,
      health: 500,
      skills: {
        others: [
          {
            effectRate: 1.5,
            trigger: 'turn-end',
            targetingStrategy: 'self',
          },
        ],
      },
    });
  });

  describe('and the card is not full health', () => {
    beforeEach(() => {
      healer.collectsDamages(400);
    });

    it('should return the healing result', () => {
      const result = healer.launchSkill('turn-end', fightingContext);

      expect(result).toEqual([
        {
          healAmount: 150,
          remainingHealth: 250,
          target: healer.identityInfo,
        },
      ]);
    });
  });

  describe('and the card is full health', () => {
    it('should return a null healing result', () => {
      const result = healer.launchSkill('turn-end', fightingContext);

      expect(result).toEqual([
        {
          healAmount: 0,
          remainingHealth: 500,
          target: healer.identityInfo,
        },
      ]);
    });

    it('should not change the health of the card', () => {
      healer.launchSkill('turn-end', fightingContext);

      expect(healer.actualHealth).toEqual(500);
    });
  });

  describe('when the healing is more than the card max health', () => {
    const damage = 50;

    beforeEach(() => {
      healer.collectsDamages(damage);
    });

    it('should return the healing result', () => {
      const result = healer.launchSkill('turn-end', fightingContext);

      expect(result).toEqual([
        {
          healAmount: damage,
          remainingHealth: 500,
          target: healer.identityInfo,
        },
      ]);
    });
  });
});
