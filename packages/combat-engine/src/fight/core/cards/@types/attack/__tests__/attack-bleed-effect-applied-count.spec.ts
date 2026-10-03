import { BleedAttackEffect } from '../attack-bleed-effect';
import { MathRandomizer } from '../../../../../tools/math-randomizer';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../../fighting-card';

const bleed = (stacks: number, maxStacks = 8) =>
  new BleedAttackEffect(0.05, 3, maxStacks, new MathRandomizer(), stacks);

describe('BleedAttackEffect applied stacks count', () => {
  let attacker: FightingCard;
  let defender: FightingCard;

  beforeEach(() => {
    attacker = createFightingCard({ attack: 100 });
    defender = createFightingCard({ health: 500 });
  });

  it('starts at zero', () => {
    expect(attacker.bleedStacksApplied).toBe(0);
  });

  it('counts the stacks its source lays', () => {
    bleed(2).applyEffect(defender, attacker, null);
    bleed(3).applyEffect(defender, attacker, null);

    expect(attacker.bleedStacksApplied).toBe(5);
  });

  it('leaves out the stacks lost at the cap', () => {
    bleed(3, 4).applyEffect(defender, attacker, null);
    bleed(3, 4).applyEffect(defender, attacker, null);

    expect(attacker.bleedStacksApplied).toBe(4);
  });

  it('leaves out a refused bleed', () => {
    defender.applyStatusImmunity(1);

    bleed(2).applyEffect(defender, attacker, null);

    expect(attacker.bleedStacksApplied).toBe(0);
  });
});
