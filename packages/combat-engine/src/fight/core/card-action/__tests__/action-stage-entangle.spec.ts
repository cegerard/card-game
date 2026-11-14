import { ActionStage } from '../action-stage';
import { Player } from '../../player';
import { FightingCard } from '../../cards/fighting-card';
import { DeathSkillHandler } from '../../fight-simulator/death-skill-handler';
import { Step, StepKind } from '../../fight-simulator/@types/step';
import { CardStateEntangled } from '../../cards/@types/state/card-state-entangled';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { RandomizerFake } from '../../../../../test/helpers/randomizer-fake';

describe('ActionStage with an entangled card', () => {
  const randomizer = new RandomizerFake();
  let attacker: FightingCard;
  let defender: FightingCard;
  let stage: ActionStage;

  const act = (roll: number): Step[] => {
    attacker.setState(new CardStateEntangled(0.7));
    randomizer.setNextRandomValue(roll);
    return stage.computeNextAction([attacker]);
  };

  beforeEach(() => {
    randomizer.reset();
    attacker = createFightingCard({
      resistance: 0,
      randomizer,
      skills: { special: { kind: 'specialAttack', energy: 9999 } },
    });
    defender = createFightingCard({ health: 100000 });
    const player1 = new Player('p1', [attacker]);
    const player2 = new Player('p2', [defender]);
    stage = new ActionStage(
      player1,
      player2,
      { onCardDeath: [] },
      new DeathSkillHandler(player1, player2),
    );
  });

  it('reports the failed action instead of the attack', () => {
    expect(act(0.5)).toEqual([
      {
        kind: StepKind.ActionFailed,
        card: attacker.identityInfo,
        cause: 'entangle',
      },
    ]);
  });

  it('charges no energy on a failed action', () => {
    act(0.5);

    expect(attacker.actualEnergy).toBe(0);
  });

  it('attacks when the roll spares it', () => {
    expect(act(0.9)[0].kind).toBe(StepKind.Attack);
  });

  it('attacks normally on the following turn', () => {
    act(0.5);

    expect(stage.computeNextAction([attacker])[0].kind).toBe(StepKind.Attack);
  });
});
