import { EnergyDrainAttackEffect } from '../attack-energy-drain-effect';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { RandomizerFake } from '../../../../../../../test/helpers/randomizer-fake';
import { FightingCard } from '../../../fighting-card';
import { Player } from '../../../../player';

describe('EnergyDrainAttackEffect', () => {
  let attacker: FightingCard;
  let defender: FightingCard;

  const drain = (amount = 15) =>
    new EnergyDrainAttackEffect(amount, new RandomizerFake()).applyEffect(
      defender,
      attacker,
      {
        sourcePlayer: new Player('p1', [attacker]),
        opponentPlayer: new Player('p2', [defender]),
      },
    );

  beforeEach(() => {
    attacker = createFightingCard({});
    defender = createFightingCard({});
    defender.gainEnergy(20);
  });

  it('takes the energy away and reports the gauge left', () => {
    expect(drain()).toEqual({
      type: 'energy_drained',
      card: defender,
      amount: 15,
      energy: defender.actualEnergy,
    });
  });

  it('never drains below an empty gauge', () => {
    drain(100);

    expect(defender.actualEnergy).toBe(0);
  });

  it('reports nothing on an empty gauge', () => {
    drain(100);

    expect(drain()).toBeUndefined();
  });

  it('rejects an amount that is not a positive integer', () => {
    expect(
      () => new EnergyDrainAttackEffect(0.5, new RandomizerFake()),
    ).toThrow('Energy drain amount must be an integer >= 1, got 0.5');
  });
});
