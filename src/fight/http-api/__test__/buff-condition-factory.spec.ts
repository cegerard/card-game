import 'reflect-metadata';

import { AlterationCondition } from '../../core/cards/@types/alteration/alteration-condition';
import { AllyPresenceCondition } from '../../core/cards/@types/alteration/conditions/ally-presence-condition';
import { HealthThresholdCondition } from '../../core/cards/@types/alteration/conditions/health-threshold-condition';
import { BuffConditionType } from '../dto/fight-data.dto';
import { buildAlterationCondition } from '../buff-condition-factory';

describe('buildAlterationCondition', () => {
  describe('ALLY_PRESENCE', () => {
    let condition: AlterationCondition;

    beforeEach(() => {
      condition = buildAlterationCondition(BuffConditionType.ALLY_PRESENCE, {
        allyName: 'Hero',
      });
    });

    it('returns AllyPresenceCondition when allyName is provided', () => {
      expect(condition).toBeInstanceOf(AllyPresenceCondition);
    });

    it('throws when allyName is missing', () => {
      expect(() =>
        buildAlterationCondition(BuffConditionType.ALLY_PRESENCE, {}),
      ).toThrow('AllyPresenceCondition requires allyName');
    });
  });

  describe('HEALTH_THRESHOLD', () => {
    describe('with default params', () => {
      let condition: AlterationCondition;

      beforeEach(() => {
        condition = buildAlterationCondition(
          BuffConditionType.HEALTH_THRESHOLD,
          {},
        );
      });

      it('returns HealthThresholdCondition', () => {
        expect(condition).toBeInstanceOf(HealthThresholdCondition);
      });
    });

    describe('with above operator', () => {
      let condition: AlterationCondition;

      beforeEach(() => {
        condition = buildAlterationCondition(
          BuffConditionType.HEALTH_THRESHOLD,
          {
            threshold: 0.3,
            operator: 'above',
          },
        );
      });

      it('returns HealthThresholdCondition', () => {
        expect(condition).toBeInstanceOf(HealthThresholdCondition);
      });
    });

    describe('with below operator', () => {
      let condition: AlterationCondition;

      beforeEach(() => {
        condition = buildAlterationCondition(
          BuffConditionType.HEALTH_THRESHOLD,
          {
            threshold: 0.5,
            operator: 'below',
          },
        );
      });

      it('returns HealthThresholdCondition', () => {
        expect(condition).toBeInstanceOf(HealthThresholdCondition);
      });
    });

    it('throws for an invalid operator', () => {
      expect(() =>
        buildAlterationCondition(BuffConditionType.HEALTH_THRESHOLD, {
          operator: 'greater',
        }),
      ).toThrow('Invalid operator: greater');
    });

    it('throws for an empty string operator', () => {
      expect(() =>
        buildAlterationCondition(BuffConditionType.HEALTH_THRESHOLD, {
          operator: '',
        }),
      ).toThrow('Invalid operator: ');
    });
  });

  describe('unknown type', () => {
    it('throws for an unknown BuffConditionType', () => {
      expect(() =>
        buildAlterationCondition('UNKNOWN_TYPE' as BuffConditionType, {}),
      ).toThrow('Unknown BuffConditionType: UNKNOWN_TYPE');
    });
  });
});
