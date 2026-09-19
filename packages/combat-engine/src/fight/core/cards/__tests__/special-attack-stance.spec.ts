import { SpecialAttack } from '../skills/special-attack';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Player } from '../../player';
import { DamageComposition } from '../@types/damage/damage-composition';
import { DamageType } from '../@types/damage/damage-type';
import { TargetedAll } from '../../targeting-card-strategies/targeted-all';
import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';

const STANCE = 'forteresse-des-ages';
const damages = [new DamageComposition(DamageType.EARTH, 0)];

describe('SpecialAttack stance activation', () => {
  let caster: FightingCard;
  let context: FightingContext;

  beforeEach(() => {
    caster = createFightingCard({ criticalChance: 0, accuracy: 9999 });
    context = {
      sourcePlayer: new Player('p1', [caster]),
      opponentPlayer: new Player('p2', [createFightingCard({ agility: 0 })]),
    };
  });

  describe('with a stance activation', () => {
    const special = () =>
      new SpecialAttack(
        'Forteresse des Âges',
        damages,
        0,
        new TargetedAll(),
        undefined,
        undefined,
        undefined,
        undefined,
        { name: STANCE, duration: 3 },
      );

    it('opens the stance on its caster', () => {
      special().launch(caster, context);

      expect(caster.hasStance(STANCE)).toBe(true);
    });

    it('reports the stance it opened', () => {
      const result = special().launch(caster, context);

      expect(result.stanceStarted.name).toBe(STANCE);
    });

    it('reports its duration', () => {
      const result = special().launch(caster, context);

      expect(result.stanceStarted.remainingTurns).toBe(3);
    });
  });

  describe('without a stance activation', () => {
    it('reports no stance', () => {
      const special = new SpecialAttack('Plain', damages, 0, new TargetedAll());

      expect(special.launch(caster, context).stanceStarted).toBeUndefined();
    });
  });
});
