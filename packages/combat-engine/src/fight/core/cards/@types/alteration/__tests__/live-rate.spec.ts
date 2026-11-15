import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../../fighting-card';
import { Player } from '../../../../player';
import { HealthCeiling, LivingAllyScaling, ShieldHold } from '../live-rate';

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

  describe('ShieldHold', () => {
    it('grants nothing without a shield', () => {
      buffDefense(new ShieldHold(0.15, 'basalt'));

      expect(bearer.actualDefense).toBe(100);
    });

    it('grants its rate while the named shield holds', () => {
      buffDefense(new ShieldHold(0.15, 'basalt'));
      bearer.applyShield(0.3, Infinity, 'basalt');

      expect(bearer.actualDefense).toBe(115);
    });

    it('grants nothing under a shield of another name', () => {
      buffDefense(new ShieldHold(0.15, 'basalt'));
      bearer.applyShield(0.3, 1, 'molten rock');

      expect(bearer.actualDefense).toBe(100);
    });

    it('grants nothing once the shield broke', () => {
      buffDefense(new ShieldHold(0.15, 'basalt'));
      bearer.applyShield(0.3, Infinity, 'basalt');
      bearer.applyFinalDamage(400);

      expect(bearer.actualDefense).toBe(100);
    });
  });
});
