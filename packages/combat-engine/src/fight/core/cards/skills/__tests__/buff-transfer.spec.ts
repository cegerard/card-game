import { BuffTransferSkill } from '../buff-transfer';
import { SkillKind } from '../skill';
import { SelfDeathTrigger } from '../../../trigger/self-death';
import { FastestAllyStrategy } from '../../../targeting-card-strategies/fastest-ally';
import { TargetingCardStrategy } from '../../../targeting-card-strategies/targeting-card-strategy';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';

const NOBODY: TargetingCardStrategy = { id: 'nobody', targetedCards: () => [] };
const HUNT = { id: 'instinct', maxStacks: 3 };

describe('BuffTransferSkill', () => {
  let owner: FightingCard;
  let heir: FightingCard;

  const transfer = (
    targeting: TargetingCardStrategy = new FastestAllyStrategy(),
  ) =>
    new BuffTransferSkill(
      'Héritage de la Panthère',
      'speed',
      new SelfDeathTrigger('selkhet'),
      targeting,
    ).launch(owner, {
      sourcePlayer: new Player('p1', [owner, heir]),
      opponentPlayer: new Player('p2', [createFightingCard()]),
    });

  beforeEach(() => {
    owner = createFightingCard({ id: 'selkhet', speed: 200 });
    heir = createFightingCard({ id: 'heir', speed: 100 });
    owner.applyBuff('speed', 0.15, Infinity, undefined, undefined, HUNT);
    owner.applyBuff('speed', 0.15, Infinity, undefined, undefined, HUNT);
    owner.applyBuff('attack', 0.2, 2);
  });

  it('gives the heir the value of the speed buffs', () => {
    transfer();

    expect(heir.actualSpeed).toBe(160);
  });

  it('takes the speed buffs away from its owner', () => {
    transfer();

    expect(owner.actualSpeed).toBe(200);
  });

  it('leaves the other buffs on its owner', () => {
    const attack = owner.actualAttack;
    transfer();

    expect(owner.actualAttack).toBe(attack);
  });

  it('keeps the stack pile of the transferred buffs', () => {
    transfer();

    expect(heir.buffStacks('instinct')).toBe(2);
  });

  it('reports the transferred buffs', () => {
    expect(transfer()).toEqual({
      skillKind: SkillKind.BuffTransfer,
      name: 'Héritage de la Panthère',
      results: [
        {
          target: heir,
          buffs: [
            expect.objectContaining({
              type: 'speed',
              value: 30,
              duration: Infinity,
            }),
            expect.objectContaining({
              type: 'speed',
              value: 30,
              duration: Infinity,
            }),
          ],
        },
      ],
    });
  });

  it('keeps the buffs when nobody is targeted', () => {
    transfer(NOBODY);

    expect(owner.actualSpeed).toBe(260);
  });

  it('reports nothing without a buff of that type', () => {
    owner = createFightingCard({ id: 'selkhet', speed: 200 });

    expect(transfer().results).toEqual([]);
  });
});
