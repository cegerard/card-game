import { SupportBlockAttackEffect } from '../attack-support-block-effect';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { RandomizerFake } from '../../../../../../../test/helpers/randomizer-fake';
import { FightingCard } from '../../../fighting-card';
import { Player } from '../../../../player';
import { applyHealing } from '../../../skills/heal-basis';

describe('SupportBlockAttackEffect', () => {
  let attacker: FightingCard;
  let defender: FightingCard;
  let ally: FightingCard;

  const block = () =>
    new SupportBlockAttackEffect(1, new RandomizerFake()).applyEffect(
      defender,
      attacker,
      {
        sourcePlayer: new Player('p1', [attacker]),
        opponentPlayer: new Player('p2', [defender, ally]),
      },
    );

  beforeEach(() => {
    attacker = createFightingCard({});
    defender = createFightingCard({ health: 1000, resistance: 0 });
    ally = createFightingCard({ attack: 100 });
    defender.addRealDamage(500);
  });

  it('reports the block and its duration', () => {
    expect(block()).toEqual({
      type: 'support_blocked',
      card: defender,
      remainingTurns: 1,
    });
  });

  it('turns away the heal of an ally', () => {
    block();

    expect(applyHealing(ally, defender, 1)).toBe(0);
  });

  it('lets the card heal itself', () => {
    block();

    expect(defender.refusesSupportFrom(defender)).toBe(false);
  });

  it('ends after its duration in turn ends, reported once', () => {
    block();
    defender.decreaseSupportBlockDuration();

    expect(defender.decreaseSupportBlockDuration()).toEqual([
      { type: 'support_block_ended', card: defender },
    ]);
  });

  it('lets the heals through once it ended', () => {
    block();
    defender.decreaseSupportBlockDuration();
    defender.decreaseSupportBlockDuration();

    expect(applyHealing(ally, defender, 1)).toBe(100);
  });
});
