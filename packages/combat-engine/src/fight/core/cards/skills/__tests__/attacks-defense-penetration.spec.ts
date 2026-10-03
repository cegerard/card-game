import { SimpleAttack } from '../simple-attack';
import { MultipleAttack } from '../multiple-attack';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { TargetedFromPosition } from '../../../targeting-card-strategies/targeted-from-position';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { AttackSkill } from '../attack-skill';

const physical = [new DamageComposition(DamageType.PHYSICAL, 1)];

const attacks: Record<string, () => AttackSkill> = {
  simple: () =>
    new SimpleAttack(
      'Détonation',
      physical,
      new TargetedFromPosition(),
      [],
      undefined,
      0.5,
    ),
  multiple: () =>
    new MultipleAttack(
      'Détonation',
      1,
      physical,
      new TargetedFromPosition(),
      0,
      [],
      undefined,
      undefined,
      undefined,
      0.5,
    ),
};

describe.each(Object.entries(attacks))(
  '%s attack with a defense penetration',
  (_kind, build) => {
    it('ignores that share of the defense', () => {
      const attacker = createFightingCard({
        attack: 100,
        criticalChance: 0,
        accuracy: 50,
      });
      const defender = createFightingCard({
        defense: 40,
        agility: 0,
        health: 1000,
      });

      const [result] = build().launch(attacker, {
        sourcePlayer: new Player('p1', [attacker]),
        opponentPlayer: new Player('p2', [defender]),
      }).results;

      expect(result.damage).toBe(80);
    });
  },
);
