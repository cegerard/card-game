import { AlterationSkill } from '../alteration-skill';
import { SkillKind } from '../skill';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { Player } from '../../../player';
import { TurnEnd } from '../../../trigger/turn-end';
import { Launcher } from '../../../targeting-card-strategies/launcher';

describe('AlterationSkill lifecycle', () => {
  const trigger = new TurnEnd();
  const targeting = new Launcher();

  function makeContext(source) {
    return {
      sourcePlayer: new Player('P1', [source]),
      opponentPlayer: new Player('P2', []),
    };
  }

  describe('when activationLimit is not set', () => {
    it('is always triggered', () => {
      const skill = new AlterationSkill({
        name: 'skill',
        polarity: 'buff',
        attributeType: 'attack',
        rate: 0.1,
        duration: 2,
        trigger,
        targetingStrategy: targeting,
      });
      expect(skill.isTriggered('turn-end')).toBe(true);
    });

    it('never returns endEvent', () => {
      const source = createFightingCard({ health: 100 });
      const skill = new AlterationSkill({
        name: 'skill',
        polarity: 'buff',
        attributeType: 'attack',
        rate: 0.1,
        duration: 2,
        trigger,
        targetingStrategy: targeting,
      });
      const result = skill.launch(source, makeContext(source));

      expect(result.endEvent).toBeUndefined();
    });
  });

  describe('when activationLimit is set to 3', () => {
    let skill;

    beforeEach(() => {
      skill = new AlterationSkill({
        name: 'skill',
        polarity: 'buff',
        attributeType: 'attack',
        rate: 0.1,
        duration: 2,
        trigger,
        targetingStrategy: targeting,
        activationLimit: 3,
        endEvent: 'test-end',
      });
    });

    it('increments activationCount on each launch', () => {
      const source = createFightingCard({ health: 100 });
      const ctx = makeContext(source);
      skill.launch(source, ctx);
      skill.launch(source, ctx);

      expect(skill['activationCount']).toBe(2);
    });

    it('does not include endEvent on first activation', () => {
      const source = createFightingCard({ health: 100 });
      const result = skill.launch(source, makeContext(source));

      expect(result.endEvent).toBeUndefined();
    });

    it('includes endEvent on the 3rd (final) activation', () => {
      const source = createFightingCard({ health: 100 });
      const ctx = makeContext(source);
      skill.launch(source, ctx);
      skill.launch(source, ctx);
      const result = skill.launch(source, ctx);

      expect(result.endEvent).toBe('test-end');
    });

    it('returns skillKind Buff on each activation', () => {
      const source = createFightingCard({ health: 100 });
      const ctx = makeContext(source);
      skill.launch(source, ctx);
      skill.launch(source, ctx);
      const result = skill.launch(source, ctx);

      expect(result.skillKind).toBe(SkillKind.Buff);
    });

    it('isTriggered returns false after exhaustion', () => {
      const source = createFightingCard({ health: 100 });
      const ctx = makeContext(source);
      skill.launch(source, ctx);
      skill.launch(source, ctx);
      skill.launch(source, ctx);

      expect(skill.isTriggered('turn-end')).toBe(false);
    });

    it('lifecycleEndEvent returns endEvent when not exhausted', () => {
      expect(skill.lifecycleEndEvent()).toBe('test-end');
    });

    it('lifecycleEndEvent returns undefined after exhaustion', () => {
      const source = createFightingCard({ health: 100 });
      const ctx = makeContext(source);
      skill.launch(source, ctx);
      skill.launch(source, ctx);
      skill.launch(source, ctx);

      expect(skill.lifecycleEndEvent()).toBeUndefined();
    });
  });

  describe('debuff polarity', () => {
    it('returns skillKind Debuff', () => {
      const source = createFightingCard({ health: 100 });
      const skill = new AlterationSkill({
        name: 'skill',
        polarity: 'debuff',
        attributeType: 'attack',
        rate: 0.1,
        duration: 2,
        trigger,
        targetingStrategy: targeting,
      });
      const result = skill.launch(source, makeContext(source));

      expect(result.skillKind).toBe(SkillKind.Debuff);
    });

    it('applies debuff to target', () => {
      const source = createFightingCard({ attack: 100, health: 100 });
      const initialAttack = source.actualAttack;
      const skill = new AlterationSkill({
        name: 'skill',
        polarity: 'debuff',
        attributeType: 'attack',
        rate: 0.1,
        duration: 2,
        trigger,
        targetingStrategy: targeting,
      });
      skill.launch(source, makeContext(source));

      expect(source.actualAttack).toBe(initialAttack - 10);
    });

    it('sets terminationEvent on applied debuff', () => {
      const source = createFightingCard({ attack: 100, health: 100 });
      const skill = new AlterationSkill({
        name: 'skill',
        polarity: 'debuff',
        attributeType: 'attack',
        rate: 0.1,
        duration: Infinity,
        trigger,
        targetingStrategy: targeting,
        terminationEvent: 'my-end-event',
      });
      skill.launch(source, makeContext(source));

      expect(source.removeEventBoundDebuffs('my-end-event')).toHaveLength(1);
    });
  });
});
