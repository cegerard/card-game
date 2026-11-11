import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { RandomizerFake } from '../../../../../../../test/helpers/randomizer-fake';
import { FightingCard } from '../../../fighting-card';
import { Player } from '../../../../player';
import { Battlefield } from '../battlefield';

const TIDES = new Battlefield({
  name: 'Marée des Possibilités',
  duration: 3,
  allies: { decoys: { count: 1, chance: 0.4 } },
  enemies: { energySurcharge: 5 },
});

describe('Battlefield decoys and energy surcharge', () => {
  const randomizer = new RandomizerFake();
  let caster: FightingCard;
  let ally: FightingCard;
  let enemy: FightingCard;
  let context: { sourcePlayer: Player; opponentPlayer: Player };

  const aimAt = (target: FightingCard, roll: number) => {
    randomizer.setNextRandomValue(roll);
    return target.dodge(enemy) && target.dodgedEffects(context);
  };

  beforeEach(() => {
    randomizer.reset();
    caster = createFightingCard({ randomizer, agility: 0 });
    ally = createFightingCard({ randomizer, agility: 0 });
    enemy = createFightingCard({
      accuracy: 1000,
      skills: { special: { kind: 'specialAttack', energy: 40 } },
    });
    context = {
      sourcePlayer: new Player('p1', [caster, ally]),
      opponentPlayer: new Player('p2', [enemy]),
    };
    TIDES.deploy(caster, context);
  });

  it('lets a decoy take an attack aimed at an ally, under its chance', () => {
    expect(aimAt(ally, 0.39)).toEqual([
      {
        type: 'decoy_struck',
        card: ally,
        name: 'Marée des Possibilités',
        remainingDecoys: 0,
      },
    ]);
  });

  it('spends the decoys of the whole side', () => {
    aimAt(ally, 0.1);

    expect(aimAt(caster, 0.1)).toBe(false);
  });

  it('makes the enemy special cost more', () => {
    enemy.gainEnergy(40);

    expect(enemy.isSpecialReady()).toBe(false);
  });

  it('lets the enemy gauge fill up to the raised cost', () => {
    expect(enemy.gainEnergy(100)).toBe(45);
  });
});
