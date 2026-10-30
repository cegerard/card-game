import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { RandomizerFake } from '../../../../../test/helpers/randomizer-fake';
import { FightingCard } from '../fighting-card';

describe('FightingCard evasion stance', () => {
  let attacker: FightingCard;
  let randomizer: RandomizerFake;
  let defender: FightingCard;

  beforeEach(() => {
    attacker = createFightingCard({ accuracy: 100 });
    randomizer = new RandomizerFake();
    defender = createFightingCard({ agility: 0, randomizer });
  });

  it('dodges when the evasion roll succeeds', () => {
    defender.activateStance({
      name: 'mirage',
      duration: 2,
      evasionChance: 0.5,
    });
    randomizer.setNextRandomValue(0.4);

    expect(defender.dodge(attacker)).toBe(true);
  });

  it('falls back to the dodge roll when the evasion roll fails', () => {
    defender.activateStance({
      name: 'mirage',
      duration: 2,
      evasionChance: 0.5,
    });
    randomizer.setNextRandomValue(0.6);

    expect(defender.dodge(attacker)).toBe(false);
  });

  it('keeps its evasion when the stance is refreshed without one', () => {
    defender.activateStance({ name: 'mirage', duration: 2, evasionChance: 1 });
    defender.activateStance({ name: 'mirage', duration: 2 });

    expect(defender.dodge(attacker)).toBe(true);
  });

  it('never evades without a stance granting it', () => {
    expect(defender.dodge(attacker)).toBe(false);
  });
});
