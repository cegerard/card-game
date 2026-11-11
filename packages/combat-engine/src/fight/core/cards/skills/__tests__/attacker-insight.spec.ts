import { AttackerInsightSkill } from '../attacker-insight';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';

describe('AttackerInsightSkill', () => {
  let owner: FightingCard;
  let enemy: FightingCard;

  beforeEach(() => {
    owner = createFightingCard({
      accuracy: 100,
      agility: 70,
      attackerInsight: new AttackerInsightSkill(
        'Intelligence des Profondeurs',
        0.15,
        0.1,
      ),
    });
    enemy = createFightingCard({});
  });

  it('grants nothing against an enemy that never attacked', () => {
    expect(owner.accuracyAgainst(enemy)).toBe(100);
  });

  it('sharpens the accuracy against an enemy that attacked', () => {
    enemy.recordAttack();

    expect(owner.accuracyAgainst(enemy)).toBe(115);
  });

  it('raises the agility against an enemy that attacked', () => {
    enemy.recordAttack();

    expect(owner.agilityAgainst(enemy)).toBe(77);
  });

  it('rejects a negative rate', () => {
    expect(() => new AttackerInsightSkill('x', -0.1, 0)).toThrow(
      'AttackerInsight rates must be >= 0, got -0.1 and 0',
    );
  });
});
