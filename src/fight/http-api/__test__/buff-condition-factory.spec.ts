import 'reflect-metadata';

import { BuffConditionType } from '../dto/fight-data.dto';
import { buildBuffCondition } from '../buff-condition-factory';
import { AllyPresenceCondition } from '../../core/cards/@types/alteration/conditions/ally-presence-condition';
import { HealthThresholdCondition } from '../../core/cards/@types/alteration/conditions/health-threshold-condition';

describe('buildBuffCondition', () => {
  describe('ALLY_PRESENCE', () => {
    it('returns AllyPresenceCondition when allyName is provided', () => {
      const condition = buildBuffCondition(BuffConditionType.ALLY_PRESENCE, {
        allyName: 'Hero',
      });
      expect(condition).toBeInstanceOf(AllyPresenceCondition);
    });

    it('throws when allyName is missing', () => {
      expect(() =>
        buildBuffCondition(BuffConditionType.ALLY_PRESENCE, {}),
      ).toThrow('AllyPresenceCondition requires allyName');
    });
  });

  describe('HEALTH_THRESHOLD', () => {
    it('returns HealthThresholdCondition with defaults when no params provided', () => {
      const condition = buildBuffCondition(
        BuffConditionType.HEALTH_THRESHOLD,
        {},
      );
      expect(condition).toBeInstanceOf(HealthThresholdCondition);
    });

    it('returns HealthThresholdCondition with valid above operator', () => {
      const condition = buildBuffCondition(BuffConditionType.HEALTH_THRESHOLD, {
        threshold: 0.3,
        operator: 'above',
      });
      expect(condition).toBeInstanceOf(HealthThresholdCondition);
    });

    it('returns HealthThresholdCondition with valid below operator', () => {
      const condition = buildBuffCondition(BuffConditionType.HEALTH_THRESHOLD, {
        threshold: 0.5,
        operator: 'below',
      });
      expect(condition).toBeInstanceOf(HealthThresholdCondition);
    });

    it('throws for an invalid operator', () => {
      expect(() =>
        buildBuffCondition(BuffConditionType.HEALTH_THRESHOLD, {
          operator: 'greater',
        }),
      ).toThrow('Invalid operator: greater');
    });

    it('throws for an empty string operator', () => {
      expect(() =>
        buildBuffCondition(BuffConditionType.HEALTH_THRESHOLD, {
          operator: '',
        }),
      ).toThrow('Invalid operator: ');
    });
  });

  describe('unknown type', () => {
    it('throws for an unknown BuffConditionType', () => {
      expect(() =>
        buildBuffCondition('UNKNOWN_TYPE' as BuffConditionType, {}),
      ).toThrow('Unknown BuffConditionType: UNKNOWN_TYPE');
    });
  });
});
