import { FastestAllyStrategy } from '../fastest-ally';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';

describe('FastestAllyStrategy', () => {
  let caster: FightingCard;
  let slow: FightingCard;
  let fast: FightingCard;
  let team: Player;

  const target = () =>
    new FastestAllyStrategy().targetedCards(
      caster,
      team,
      new Player('opponents', [createFightingCard({ speed: 9999 })]),
    );

  beforeEach(() => {
    caster = createFightingCard({ id: 'caster', speed: 9000 });
    slow = createFightingCard({ id: 'slow', speed: 100 });
    fast = createFightingCard({ id: 'fast', speed: 200 });
    team = new Player('team', [caster, slow, fast]);
  });

  it('targets the fastest ally, the caster excluded', () => {
    expect(target()).toEqual([fast]);
  });

  it('counts the speed buffs of the allies', () => {
    slow.applyBuff('speed', 2, 3);

    expect(target()).toEqual([slow]);
  });

  it('keeps deck order on a tie', () => {
    slow.applyBuff('speed', 1, 3);

    expect(target()).toEqual([slow]);
  });

  it('skips the dead allies', () => {
    fast.addRealDamage(fast.actualHealth);

    expect(target()).toEqual([slow]);
  });

  it('still resolves when the caster is dead', () => {
    caster.addRealDamage(caster.actualHealth);

    expect(target()).toEqual([fast]);
  });

  it('targets nobody without a living ally', () => {
    team = new Player('team', [caster]);

    expect(target()).toEqual([]);
  });
});
