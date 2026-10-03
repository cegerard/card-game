import { BleedAttackEffect } from '../attack-bleed-effect';
import { MathRandomizer } from '../../../../../tools/math-randomizer';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../../fighting-card';
import { BleedEmpowermentSkill } from '../../../skills/bleed-empowerment';

const bleed = (maxStacks = 8) =>
  new BleedAttackEffect(0.05, 3, maxStacks, new MathRandomizer());

describe('BleedAttackEffect laid by an empowered source', () => {
  let attacker: FightingCard;
  let defender: FightingCard;

  const tickDamage = () => defender.applyStateEffects()[0].damage;

  beforeEach(() => {
    attacker = createFightingCard({
      attack: 100,
      bleedEmpowerment: new BleedEmpowermentSkill(
        'Lames du Vent Rouge',
        'vent-rouge',
        1,
        0.08,
      ),
    });
    defender = createFightingCard({ health: 5000 });
  });

  describe('while the stance runs', () => {
    beforeEach(() => {
      attacker.activateStance('vent-rouge', 3);
      bleed().applyEffect(defender, attacker, null);
    });

    it('lays the extra stacks', () => {
      expect(defender.bleedStacks()).toBe(2);
    });

    it('bleeds at the empowered rate', () => {
      expect(tickDamage()).toBe(16);
    });
  });

  describe('outside the stance', () => {
    beforeEach(() => {
      bleed().applyEffect(defender, attacker, null);
    });

    it('lays the effect own stacks', () => {
      expect(defender.bleedStacks()).toBe(1);
    });

    it('bleeds at the effect own rate', () => {
      expect(tickDamage()).toBe(5);
    });
  });

  it('keeps to the stack cap', () => {
    attacker.activateStance('vent-rouge', 3);

    bleed(1).applyEffect(defender, attacker, null);

    expect(defender.bleedStacks()).toBe(1);
  });
});
