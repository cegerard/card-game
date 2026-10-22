import { Execution } from '../execution';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../../fighting-card';
import { AttackResult } from '../../action-result/attack-result';
import { SurviveSkill } from '../../../skills/survive';

const hit = (defender: FightingCard, dodge = false): AttackResult => ({
  damage: dodge ? 0 : 10,
  isCritical: false,
  dodge,
  defender,
  remainingHealth: defender.actualHealth,
});

const atHealthRatio = (ratio: number, survive?: SurviveSkill) => {
  const card = createFightingCard({ health: 1000, survive });
  card.addRealDamage(1000 * (1 - ratio));
  return card;
};

describe('Execution', () => {
  const judgement = () => new Execution(0.25);

  it('kills a defender left under the threshold', () => {
    const prey = atHealthRatio(0.2);
    judgement().apply([hit(prey)]);

    expect(prey.isDead()).toBe(true);
  });

  it('reports the executed defender', () => {
    const prey = atHealthRatio(0.2);

    expect(judgement().apply([hit(prey)])).toEqual([{ card: prey }]);
  });

  it.each([0.25, 0.5])('spares a defender at a health ratio of %f', (ratio) => {
    const prey = atHealthRatio(ratio);

    expect(judgement().apply([hit(prey)])).toEqual([]);
  });

  it('spares a defender that dodged', () => {
    const prey = atHealthRatio(0.2);
    judgement().apply([hit(prey, true)]);

    expect(prey.isDead()).toBe(false);
  });

  it('executes a defender once, however many hits landed on it', () => {
    const prey = atHealthRatio(0.2);

    expect(judgement().apply([hit(prey), hit(prey)])).toHaveLength(1);
  });

  it('ignores the shield', () => {
    const prey = atHealthRatio(0.2);
    prey.applyShield(1, 3);
    judgement().apply([hit(prey)]);

    expect(prey.isDead()).toBe(true);
  });

  describe('against SURVIVE', () => {
    let prey: FightingCard;
    let results;

    beforeEach(() => {
      prey = atHealthRatio(0.2, new SurviveSkill('Dernier Souffle'));
      results = judgement().apply([hit(prey)]);
    });

    it('leaves the defender at 1 HP', () => {
      expect(prey.actualHealth).toBe(1);
    });

    it('reports the interception', () => {
      expect(results).toEqual([
        { card: prey, survived: true, survivedSkillName: 'Dernier Souffle' },
      ]);
    });
  });

  it.each([0, 1, NaN, Infinity])('rejects a threshold of %f', (threshold) => {
    expect(() => new Execution(threshold)).toThrow();
  });
});
