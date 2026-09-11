import { MultipleAttack } from '../skills/multiple-attack';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { createEffect } from '../../../../../test/helpers/effect';
import { Player } from '../../player';
import { DamageComposition } from '../@types/damage/damage-composition';
import { DamageType } from '../@types/damage/damage-type';
import { Element } from '../@types/damage/element';
import { TargetedAll } from '../../targeting-card-strategies/targeted-all';
import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { NamedAttackResult } from '../@types/action-result/named-attack-result';

const damages = [new DamageComposition(DamageType.PHYSICAL, 0.35)];
const comboFinisher = [new DamageComposition(DamageType.WATER, 0.9)];

function markEffect(stacks: number) {
  return createEffect({
    type: 'mark',
    rate: 0.05,
    damageType: DamageType.WATER,
    maxStacks: 5,
    stacks,
  });
}

describe('MultipleAttack combo finisher effects', () => {
  let attacker: FightingCard;
  let defender: FightingCard;
  let context: FightingContext;
  let attack: NamedAttackResult;

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

    attack = new MultipleAttack(
      'Tourbillon',
      5,
      damages,
      new TargetedAll(),
      0,
      undefined,
      comboFinisher,
      [markEffect(2)],
    ).launch(attacker, context);
  });

  it('applies the finisher effects once, not on every hit', () => {
    expect(defender.markStacks(DamageType.WATER)).toBe(2);
  });

  it('reports the effects on the finisher result', () => {
    expect(attack.results[attack.results.length - 1].effects).toEqual([
      { type: 'mark', card: defender, damageType: DamageType.WATER, stacks: 2 },
    ]);
  });

  it('leaves the regular hits without effects', () => {
    expect(attack.results.slice(0, 5).every((r) => !r.effects)).toBe(true);
  });
});

describe('MultipleAttack without combo finisher effects', () => {
  it('still deals the finisher damage', () => {
    const attacker = createFightingCard({
      attack: 100,
      defense: 0,
      criticalChance: 0,
      accuracy: 9999,
    });
    const defender = createFightingCard({
      defense: 0,
      health: 10000,
      agility: 0,
      element: Element.PHYSICAL,
    });
    const context = {
      sourcePlayer: new Player('p1', [attacker]),
      opponentPlayer: new Player('p2', [defender]),
    };

    const attack = new MultipleAttack(
      'Tourbillon',
      2,
      damages,
      new TargetedAll(),
      0,
      undefined,
      comboFinisher,
    ).launch(attacker, context);

    expect(attack.results[2].damage).toBe(90);
  });
});
