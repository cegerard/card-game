import { SpecialAttack } from '../skills/special-attack';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Player } from '../../player';
import { DamageComposition } from '../@types/damage/damage-composition';
import { DamageType } from '../@types/damage/damage-type';
import { TargetedFromPosition } from '../../targeting-card-strategies/targeted-from-position';
import { BleedAttackEffect } from '../@types/attack/attack-bleed-effect';
import { MathRandomizer } from '../../../tools/math-randomizer';
import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { AttackResult } from '../@types/action-result/attack-result';

const damages = [new DamageComposition(DamageType.PHYSICAL, 0.35)];
const bleed = new BleedAttackEffect(0.05, 4, 8, new MathRandomizer(), 2);

function fourHits(): SpecialAttack {
  return new SpecialAttack(
    'Dissection Éolienne',
    damages,
    30,
    new TargetedFromPosition(),
    bleed,
    undefined,
    undefined,
    undefined,
    undefined,
    4,
  );
}

describe('SpecialAttack with several hits', () => {
  let attacker: FightingCard;
  let context: FightingContext;

  const launch = (defender: FightingCard) => {
    context = {
      sourcePlayer: new Player('p1', [attacker]),
      opponentPlayer: new Player('p2', [defender]),
    };
    return fourHits().launch(attacker, context).actionResults as AttackResult[];
  };

  beforeEach(() => {
    attacker = createFightingCard({
      attack: 100,
      criticalChance: 0,
      accuracy: 50,
    });
  });

  describe('against a target that does not dodge', () => {
    let defender: FightingCard;
    let results: AttackResult[];

    beforeEach(() => {
      defender = createFightingCard({ defense: 0, health: 1000, agility: 0 });
      results = launch(defender);
    });

    it('reports one result per hit', () => {
      expect(results.map((r) => r.damage)).toEqual([35, 35, 35, 35]);
    });

    it('applies the effect on every landed hit', () => {
      expect(defender.bleedStacks()).toBe(8);
    });
  });

  it('applies no effect on dodged hits', () => {
    const dodger = createFightingCard({ defense: 0, agility: 999 });
    launch(dodger);

    expect(dodger.bleedStacks()).toBe(0);
  });

  it('stops hitting a target once it is dead', () => {
    const fragile = createFightingCard({ defense: 0, health: 50, agility: 0 });

    expect(launch(fragile)).toHaveLength(2);
  });

  it('rejects less than one hit', () => {
    const build = () =>
      new SpecialAttack(
        'Invalid',
        damages,
        30,
        new TargetedFromPosition(),
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        0,
      );

    expect(build).toThrow();
  });
});
