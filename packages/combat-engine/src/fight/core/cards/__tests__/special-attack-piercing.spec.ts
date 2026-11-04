import { SpecialAttack } from '../skills/special-attack';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Player } from '../../player';
import { DamageComposition } from '../@types/damage/damage-composition';
import { DamageType } from '../@types/damage/damage-type';
import { TargetedFromPosition } from '../../targeting-card-strategies/targeted-from-position';
import { FightingCard } from '../fighting-card';
import { AttackResult } from '../@types/action-result/attack-result';

function piercing(options: {
  defensePenetration?: number;
  undodgeable?: boolean;
}): SpecialAttack {
  return new SpecialAttack(
    'Nuée de Cristaux',
    [new DamageComposition(DamageType.PHYSICAL, 1)],
    40,
    new TargetedFromPosition(),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    options.defensePenetration,
    options.undodgeable,
  );
}

describe('SpecialAttack piercing options', () => {
  let attacker: FightingCard;

  const strike = (special: SpecialAttack, defender: FightingCard) =>
    special.launch(attacker, {
      sourcePlayer: new Player('p1', [attacker]),
      opponentPlayer: new Player('p2', [defender]),
    }).actionResults[0] as AttackResult;

  beforeEach(() => {
    attacker = createFightingCard({
      attack: 100,
      criticalChance: 0,
      accuracy: 0,
    });
  });

  it('lands on a defender that would dodge when undodgeable', () => {
    const evasive = createFightingCard({ agility: 50, health: 1000 });

    expect(strike(piercing({ undodgeable: true }), evasive).dodge).toBe(false);
  });

  it('is dodged as usual otherwise', () => {
    const evasive = createFightingCard({ agility: 50, health: 1000 });

    expect(strike(piercing({}), evasive).dodge).toBe(true);
  });

  it('ignores the given share of the defender defense', () => {
    const armored = createFightingCard({
      agility: 0,
      defense: 50,
      health: 1000,
    });

    expect(strike(piercing({ defensePenetration: 0.3 }), armored).damage).toBe(
      65,
    );
  });
});
