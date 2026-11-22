import {
  FastestAllyStrategy,
  LowestHealthPointsAllyStrategy,
  StrongestAllyStrategy,
} from '../ranked-ally';
import { TargetingCardStrategy } from '../targeting-card-strategy';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';

const opponents = () =>
  new Player('opponents', [
    createFightingCard({ speed: 9999, attack: 9999, health: 1 }),
  ]);

describe('FastestAllyStrategy', () => {
  let caster: FightingCard;
  let slow: FightingCard;
  let fast: FightingCard;
  let team: Player;

  const target = () =>
    new FastestAllyStrategy().targetedCards(caster, team, opponents());

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

describe('StrongestAllyStrategy', () => {
  let caster: FightingCard;
  let weak: FightingCard;
  let strong: FightingCard;
  let team: Player;

  const target = () =>
    new StrongestAllyStrategy().targetedCards(caster, team, opponents());

  beforeEach(() => {
    caster = createFightingCard({ id: 'caster', attack: 9000 });
    weak = createFightingCard({ id: 'weak', attack: 100 });
    strong = createFightingCard({ id: 'strong', attack: 200 });
    team = new Player('team', [caster, weak, strong]);
  });

  it('targets the ally with the highest attack, the caster excluded', () => {
    expect(target()).toEqual([strong]);
  });

  it('reads the attack at launch, buffs included', () => {
    weak.applyBuff('attack', 2, 3);

    expect(target()).toEqual([weak]);
  });

  it('keeps deck order on a tie', () => {
    weak.applyBuff('attack', 1, 3);

    expect(target()).toEqual([weak]);
  });

  it('skips the dead allies', () => {
    strong.addRealDamage(strong.actualHealth);

    expect(target()).toEqual([weak]);
  });
});

describe('LowestHealthPointsAllyStrategy', () => {
  let caster: FightingCard;
  let small: FightingCard;
  let wounded: FightingCard;
  let team: Player;
  const strategy: TargetingCardStrategy = new LowestHealthPointsAllyStrategy();

  const target = () => strategy.targetedCards(caster, team, opponents());

  beforeEach(() => {
    caster = createFightingCard({ id: 'caster', health: 10 });
    small = createFightingCard({ id: 'small', health: 500 });
    wounded = createFightingCard({ id: 'wounded', health: 2000 });
    team = new Player('team', [caster, small, wounded]);
  });

  it('targets the ally with the fewest health points, the caster excluded', () => {
    wounded.addRealDamage(1000);

    expect(target()).toEqual([small]);
  });

  it('compares health points, not health ratios', () => {
    wounded.addRealDamage(1600);

    expect(target()).toEqual([wounded]);
  });

  it('keeps deck order on a tie', () => {
    wounded.addRealDamage(1500);

    expect(target()).toEqual([small]);
  });

  it('skips the dead allies', () => {
    small.addRealDamage(small.actualHealth);

    expect(target()).toEqual([wounded]);
  });
});
