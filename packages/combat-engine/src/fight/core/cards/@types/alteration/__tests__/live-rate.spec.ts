import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../../fighting-card';
import { Player } from '../../../../player';
import { HealthCeiling, LivingAllyScaling } from '../live-rate';

describe('live alteration rates', () => {
  let bearer: FightingCard;
  let allies: FightingCard[];
  let team: Player;

  beforeEach(() => {
    bearer = createFightingCard({ defense: 100, health: 1000 });
    allies = [createFightingCard(), createFightingCard()];
    team = new Player('p1', [bearer, ...allies]);
  });

  const buffDefense = (live) =>
    bearer.applyBuff(
      'defense',
      0.05,
      Infinity,
      undefined,
      undefined,
      undefined,
      {
        live,
      },
    );

  describe('LivingAllyScaling', () => {
    it('grants the rate once per living ally', () => {
      buffDefense(new LivingAllyScaling(0.05, 0.2, team));

      expect(bearer.actualDefense).toBe(110);
    });

    it('stops at its cap', () => {
      buffDefense(new LivingAllyScaling(0.15, 0.2, team));

      expect(bearer.actualDefense).toBe(120);
    });

    it('loses what a fallen ally was worth', () => {
      buffDefense(new LivingAllyScaling(0.05, 0.2, team));
      allies[0].addRealDamage(allies[0].maxHealth);

      expect(bearer.actualDefense).toBe(105);
    });

    it('rejects a rate of zero', () => {
      expect(() => new LivingAllyScaling(0, 0.2, team)).toThrow(
        'Living ally scaling needs a rate and a maxRate above 0',
      );
    });
  });

  describe('HealthCeiling', () => {
    it('grants nothing above its threshold', () => {
      buffDefense(new HealthCeiling(0.15, 0.3));

      expect(bearer.actualDefense).toBe(100);
    });

    it('grants its rate under its threshold', () => {
      buffDefense(new HealthCeiling(0.15, 0.3));
      bearer.addRealDamage(800);

      expect(bearer.actualDefense).toBe(115);
    });

    it('rejects a threshold above 1', () => {
      expect(() => new HealthCeiling(0.15, 1.5)).toThrow(
        'Health ceiling threshold must be in ]0, 1]',
      );
    });
  });
});
