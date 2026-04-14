import { Healing } from '../healing';
import { Trigger } from '../../../trigger/trigger';
import { Launcher } from '../../../targeting-card-strategies/launcher';

describe('Healing.isTriggered', () => {
  describe('context passthrough', () => {
    let capturedTriggerId: string;
    const stubTrigger: Trigger = {
      id: 'stub-trigger',
      isTriggered(triggerId: string): boolean {
        capturedTriggerId = triggerId;
        return true;
      },
    };
    const skill = new Healing(1.0, stubTrigger, new Launcher());

    beforeEach(() => {
      capturedTriggerId = undefined;
    });

    it('passes the trigger name through to the underlying trigger', () => {
      skill.isTriggered('turn-end');

      expect(capturedTriggerId).toBe('turn-end');
    });

    it('returns the result from the underlying trigger', () => {
      const result = skill.isTriggered('turn-end');

      expect(result).toBe(true);
    });
  });
});
