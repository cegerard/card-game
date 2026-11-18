import 'reflect-metadata';

import { AlterationConditionType } from '@card-game/shared-types';

import { AlterationCondition } from '../../core/cards/@types/alteration/alteration-condition';
import { AllyPresenceCondition } from '../../core/cards/@types/alteration/conditions/ally-presence-condition';
import { HealthThresholdCondition } from '../../core/cards/@types/alteration/conditions/health-threshold-condition';
import { ProbabilityCondition } from '../../core/cards/@types/alteration/conditions/probability-condition';
import { RandomizerFake } from '../../../../test/helpers/randomizer-fake';
import { buildAlterationCondition } from '../alteration-condition-factory';

// Only the PROBABILITY condition rolls: a fake randomizer does for the others
const build = (
  type: AlterationConditionType,
  params: Parameters<typeof buildAlterationCondition>[1],
) => buildAlterationCondition(type, params, new RandomizerFake());

describe('buildAlterationCondition', () => {
  describe('ALLY_PRESENCE', () => {
    let condition: AlterationCondition;

    beforeEach(() => {
      condition = build(AlterationConditionType.ALLY_PRESENCE, {
        allyName: 'Hero',
      });
    });

    it('returns AllyPresenceCondition when allyName is provided', () => {
      expect(condition).toBeInstanceOf(AllyPresenceCondition);
    });

    it('throws when allyName is missing', () => {
      expect(() => build(AlterationConditionType.ALLY_PRESENCE, {})).toThrow(
        'AllyPresenceCondition requires allyName',
      );
    });
  });

  describe('HEALTH_THRESHOLD', () => {
    describe('with default params', () => {
      let condition: AlterationCondition;

      beforeEach(() => {
        condition = build(AlterationConditionType.HEALTH_THRESHOLD, {});
      });

      it('returns HealthThresholdCondition', () => {
        expect(condition).toBeInstanceOf(HealthThresholdCondition);
      });
    });

    describe('with above operator', () => {
      let condition: AlterationCondition;

      beforeEach(() => {
        condition = build(AlterationConditionType.HEALTH_THRESHOLD, {
          threshold: 0.3,
          operator: 'above',
        });
      });

      it('returns HealthThresholdCondition', () => {
        expect(condition).toBeInstanceOf(HealthThresholdCondition);
      });
    });

    describe('with below operator', () => {
      let condition: AlterationCondition;

      beforeEach(() => {
        condition = build(AlterationConditionType.HEALTH_THRESHOLD, {
          threshold: 0.5,
          operator: 'below',
        });
      });

      it('returns HealthThresholdCondition', () => {
        expect(condition).toBeInstanceOf(HealthThresholdCondition);
      });
    });

    it('throws for an invalid operator', () => {
      expect(() =>
        build(AlterationConditionType.HEALTH_THRESHOLD, {
          operator: 'greater',
        }),
      ).toThrow('Invalid operator: greater');
    });

    it('throws for an empty string operator', () => {
      expect(() =>
        build(AlterationConditionType.HEALTH_THRESHOLD, {
          operator: '',
        }),
      ).toThrow('Invalid operator: ');
    });
  });

  describe('unknown type', () => {
    it('throws for an unknown AlterationConditionType', () => {
      expect(() =>
        build('UNKNOWN_TYPE' as AlterationConditionType, {}),
      ).toThrow('Unknown AlterationConditionType: UNKNOWN_TYPE');
    });
  });

  describe('PROBABILITY', () => {
    it('returns ProbabilityCondition when probability is provided', () => {
      const condition = build(AlterationConditionType.PROBABILITY, {
        probability: 0.3,
      });

      expect(condition).toBeInstanceOf(ProbabilityCondition);
    });

    it('throws when probability is missing', () => {
      expect(() => build(AlterationConditionType.PROBABILITY, {})).toThrow(
        'ProbabilityCondition requires probability',
      );
    });

    it('accepts a probability of 0', () => {
      const condition = build(AlterationConditionType.PROBABILITY, {
        probability: 0,
      });

      expect(condition).toBeInstanceOf(ProbabilityCondition);
    });

    it('rolls with the injected randomizer', () => {
      const randomizer = new RandomizerFake().setNextRandomValue(0.9);
      const condition = buildAlterationCondition(
        AlterationConditionType.PROBABILITY,
        { probability: 0.3 },
        randomizer,
      );

      expect(condition.evaluate({} as any, {} as any)).toBe(false);
    });

    it('rejects a probability outside the allowed range', () => {
      expect(() =>
        build(AlterationConditionType.PROBABILITY, {
          probability: 2,
        }),
      ).toThrow('probability must be in [0, 1], got: 2');
    });
  });
});
