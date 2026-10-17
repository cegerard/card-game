import { SimpleAttack } from '../simple-attack';
import { MultipleAttack } from '../multiple-attack';
import { SpecialAttack } from '../special-attack';
import { ConcealedBonus } from '../../@types/attack/concealed-bonus';
import { BleedStackBonus } from '../../@types/attack/bleed-stack-bonus';
import { BleedAttackEffect } from '../../@types/attack/attack-bleed-effect';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { TargetedFromPosition } from '../../../targeting-card-strategies/targeted-from-position';
import { MathRandomizer } from '../../../../tools/math-randomizer';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { AttackResult } from '../../@types/action-result/attack-result';

const damages = [
  new DamageComposition(DamageType.PHYSICAL, 0.6),
  new DamageComposition(DamageType.AIR, 0.4),
];
const bonus = new ConcealedBonus(DamageType.PHYSICAL, 1.5);

describe('Attacks with a concealed bonus', () => {
  let attacker: FightingCard;
  let defender: FightingCard;

  const context = () => ({
    sourcePlayer: new Player('p1', [attacker]),
    opponentPlayer: new Player('p2', [defender]),
  });
  const damagesOf = (results: AttackResult[]) => results.map((r) => r.damage);

  beforeEach(() => {
    attacker = createFightingCard({
      attack: 100,
      criticalChance: 0,
      accuracy: 50,
    });
    defender = createFightingCard({ defense: 0, agility: 0, health: 10000 });
  });

  describe('simple attack', () => {
    const attack = () =>
      new SimpleAttack(
        'Lacération',
        damages,
        new TargetedFromPosition(),
        [],
        [bonus],
      );

    it('deals its base damage when the attacker is visible', () => {
      expect(damagesOf(attack().launch(attacker, context()).results)).toEqual([
        100,
      ]);
    });

    it('boosts the physical part from concealment', () => {
      attacker.conceal('Marche Fantôme');

      expect(damagesOf(attack().launch(attacker, context()).results)).toEqual([
        130,
      ]);
    });
  });

  it('boosts every hit of a multiple attack struck from concealment', () => {
    attacker.conceal('Marche Fantôme');
    const attack = new MultipleAttack(
      'Lacération',
      3,
      damages,
      new TargetedFromPosition(),
      0,
      [],
      undefined,
      undefined,
      [bonus],
    );

    const { results } = attack.launch(attacker, context());

    expect(damagesOf(results)).toEqual([130, 130, 130]);
  });

  it('boosts a special attack struck from concealment', () => {
    attacker.conceal('Marche Fantôme');
    const special = new SpecialAttack(
      'Fusion',
      damages,
      0,
      new TargetedFromPosition(),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      1,
      [bonus],
    );

    const results = special.launch(attacker, context())
      .actionResults as AttackResult[];

    expect(damagesOf(results)).toEqual([130]);
  });

  it('stacks with a bleed stack bonus on the same damage type', () => {
    attacker.conceal('Marche Fantôme');
    new BleedAttackEffect(0.05, 3, 8, new MathRandomizer(), 3).applyEffect(
      defender,
      attacker,
      null,
    );
    const attack = new SimpleAttack(
      'Lacération',
      damages,
      new TargetedFromPosition(),
      [],
      [new BleedStackBonus(3, DamageType.PHYSICAL, 1.2), bonus],
    );

    expect(damagesOf(attack.launch(attacker, context()).results)).toEqual([
      148,
    ]);
  });
});
