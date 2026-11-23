import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { Player } from '../../../player';
import { SpecialHealing } from '../special-healing';
import { HealingResult } from '../../@types/action-result/healing-result';
import { ShieldApplication } from '../../@types/shield/shield-application';
import { LowestHealthPointsAllyStrategy } from '../../../targeting-card-strategies/ranked-ally';
import { AllAllies } from '../../../targeting-card-strategies/all-allies';
import { SpecialTargets } from '../../../targeting-card-strategies/special-targets';

describe('SpecialHealing', () => {
  let caster: FightingCard;
  let wounded: FightingCard;
  let small: FightingCard;

  const cocoon = (shield?: ShieldApplication, basis?: 'target-max-health') =>
    new SpecialHealing(
      'Cocon',
      0.25,
      30,
      new LowestHealthPointsAllyStrategy(),
      basis,
      shield,
    );
  const launch = (special: SpecialHealing) =>
    special.launch(caster, {
      sourcePlayer: new Player('p1', [caster, wounded, small]),
      opponentPlayer: new Player('p2', [createFightingCard()]),
    });
  const healed = (special: SpecialHealing) =>
    (launch(special).actionResults as HealingResult[])[0]?.healed;

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
    expect(healed(cocoon(undefined, 'target-max-health'))).toBe(250);
  });

  it('shields the healed target when its shield names the special targets', () => {
    const special = cocoon(
      new ShieldApplication(0.15, 2, new SpecialTargets()),
      'target-max-health',
    );

    expect(launch(special).shieldResults).toEqual([
      expect.objectContaining({ target: wounded.identityInfo }),
    ]);
  });

  it('shields by its own targeting when it has one', () => {
    const special = cocoon(new ShieldApplication(0.15, 2, new AllAllies()));

    expect(launch(special).shieldResults).toHaveLength(2);
  });

  it('still shields a target cut off its allies support', () => {
    wounded.blockSupport(2);
    const special = cocoon(
      new ShieldApplication(0.15, 2, new SpecialTargets()),
    );

    expect(launch(special).shieldResults[0].shield.points).toBe(150);
  });
});
