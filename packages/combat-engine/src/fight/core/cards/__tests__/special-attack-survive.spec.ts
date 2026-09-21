import { MathRandomizer } from '../../../tools/math-randomizer';
import { SpecialAttack } from '../skills/special-attack';
import { SurviveSkill } from '../skills/survive';
import { SimpleAttack } from '../skills/simple-attack';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Player } from '../../player';
import { DamageComposition } from '../@types/damage/damage-composition';
import { DamageType } from '../@types/damage/damage-type';
import { Element } from '../@types/damage/element';
import { TargetedAll } from '../../targeting-card-strategies/targeted-all';
import { TargetedFromPosition } from '../../targeting-card-strategies/targeted-from-position';
import { SimpleDodge } from '../behaviors/simple-dodge';
import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { AttackResult } from '../@types/action-result/attack-result';

const damages = [new DamageComposition(DamageType.PHYSICAL, 1.0)];

function createDefenderWithSurvive(): FightingCard {
  const targeting = new TargetedFromPosition();
  return new FightingCard(
    'defender-01',
    'Defender',
    {
      attack: 10,
      defense: 0,
      health: 50,
      speed: 100,
      agility: 0,
      accuracy: 100,
      criticalChance: 0,
    },
    {
      simpleAttack: new SimpleAttack('Strike', damages, targeting),
      special: new SpecialAttack('Special', damages, 999, targeting),
      others: [],
      survive: new SurviveSkill('Last Stand'),
    },
    { dodge: new SimpleDodge() },
    new MathRandomizer(),
    Element.PHYSICAL,
  );
}

describe('SpecialAttack survive propagation', () => {
  let attacker: FightingCard;
  let defender: FightingCard;
  let context: FightingContext;
  let special: SpecialAttack;

  beforeEach(() => {
    attacker = createFightingCard({
      attack: 1000,
      defense: 0,
      criticalChance: 0,
      accuracy: 9999,
    });
    defender = createDefenderWithSurvive();
    context = {
      sourcePlayer: new Player('p1', [attacker]),
      opponentPlayer: new Player('p2', [defender]),
    };
    special = new SpecialAttack('Finisher', damages, 0, new TargetedAll());
  });

  it('reports the intercepted fatal blow', () => {
    const [result] = special.launch(attacker, context)
      .actionResults as AttackResult[];

    expect(result.survived).toBe(true);
  });

  it('reports the name of the skill that intercepted it', () => {
    const [result] = special.launch(attacker, context)
      .actionResults as AttackResult[];

    expect(result.survivedSkillName).toBe('Last Stand');
  });

  it('leaves the defender at one health point', () => {
    special.launch(attacker, context);

    expect(defender.actualHealth).toBe(1);
  });

  it('reports nothing when the blow is not fatal', () => {
    const weakAttacker = createFightingCard({
      attack: 10,
      defense: 0,
      criticalChance: 0,
      accuracy: 9999,
    });
    const weakContext = {
      ...context,
      sourcePlayer: new Player('p1', [weakAttacker]),
    };

    const [result] = special.launch(weakAttacker, weakContext)
      .actionResults as AttackResult[];

    expect(result.survived).toBeUndefined();
  });
});
