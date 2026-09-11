import { SpecialAttack } from '../skills/special-attack';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Player } from '../../player';
import { DamageComposition } from '../@types/damage/damage-composition';
import { DamageType } from '../@types/damage/damage-type';
import { Element } from '../@types/damage/element';
import { ElementalMark } from '../@types/mark/elemental-mark';
import { MarkedTargetBonus } from '../@types/mark/marked-target-bonus';
import { TargetedAll } from '../../targeting-card-strategies/targeted-all';
import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { AttackResult } from '../@types/action-result/attack-result';

const damages = [new DamageComposition(DamageType.WATER, 1.0)];

describe('SpecialAttack marked target bonus', () => {
  let attacker: FightingCard;
  let defender: FightingCard;
  let context: FightingContext;
  let special: SpecialAttack;

  beforeEach(() => {
    attacker = createFightingCard({
      attack: 100,
      defense: 0,
      criticalChance: 0,
      accuracy: 9999,
    });
    defender = createFightingCard({
      defense: 0,
      health: 10000,
      agility: 0,
      element: Element.PHYSICAL,
    });
    context = {
      sourcePlayer: new Player('p1', [attacker]),
      opponentPlayer: new Player('p2', [defender]),
    };
    special = new SpecialAttack(
      'Abysses',
      damages,
      0,
      new TargetedAll(),
      undefined,
      undefined,
      undefined,
      new MarkedTargetBonus(DamageType.WATER, 1.3),
    );
  });

  it('deals base damage to an unmarked target', () => {
    const [result] = special.launch(attacker, context)
      .actionResults as AttackResult[];

    expect(result.damage).toBe(100);
  });

  it('amplifies the damage against a marked target', () => {
    defender.applyMark(new ElementalMark(DamageType.WATER, 0, 5), 1);

    const [result] = special.launch(attacker, context)
      .actionResults as AttackResult[];

    expect(result.damage).toBe(130);
  });

  it('ignores a mark of another damage type', () => {
    defender.applyMark(new ElementalMark(DamageType.FIRE, 0, 5), 1);

    const [result] = special.launch(attacker, context)
      .actionResults as AttackResult[];

    expect(result.damage).toBe(100);
  });
});

describe('MarkedTargetBonus', () => {
  it('rejects a multiplier of zero or less', () => {
    expect(() => new MarkedTargetBonus(DamageType.WATER, 0)).toThrow(
      'MarkedTargetBonus multiplier must be greater than 0',
    );
  });
});
