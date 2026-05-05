import { BuffApplication } from '../alteration';
import { ConditionedAlteration } from '../conditioned-alteration';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { Player } from '../../../../player';
import { Launcher } from '../../../../targeting-card-strategies/launcher';
import { FightingCard } from '../../../fighting-card';
import { FightingContext } from '../../fighting-context';

function makeContext(
  source: FightingCard,
  ally?: FightingCard,
): FightingContext {
  const cards = ally ? [source, ally] : [source];
  const sourcePlayer = new Player('P1', cards);
  const opponentPlayer = new Player('P2', [createFightingCard({})]);
  return { sourcePlayer, opponentPlayer };
}

describe('BuffApplication with condition', () => {
  const trueCondition: ConditionedAlteration = {
    id: 'always-true',
    evaluate: () => true,
  };

  const falseCondition: ConditionedAlteration = {
    id: 'always-false',
    evaluate: () => false,
  };

  describe('when no condition is provided', () => {
    let result: ReturnType<BuffApplication['applyBuff']>[0];

    beforeEach(() => {
      const source = createFightingCard({ attack: 100 });
      const buff = new BuffApplication('attack', 0.2, 1, new Launcher());
      const context = makeContext(source);
      [result] = buff.applyBuff(source, context);
    });

    it('applies base rate', () => {
      expect(result.buff.value).toBe(20);
    });
  });

  describe('when condition evaluates to true', () => {
    let result: ReturnType<BuffApplication['applyBuff']>[0];

    beforeEach(() => {
      const source = createFightingCard({ attack: 100 });
      const buff = new BuffApplication(
        'attack',
        0.2,
        1,
        new Launcher(),
        trueCondition,
        2,
      );
      const context = makeContext(source);
      [result] = buff.applyBuff(source, context);
    });

    it('applies multiplied rate', () => {
      expect(result.buff.value).toBe(40);
    });
  });

  describe('when condition evaluates to false', () => {
    let result: ReturnType<BuffApplication['applyBuff']>[0];

    beforeEach(() => {
      const source = createFightingCard({ attack: 100 });
      const buff = new BuffApplication(
        'attack',
        0.2,
        1,
        new Launcher(),
        falseCondition,
        2,
      );
      const context = makeContext(source);
      [result] = buff.applyBuff(source, context);
    });

    it('applies base rate', () => {
      expect(result.buff.value).toBe(20);
    });
  });
});
