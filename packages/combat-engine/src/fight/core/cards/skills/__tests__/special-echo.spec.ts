import { SpecialEchoSkill } from '../special-echo';
import { SelfDeathTrigger } from '../../../trigger/self-death';
import { Player } from '../../../player';
import { FightingCard } from '../../fighting-card';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';

describe('SpecialEchoSkill', () => {
  let owner: FightingCard;
  let enemy: FightingCard;

  const echo = () =>
    new SpecialEchoSkill(
      'Héritage de la Tisseuse',
      new SelfDeathTrigger('umiko'),
    ).launch(owner, {
      sourcePlayer: new Player('p1', [owner]),
      opponentPlayer: new Player('p2', [enemy]),
    });

  beforeEach(() => {
    owner = createFightingCard({
      id: 'umiko',
      accuracy: 10000,
      skills: {
        special: { kind: 'specialAttack', name: 'Prison', energy: 40 },
      },
    });
    enemy = createFightingCard({ agility: 0, health: 100000 });
  });

  it('casts the owner special, reported under its name', () => {
    expect(echo().name).toBe('Prison');
  });

  it('strikes the special targets', () => {
    expect(echo().results.map((r) => r.defender)).toEqual([enemy]);
  });

  it('leaves the gauge untouched', () => {
    owner.gainEnergy(20);
    echo();

    expect(owner.actualEnergy).toBe(20);
  });

  it('refuses to echo a special that does not attack', () => {
    owner = createFightingCard({
      skills: { special: { kind: 'specialHealing', energy: 40 } },
    });

    expect(echo).toThrow('Only an attack special can be echoed');
  });
});
