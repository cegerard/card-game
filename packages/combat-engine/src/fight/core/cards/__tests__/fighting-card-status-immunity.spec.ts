import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { createEffect } from '../../../../../test/helpers/effect';
import { CardStatePoisoned } from '../@types/state/card-state-poisoned';
import { DamageType } from '../@types/damage/damage-type';
import { FightingCard } from '../fighting-card';

describe('FightingCard status immunity', () => {
  let card: FightingCard;

  beforeEach(() => {
    card = createFightingCard({ health: 1000 });
    card.applyStatusImmunity(2);
  });

  it('refuses a status state', () => {
    expect(card.setState(new CardStatePoisoned(1, 3, 10))).toBe(false);
  });

  it('stays free of the refused state', () => {
    card.setState(new CardStatePoisoned(1, 3, 10));

    expect(card.poisonLevel).toBe(0);
  });

  it('accepts states again once the immunity runs out', () => {
    card.decreaseStatusImmunityDuration();
    card.decreaseStatusImmunityDuration();
    card.decreaseStatusImmunityDuration();

    expect(card.setState(new CardStatePoisoned(1, 3, 10))).toBe(true);
  });
});

describe('Attack effects against an immune card', () => {
  let attacker: FightingCard;
  let defender: FightingCard;

  beforeEach(() => {
    attacker = createFightingCard({ attack: 100 });
    defender = createFightingCard({ health: 1000 });
    defender.applyStatusImmunity(2);
  });

  it.each(['poison', 'burn', 'freeze', 'stunt'])(
    'reports no %s effect',
    (type) => {
      const effect = createEffect({ type, rate: 0.2, level: 1 });

      expect(effect.applyEffect(defender, attacker, null)).toBeUndefined();
    },
  );

  it('still accepts an elemental mark', () => {
    const mark = createEffect({
      type: 'mark',
      rate: 0.05,
      damageType: DamageType.WATER,
      maxStacks: 5,
    });

    expect(mark.applyEffect(defender, attacker, null)).toBeDefined();
  });
});
