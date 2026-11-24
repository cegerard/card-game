import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { Player } from '../../../player';
import { SpecialHealing, SpecialHealingOptions } from '../special-healing';
import { HealingResult } from '../../@types/action-result/healing-result';
import { ShieldApplication } from '../../@types/shield/shield-application';
import { LowestHealthPointsAllyStrategy } from '../../../targeting-card-strategies/ranked-ally';
import { AllAllies } from '../../../targeting-card-strategies/all-allies';
import { NoTargets } from '../../../targeting-card-strategies/no-targets';

describe('SpecialHealing', () => {
  let caster: FightingCard;
  let wounded: FightingCard;
  let small: FightingCard;

  const cocoon = (options: SpecialHealingOptions = {}) =>
    new SpecialHealing(
      'Cocon',
      0.25,
      30,
      new LowestHealthPointsAllyStrategy(),
      options,
    );
  const launch = (special: SpecialHealing) =>
    special.launch(caster, {
      sourcePlayer: new Player('p1', [caster, wounded, small]),
      opponentPlayer: new Player('p2', [createFightingCard()]),
    });
  const healed = (special: SpecialHealing) =>
    (launch(special).actionResults as HealingResult[])[0]?.healed;
  const shieldOnNobody = () => new ShieldApplication(0.15, 2, new NoTargets());

  beforeEach(() => {
    caster = createFightingCard({ attack: 100 });
    wounded = createFightingCard({ health: 1000, resistance: 0 });
    small = createFightingCard({ health: 500 });
    wounded.addRealDamage(600);
  });

  it('heals a share of the caster attack by default', () => {
    expect(healed(cocoon())).toBe(25);
  });

  it('heals a share of the target max health with that basis', () => {
    expect(healed(cocoon({ basis: 'target-max-health' }))).toBe(250);
  });

  it('shields the healed targets in place of the shield targeting', () => {
    const special = cocoon({
      shield: shieldOnNobody(),
      shieldsHealedTargets: true,
    });

    expect(launch(special).shieldResults).toEqual([
      expect.objectContaining({ target: wounded.identityInfo }),
    ]);
  });

  it('shields by its own targeting otherwise', () => {
    const shield = new ShieldApplication(0.15, 2, new AllAllies());

    expect(launch(cocoon({ shield })).shieldResults).toHaveLength(2);
  });

  it('shields nobody with a shield targeting nobody', () => {
    const special = cocoon({ shield: shieldOnNobody() });

    expect(launch(special).shieldResults).toEqual([]);
  });

  it('still shields a healed target cut off its allies support', () => {
    wounded.blockSupport(2);
    const special = cocoon({
      shield: shieldOnNobody(),
      shieldsHealedTargets: true,
    });

    expect(launch(special).shieldResults[0].shield.points).toBe(150);
  });

  it('lays its heal over time on the healed targets', () => {
    launch(cocoon({ healOverTime: { rate: 0.08, duration: 3 } }));

    expect(wounded.tickHealsOverTime()).toEqual([
      { name: 'Cocon', source: caster, healed: 80 },
    ]);
  });
});
