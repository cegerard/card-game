import { HitAlterations } from '../hit-alterations';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../../fighting-card';
import { AttackResult } from '../../action-result/attack-result';
import { RandomizerFake } from '../../../../../../../test/helpers/randomizer-fake';

const hit = (defender: FightingCard, dodge = false): AttackResult => ({
  damage: dodge ? 0 : 10,
  isCritical: false,
  dodge,
  defender,
  remainingHealth: defender.actualHealth,
});

const fracture = () =>
  new HitAlterations([
    { polarity: 'debuff', type: 'defense', rate: 0.3, duration: 2 },
  ]);

describe('HitAlterations', () => {
  let first: FightingCard;
  let second: FightingCard;

  beforeEach(() => {
    first = createFightingCard({ defense: 100 });
    second = createFightingCard({ defense: 100 });
  });

  it('alters every defender hit', () => {
    const { debuffs } = fracture().apply([hit(first), hit(second)]);

    expect(debuffs.map((d) => d.target.id)).toEqual([first.id, second.id]);
  });

  it('spares a defender that dodged', () => {
    const { debuffs } = fracture().apply([hit(first, true), hit(second)]);

    expect(debuffs.map((d) => d.target.id)).toEqual([second.id]);
  });

  it('alters a defender once, however many hits landed on it', () => {
    fracture().apply([hit(first), hit(first), hit(first)]);

    expect(first.actualDefense).toBe(70);
  });

  it('spares a defender the hit killed', () => {
    first.applyFinalDamage(first.actualHealth);

    expect(fracture().apply([hit(first)]).debuffs).toEqual([]);
  });

  it('applies a buff through the buff path', () => {
    const { buffs } = new HitAlterations([
      { polarity: 'buff', type: 'attack', rate: 0.1, duration: 2 },
    ]).apply([hit(first)]);

    expect(buffs[0].alteration.polarity).toBe('buff');
  });

  it('lets the defender resistance refuse a debuff', () => {
    const resistant = createFightingCard({
      resistance: 200,
      randomizer: new RandomizerFake().setNextRandomValue(0),
    });

    expect(fracture().apply([hit(resistant)]).debuffs).toEqual([]);
  });
});
