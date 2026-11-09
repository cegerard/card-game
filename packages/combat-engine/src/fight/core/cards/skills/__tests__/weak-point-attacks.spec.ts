import { SimpleAttack } from '../simple-attack';
import { MultipleAttack } from '../multiple-attack';
import { SpecialAttack } from '../special-attack';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { TargetedFromPosition } from '../../../targeting-card-strategies/targeted-from-position';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { WeakPoint, WeakPointSpec } from '../../@types/weak-point/weak-point';
import { WeakPointAttackEffect } from '../../@types/attack/attack-weak-point-effect';
import { FreezeAttackEffect } from '../../@types/attack/attack-freeze-effect';
import { FrozenTargetBonus } from '../../@types/attack/frozen-target-bonus';
import { MathRandomizer } from '../../../../tools/math-randomizer';
import { FightingContext } from '../../@types/fighting-context';
import { AttackResult } from '../../@types/action-result/attack-result';

const damages = [new DamageComposition(DamageType.PHYSICAL, 1)];
const position = () => new TargetedFromPosition();
const critical: WeakPointSpec = {
  name: 'Critique',
  damageMultiplier: 1.6,
  consumable: true,
};
const freeze = () => new FreezeAttackEffect(0.2, 1, new MathRandomizer());
const simple = () => new SimpleAttack('Souffle', damages, position());
const multiple = () => new MultipleAttack('Rafale', 2, damages, position());
const piercing = () =>
  new SimpleAttack('Tempête', damages, position(), [], [], 0, undefined, 0.4);
const frozenBonus = () =>
  new SimpleAttack(
    'Souffle',
    damages,
    position(),
    [],
    [new FrozenTargetBonus(undefined, 1.2)],
  );

describe('Attacks against a weak point', () => {
  let attacker: FightingCard;
  let defender: FightingCard;
  let context: FightingContext;

  const reveal = (spec: WeakPointSpec) =>
    defender.revealWeakPoint(new WeakPoint(spec, attacker));
  const launch = (attack: SimpleAttack | MultipleAttack): AttackResult[] =>
    attack.launch(attacker, context).results;
  const facing = (stats: { agility: number }) => {
    defender = createFightingCard({ ...stats, defense: 50, health: 1000 });
    context.opponentPlayer = new Player('p2', [defender]);
  };

  beforeEach(() => {
    attacker = createFightingCard({
      attack: 100,
      accuracy: 100,
      criticalChance: 0,
    });
    context = {
      sourcePlayer: new Player('p1', [attacker]),
      opponentPlayer: null,
    };
    facing({ agility: 0 });
  });

  it('amplify the damage of a simple attack', () => {
    reveal(critical);

    expect(launch(simple())[0].damage).toBe(80);
  });

  it('amplify the damage of every hit of a multiple attack', () => {
    reveal({ name: 'Marque', damageMultiplier: 2 });

    expect(launch(multiple()).map((r) => r.damage)).toEqual([100, 100]);
  });

  it('are used up by the first hit of a multiple attack', () => {
    reveal(critical);

    expect(launch(multiple()).map((r) => r.damage)).toEqual([80, 50]);
  });

  it('are used up by a dodged hit', () => {
    facing({ agility: 9999 });
    reveal(critical);
    launch(simple());

    expect(defender.hasWeakPoint()).toBe(false);
  });

  it('report the weak point a dodged hit used up', () => {
    facing({ agility: 9999 });
    reveal(critical);

    expect(launch(simple())[0].effects).toEqual([
      expect.objectContaining({ reason: 'dodged' }),
    ]);
  });

  it('let the revealer outaim a defender it could not hit', () => {
    facing({ agility: 120 });
    reveal({ name: 'Point Faible', revealerBonus: { accuracyRate: 0.4 } });

    expect(launch(simple())[0].dodge).toBe(false);
  });

  it('let a conditional attack ignore more defense', () => {
    reveal({ name: 'Marque' });

    expect(launch(piercing())[0].damage).toBe(70);
  });

  it('leave the defense whole on a defender without weak point', () => {
    expect(launch(piercing())[0].damage).toBe(50);
  });

  it('deal a frozen target bonus on a frozen defender, the freeze amplifier on top', () => {
    freeze().applyEffect(defender, attacker, context);

    expect(launch(frozenBonus())[0].damage).toBe(84);
  });

  it('deal no frozen target bonus on a defender that is not frozen', () => {
    expect(launch(frozenBonus())[0].damage).toBe(50);
  });
});

describe('A special attack with several effects', () => {
  let defender: FightingCard;

  beforeEach(() => {
    const attacker = createFightingCard({ accuracy: 100, criticalChance: 0 });
    defender = createFightingCard({ agility: 0 });
    new SpecialAttack('Étreinte', damages, 0, position(), [
      freeze(),
      new WeakPointAttackEffect(critical, new MathRandomizer()),
    ]).launch(attacker, {
      sourcePlayer: new Player('p1', [attacker]),
      opponentPlayer: new Player('p2', [defender]),
    });
  });

  it('lays its first effect', () => {
    expect(defender.isFrozen).toBe(true);
  });

  it('lays its second effect', () => {
    expect(defender.hasWeakPoint()).toBe(true);
  });
});
