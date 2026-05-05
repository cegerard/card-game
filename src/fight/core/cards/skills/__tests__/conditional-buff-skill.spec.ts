import { AlterationSkill } from '../alteration-skill';
import { SkillKind } from '../skill';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { Player } from '../../../player';
import { TurnEnd } from '../../../trigger/turn-end';
import { Launcher } from '../../../targeting-card-strategies/launcher';
import { HealthThresholdCondition } from '../../@types/alteration/conditions/health-threshold-condition';

describe('AlterationSkill with activationCondition', () => {
  const trigger = new TurnEnd();
  const targetingStrategy = new Launcher();

  function makeContext(source) {
    return {
      sourcePlayer: new Player('P1', [source]),
      opponentPlayer: new Player('P2', []),
    };
  }

  describe('when activation condition is met', () => {
    let results;

    beforeEach(() => {
      const condition = new HealthThresholdCondition(0.5, 'above');
      const skill = new AlterationSkill({
        name: 'skill',
        polarity: 'buff',
        attributeType: 'attack',
        rate: 0.1,
        duration: 2,
        trigger,
        targetingStrategy,
        activationCondition: condition,
      });
      const source = createFightingCard({ health: 100 });
      results = skill.launch(source, makeContext(source));
    });

    it('returns buff results', () => {
      expect(results.results.length).toBe(1);
    });
  });

  describe('when activation condition is not met', () => {
    let results;

    beforeEach(() => {
      const condition = new HealthThresholdCondition(0.5, 'above');
      const skill = new AlterationSkill({
        name: 'skill',
        polarity: 'buff',
        attributeType: 'attack',
        rate: 0.1,
        duration: 2,
        trigger,
        targetingStrategy,
        activationCondition: condition,
      });
      const source = createFightingCard({ health: 100 });
      source.addRealDamage(60);
      results = skill.launch(source, makeContext(source));
    });

    it('returns empty results', () => {
      expect(results.results.length).toBe(0);
    });

    it('returns Buff skillKind', () => {
      expect(results.skillKind).toBe(SkillKind.Buff);
    });
  });

  describe('when no activation condition is set', () => {
    let results;

    beforeEach(() => {
      const skill = new AlterationSkill({
        name: 'skill',
        polarity: 'buff',
        attributeType: 'attack',
        rate: 0.1,
        duration: 2,
        trigger,
        targetingStrategy,
      });
      const source = createFightingCard({ health: 100 });
      source.addRealDamage(99);
      results = skill.launch(source, makeContext(source));
    });

    it('always applies buff', () => {
      expect(results.results.length).toBe(1);
    });
  });
});
