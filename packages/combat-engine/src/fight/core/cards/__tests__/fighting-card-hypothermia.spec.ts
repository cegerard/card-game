import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../fighting-card';
import { HypothermiaAttackEffect } from '../@types/attack/attack-hypothermia-effect';
import { FreezeAttackEffect } from '../@types/attack/attack-freeze-effect';
import { MathRandomizer } from '../../../tools/math-randomizer';
import { Player } from '../../player';
import { FightingContext } from '../@types/fighting-context';

describe('Hypothermia and timed freeze', () => {
  let source: FightingCard;
  let target: FightingCard;
  let context: FightingContext;

  const hypothermia = () =>
    new HypothermiaAttackEffect(0.15, 3, new MathRandomizer());
  const freeze = (duration?: number) =>
    new FreezeAttackEffect(
      0.2,
      1,
      new MathRandomizer(),
      undefined,
      undefined,
      undefined,
      duration,
    );

  beforeEach(() => {
    source = createFightingCard();
    target = createFightingCard({ health: 1000 });
    context = {
      sourcePlayer: new Player('p1', [source]),
      opponentPlayer: new Player('p2', [target]),
    };
  });

  it('lands on a frozen card', () => {
    freeze().applyEffect(target, source, context);

    expect(hypothermia().applyEffect(target, source, context)).toMatchObject({
      type: 'hypothermia',
    });
  });

  it('bites a share of the target max health while it is frozen', () => {
    freeze().applyEffect(target, source, context);
    hypothermia().applyEffect(target, source, context);
    target.applyStateEffects();

    expect(target.actualHealth).toBe(850);
  });

  it('ticks for its duration only', () => {
    hypothermia().applyEffect(target, source, context);
    [1, 2, 3].forEach(() => target.applyStateEffects());

    expect(target.applyStateEffects()).toEqual([]);
  });

  it('is refused by a damage-over-time immunity', () => {
    target.activateStance({
      name: 'Garde',
      duration: 2,
      immunities: ['damage-over-time'],
    });

    expect(hypothermia().applyEffect(target, source, context)).toBeUndefined();
  });

  it('rejects a rate that is not positive', () => {
    expect(
      () => new HypothermiaAttackEffect(0, 3, new MathRandomizer()),
    ).toThrow('rate');
  });

  it('freezes for the given duration instead of the level one', () => {
    freeze(2).applyEffect(target, source, context);

    expect(target.applyStateEffects()[0].remainingTurns).toBe(1);
  });

  it('rejects a freeze duration below one turn', () => {
    expect(() => freeze(0)).toThrow('duration');
  });
});
