import { SimpleAttack } from '../simple-attack';
import { BleedDetonation } from '../../@types/attack/bleed-detonation';
import { CardStateBleeding } from '../../@types/state/card-state-bleeding';
import { TargetedFromPosition } from '../../../targeting-card-strategies/targeted-from-position';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { AttackResult } from '../../@types/action-result/attack-result';

describe('SimpleAttack with a bleed detonation', () => {
  let attacker: FightingCard;
  let defender: FightingCard;
  let result: AttackResult;

  beforeEach(() => {
    attacker = createFightingCard({
      attack: 100,
      criticalChance: 0,
      accuracy: 50,
    });
    defender = createFightingCard({ defense: 40, agility: 0, health: 5000 });
    defender.setState(
      new CardStateBleeding(
        Array.from({ length: 6 }, () => ({
          remainingTurns: 3,
          damageValue: 5,
        })),
      ),
    );
    const detonation = new SimpleAttack(
      'Exsanguination Totale',
      [],
      new TargetedFromPosition(),
      undefined,
      undefined,
      0.5,
      new BleedDetonation(0.4),
    );

    [result] = detonation.launch(attacker, {
      sourcePlayer: new Player('p1', [attacker]),
      opponentPlayer: new Player('p2', [defender]),
    }).results;
  });

  it('consumes every stack of the target', () => {
    expect(defender.bleedStacks()).toBe(0);
  });

  it('reports the consumed stacks', () => {
    expect(result.consumedBleedStacks).toBe(6);
  });

  it('deals the rate per stack, half the defense ignored', () => {
    expect(result.damage).toBe(220);
  });

  it('reports a physical hit', () => {
    expect(result.kind).toEqual(['PHYSICAL']);
  });
});

describe('BleedDetonation', () => {
  it('rejects a rate per stack that is not positive', () => {
    expect(() => new BleedDetonation(0)).toThrow();
  });
});
