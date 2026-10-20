import { ConditionalAttack } from '../conditional-attack';
import { MultipleAttack } from '../multiple-attack';
import { HitAlterations } from '../../@types/attack/hit-alterations';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { AlwaysTrueAttackCondition } from '../../@types/attack/conditions/always-true-attack-condition';
import { TurnStart } from '../../../trigger/turn-start';
import { TargetedAll } from '../../../targeting-card-strategies/targeted-all';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { AttackSkillResults } from '../skill';

describe('ConditionalAttack altering the defenders it hits', () => {
  const launch = () => {
    const owner = createFightingCard({ accuracy: 9999 });
    const enemies = [1, 2].map(() =>
      createFightingCard({ agility: 0, health: 50000 }),
    );
    const results = new ConditionalAttack(
      'Jugement de l’Obsidienne',
      new MultipleAttack(
        'Jugement de l’Obsidienne',
        3,
        [new DamageComposition(DamageType.EARTH, 1)],
        new TargetedAll(),
      ),
      new AlwaysTrueAttackCondition(),
      new TurnStart(),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      new HitAlterations([
        { polarity: 'debuff', type: 'agility', rate: 0.5, duration: 3 },
      ]),
    ).launch(owner, {
      sourcePlayer: new Player('p1', [owner]),
      opponentPlayer: new Player('p2', enemies),
    }) as AttackSkillResults;
    return { results, enemies };
  };

  it('debuffs each enemy hit once, named after the skill', () => {
    const { results, enemies } = launch();

    expect(results.hitAlterations).toEqual({
      name: 'Jugement de l’Obsidienne',
      buffs: [],
      debuffs: enemies.map((enemy) =>
        expect.objectContaining({ target: enemy.identityInfo }),
      ),
    });
  });
});
