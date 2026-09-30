import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { DodgeBonusDenialSkill } from '../skills/dodge-bonus-denial';
import { BleedAttackEffect } from '../@types/attack/attack-bleed-effect';
import { MathRandomizer } from '../../../tools/math-randomizer';
import { FightingCard } from '../fighting-card';

const denial = new DodgeBonusDenialSkill('Aéro-traqueur');

function evasiveDefender(bleeding: boolean): FightingCard {
  const defender = createFightingCard({ agility: 100, health: 1000 });
  defender.applyBuff('agility', 0.5, 3);
  defender.applyDebuff('agility', 0.3, 3);
  if (bleeding) {
    new BleedAttackEffect(0.05, 3, 8, new MathRandomizer()).applyEffect(
      defender,
      createFightingCard({ attack: 100 }),
      null,
    );
  }
  return defender;
}

describe('Dodge bonus denial', () => {
  const tracker = createFightingCard({
    accuracy: 80,
    dodgeBonusDenial: denial,
  });

  it('lets a bleeding defender keep its agility bonus against anybody else', () => {
    const attacker = createFightingCard({ accuracy: 80 });

    expect(evasiveDefender(true).dodge(attacker)).toBe(true);
  });

  it('denies the agility bonus of a bleeding defender', () => {
    expect(evasiveDefender(true).dodge(tracker)).toBe(false);
  });

  it('leaves a defender that does not bleed untouched', () => {
    expect(evasiveDefender(false).dodge(tracker)).toBe(true);
  });
});
