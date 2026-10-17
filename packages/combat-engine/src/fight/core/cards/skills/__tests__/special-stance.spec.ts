import { SpecialStance } from '../special-stance';
import { Alteration } from '../../@types/alteration/alteration';
import { Launcher } from '../../../targeting-card-strategies/launcher';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { SpecialResult } from '../../@types/action-result/special-result';

const FUSION = { name: 'Fusion Tectonique', duration: 2 };

describe('SpecialStance', () => {
  let caster: FightingCard;
  let enemy: FightingCard;

  const context = () => ({
    sourcePlayer: new Player('p1', [caster]),
    opponentPlayer: new Player('p2', [enemy]),
  });

  beforeEach(() => {
    caster = createFightingCard({ accuracy: 100 });
    enemy = createFightingCard({ health: 1000 });
  });

  it('is ready once its energy is reached', () => {
    expect(new SpecialStance('Fusion', 80, FUSION).ready(80)).toBe(true);
  });

  it('gains energy up to its cost', () => {
    expect(new SpecialStance('Fusion', 80, FUSION).increaseEnergy(75)).toBe(80);
  });

  it('is a stance special', () => {
    expect(new SpecialStance('Fusion', 80, FUSION).getSpecialKind()).toBe(
      'specialStance',
    );
  });

  describe('once launched', () => {
    let result: SpecialResult;

    beforeEach(() => {
      result = new SpecialStance(
        'Fusion Tectonique',
        80,
        FUSION,
        [new Alteration('accuracy', 0.3, 2, new Launcher())],
        undefined,
        2,
      ).launch(caster, context());
    });

    it('strikes nobody', () => {
      expect(result.actionResults).toEqual([]);
    });

    it('opens its stance on the caster', () => {
      expect(caster.hasStance('Fusion Tectonique')).toBe(true);
    });

    it('applies its alterations', () => {
      expect(caster.actualAccuracy).toBe(130);
    });

    it('conceals the caster', () => {
      expect(caster.isConcealed()).toBe(true);
    });

    it('reports the concealment with its duration', () => {
      expect(result.concealmentStarted).toEqual({
        name: 'Fusion Tectonique',
        remainingTurns: 2,
      });
    });
  });

  it('leaves the caster visible without a concealment', () => {
    new SpecialStance('Fusion', 80, FUSION).launch(caster, context());

    expect(caster.isConcealed()).toBe(false);
  });

  it('requires a stance', () => {
    expect(() => new SpecialStance('Fusion', 80, undefined)).toThrow(
      'SpecialStance requires a stanceActivation',
    );
  });

  it('rejects a negative concealment duration', () => {
    expect(
      () => new SpecialStance('Fusion', 80, FUSION, [], undefined, -1),
    ).toThrow('Concealment duration must be a non-negative integer');
  });
});
