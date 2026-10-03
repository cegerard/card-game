import { ConditionalAttack } from '../conditional-attack';
import { SimpleAttack } from '../simple-attack';
import { Splash } from '../../@types/attack/splash';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { AlwaysTrueAttackCondition } from '../../@types/attack/conditions/always-true-attack-condition';
import { TurnStart } from '../../../trigger/turn-start';
import { TargetingCardStrategy } from '../../../targeting-card-strategies/targeting-card-strategy';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { AttackSkillResults } from '../skill';

const targeting = (pick: (enemies: FightingCard[]) => FightingCard[]) => ({
  id: 'picked',
  targetedCards: (_c, _a, defending: Player) => pick(defending.allCards),
});

describe('ConditionalAttack with a splash', () => {
  let owner: FightingCard;
  let enemies: FightingCard[];

  const launch = (strategy: TargetingCardStrategy) =>
    new ConditionalAttack(
      'Exsanguination Totale',
      new SimpleAttack(
        'Exsanguination Totale',
        [new DamageComposition(DamageType.PHYSICAL, 1)],
        strategy,
      ),
      new AlwaysTrueAttackCondition(),
      new TurnStart(),
      undefined,
      undefined,
      undefined,
      new Splash('Vent Écarlate', [new DamageComposition(DamageType.AIR, 0.6)]),
    ).launch(owner, {
      sourcePlayer: new Player('p1', [owner]),
      opponentPlayer: new Player('p2', enemies),
    }) as AttackSkillResults;

  beforeEach(() => {
    owner = createFightingCard({ accuracy: 9999, criticalChance: 0 });
    enemies = [1, 2, 3, 4].map(() =>
      createFightingCard({ agility: 0, health: 100000 }),
    );
  });

  it('strikes the zone around the primary target', () => {
    const { splash } = launch(targeting((e) => [e[2]]));

    expect(splash.results.map((r) => r.defender)).toEqual([
      enemies[1],
      enemies[2],
      enemies[3],
    ]);
  });

  it('reports the splash under its own name', () => {
    expect(launch(targeting((e) => [e[2]])).splash.name).toBe('Vent Écarlate');
  });

  it('does not splash when nobody was targeted', () => {
    expect(launch(targeting(() => [])).splash).toBeUndefined();
  });
});
