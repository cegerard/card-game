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
      'healing',
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
      'healing',
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
      'healing',
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
      'healing',
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
      'healing',
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
    const skill = new Healing('healing', 1.0, stubTrigger, new Launcher());

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

describe('Healing heal basis', () => {
  const RATE = 0.1;
  let source: FightingCard;
  let wounded: FightingCard;
  let context: { sourcePlayer: Player; opponentPlayer: Player };

  function healSelf(healBasis?: 'source-attack' | 'target-max-health') {
    const skill = new Healing(
      'healing',
      RATE,
      new TurnEnd(),
      new Launcher(),
      undefined,
      undefined,
      undefined,
      healBasis,
    );
    return skill.launch(wounded, context).results[0];
  }

  beforeEach(() => {
    source = createFightingCard({ attack: 100, health: 500 });
    wounded = createFightingCard({ attack: 40, health: 1000 });
    wounded.addRealDamage(900);
    context = {
      sourcePlayer: new Player('p1', [wounded, source]),
      opponentPlayer: new Player('p2', [createFightingCard()]),
    };
  });

  it('heals a share of the caster attack by default', () => {
    expect(healSelf()).toMatchObject({ healAmount: 4 });
  });

  it('heals a share of the target maximum health when asked', () => {
    expect(healSelf('target-max-health')).toMatchObject({ healAmount: 100 });
  });

  it('reports the resulting health', () => {
    expect(healSelf('target-max-health')).toMatchObject({
      remainingHealth: 200,
    });
  });
});
