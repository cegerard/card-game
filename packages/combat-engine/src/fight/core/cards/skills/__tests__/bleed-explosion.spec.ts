import { BleedExplosionSkill } from '../bleed-explosion';
import { SelfDeathTrigger } from '../../../trigger/self-death';
import { CardStateBleeding } from '../../@types/state/card-state-bleeding';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { AttackSkillResults } from '../skill';

const bleed = (card: FightingCard, stacks: number) =>
  card.setState(
    new CardStateBleeding(
      Array.from({ length: stacks }, () => ({
        remainingTurns: 3,
        damageValue: 5,
      })),
    ),
  );

describe('BleedExplosionSkill', () => {
  let scythra: FightingCard;
  let bleedingEnemy: FightingCard;
  let healthyEnemy: FightingCard;
  let bleedingAlly: FightingCard;
  let results: AttackSkillResults;

  beforeEach(() => {
    scythra = createFightingCard({ id: 'scythra', attack: 200 });
    bleedingEnemy = createFightingCard({ defense: 500, health: 1000 });
    healthyEnemy = createFightingCard({ health: 1000 });
    bleedingAlly = createFightingCard({ health: 1000 });
    bleed(bleedingEnemy, 4);
    bleed(bleedingAlly, 1);

    results = new BleedExplosionSkill(
      'Héritage',
      0.2,
      new SelfDeathTrigger('scythra'),
      'transe-predatrice',
    ).launch(scythra, {
      sourcePlayer: new Player('p1', [scythra, bleedingAlly]),
      opponentPlayer: new Player('p2', [bleedingEnemy, healthyEnemy]),
    }) as AttackSkillResults;
  });

  it('strikes every bleeding card of both teams', () => {
    expect(results.results.map((r) => r.defender)).toEqual([
      bleedingAlly,
      bleedingEnemy,
    ]);
  });

  it('deals a share of its source attack, defense ignored', () => {
    expect(bleedingEnemy.actualHealth).toBe(960);
  });

  it('removes the exploded stacks', () => {
    expect(bleedingEnemy.bleedStacks()).toBe(0);
  });

  it('reports the stacks each card lost', () => {
    expect(results.results.map((r) => r.consumedBleedStacks)).toEqual([1, 4]);
  });

  it('runs only inside its stance', () => {
    expect(
      new BleedExplosionSkill(
        'Héritage',
        0.2,
        new SelfDeathTrigger('scythra'),
        'transe-predatrice',
      ).requiredStance,
    ).toBe('transe-predatrice');
  });
});
