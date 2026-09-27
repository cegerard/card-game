import { ProtectionSkill } from '../protection';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { Player } from '../../../player';
import { FightingContext } from '../../@types/fighting-context';
import { TurnEnd } from '../../../trigger/turn-end';
import { MostWoundedAllyStrategy } from '../../../targeting-card-strategies/most-wounded-ally';
import { SkillKind } from '../skill';
import { AnyAllyHealthBelowThresholdTrigger } from '../../../trigger/any-ally-health-below-threshold-trigger';

const DURATION = 2;
const THRESHOLD = 0.2;

describe('ProtectionSkill', () => {
  let guardian: FightingCard;
  let ally: FightingCard;
  let context: FightingContext;

  function buildSkill(activationLimit?: number): ProtectionSkill {
    return new ProtectionSkill(
      'Gardien Éternel',
      DURATION,
      new TurnEnd(),
      new MostWoundedAllyStrategy(THRESHOLD),
      activationLimit,
    );
  }

  beforeEach(() => {
    guardian = createFightingCard({ id: 'guardian', health: 1000 });
    ally = createFightingCard({ id: 'ally', health: 1000 });
    context = {
      sourcePlayer: new Player('p1', [guardian, ally]),
      opponentPlayer: new Player('p2', [createFightingCard()]),
    };
  });

  describe('when an ally is below the threshold', () => {
    beforeEach(() => {
      ally.addRealDamage(900);
    });

    it('steps in front of that ally', () => {
      buildSkill().launch(guardian, context);

      expect(guardian.isProtecting(ally)).toBe(true);
    });

    it('reports the protected card', () => {
      const results = buildSkill().launch(guardian, context).results;

      expect(results).toEqual([
        { protectedCard: ally, remainingTurns: DURATION },
      ]);
    });

    it('reports the protection skill kind', () => {
      const result = buildSkill().launch(guardian, context);

      expect(result.skillKind).toBe(SkillKind.Protection);
    });
  });

  describe('when no ally is below the threshold', () => {
    it('protects nobody', () => {
      buildSkill().launch(guardian, context);

      expect(guardian.protectedAlly).toBeUndefined();
    });

    it('reports no result', () => {
      expect(buildSkill().launch(guardian, context).results).toEqual([]);
    });

    it('spends no activation, so a later crossing still fires', () => {
      const skill = buildSkill(1);
      skill.launch(guardian, context);

      expect(skill.isTriggered('turn-end')).toBe(true);
    });
  });

  describe('with an activation limit', () => {
    beforeEach(() => {
      ally.addRealDamage(900);
    });

    it('triggers before it is reached', () => {
      expect(buildSkill(1).isTriggered('turn-end')).toBe(true);
    });

    it('stops triggering once reached', () => {
      const skill = buildSkill(1);
      skill.launch(guardian, context);

      expect(skill.isTriggered('turn-end')).toBe(false);
    });

    it('keeps triggering while budget remains', () => {
      const skill = buildSkill(2);
      skill.launch(guardian, context);

      expect(skill.isTriggered('turn-end')).toBe(true);
    });
  });

  describe('without an activation limit', () => {
    it('never exhausts', () => {
      ally.addRealDamage(900);
      const skill = buildSkill();
      skill.launch(guardian, context);

      expect(skill.isTriggered('turn-end')).toBe(true);
    });
  });

  describe('with an activatable trigger', () => {
    it('fires once the monitored ally crosses the threshold', () => {
      const trigger = new AnyAllyHealthBelowThresholdTrigger(
        THRESHOLD,
        guardian.id,
      );
      const skill = new ProtectionSkill(
        'Gardien Éternel',
        DURATION,
        trigger,
        new MostWoundedAllyStrategy(THRESHOLD),
      );
      ally.addRealDamage(900);
      skill.activate(`ally-health-${ally.id}`, context);

      expect(skill.isTriggered(`ally-health-${ally.id}`)).toBe(true);
    });
  });

  describe('with a plain trigger', () => {
    it('ignores an activation it has no use for', () => {
      const skill = buildSkill();

      expect(() => skill.activate('turn-end', context)).not.toThrow();
    });
  });

  describe('on an unrelated event', () => {
    it('does not trigger', () => {
      expect(buildSkill().isTriggered('next-action')).toBe(false);
    });
  });
});
