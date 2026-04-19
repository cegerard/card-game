import { Healing } from '../healing';
import { Trigger } from '../../../trigger/trigger';
import { Launcher } from '../../../targeting-card-strategies/launcher';
import { TurnEnd } from '../../../trigger/turn-end';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { Player } from '../../../player';
import { FightingCard } from '../../fighting-card';

describe('Healing with activationLimit and endEvent', () => {
  let source: FightingCard;
  let context: { sourcePlayer: Player; opponentPlayer: Player };

  beforeEach(() => {
    source = createFightingCard({ attack: 100, health: 500 });
    const player1 = new Player('p1', [source]);
    const player2 = new Player('p2', [createFightingCard()]);
    context = { sourcePlayer: player1, opponentPlayer: player2 };
  });

  it('emits endEvent when activationLimit is reached', () => {
    const skill = new Healing(
      0,
      new TurnEnd(),
      new Launcher(),
      undefined,
      1,
      'power-end',
    );

    const result = skill.launch(source, context);

    expect(result.endEvent).toBe('power-end');
  });

  it('does not emit endEvent before activationLimit is reached', () => {
    const skill = new Healing(
      0,
      new TurnEnd(),
      new Launcher(),
      undefined,
      2,
      'power-end',
    );

    const result = skill.launch(source, context);

    expect(result.endEvent).toBeUndefined();
  });

  it('stops triggering after activationLimit is exhausted', () => {
    const skill = new Healing(
      0,
      new TurnEnd(),
      new Launcher(),
      undefined,
      1,
      'power-end',
    );
    skill.launch(source, context);

    expect(skill.isTriggered('turn-end')).toBe(false);
  });

  it('returns lifecycleEndEvent before exhaustion', () => {
    const skill = new Healing(
      0,
      new TurnEnd(),
      new Launcher(),
      undefined,
      1,
      'power-end',
    );

    expect(skill.lifecycleEndEvent()).toBe('power-end');
  });

  it('returns undefined from lifecycleEndEvent after exhaustion', () => {
    const skill = new Healing(
      0,
      new TurnEnd(),
      new Launcher(),
      undefined,
      1,
      'power-end',
    );
    skill.launch(source, context);

    expect(skill.lifecycleEndEvent()).toBeUndefined();
  });
});

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
