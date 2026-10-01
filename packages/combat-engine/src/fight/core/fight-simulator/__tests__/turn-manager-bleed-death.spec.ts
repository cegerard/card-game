import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { CardState } from '../../cards/@types/state/card-state';
import { CardStateBleeding } from '../../cards/@types/state/card-state-bleeding';
import { CardStatePoisoned } from '../../cards/@types/state/card-state-poisoned';
import { Player } from '../../player';
import { TurnManager } from '../turn-manager';
import { DeathSkillHandler } from '../death-skill-handler';
import { EndEventProcessor } from '../end-event-processor';
import { Step, StepKind } from '../@types/step';

const bleeding = (damageValue: number) =>
  new CardStateBleeding([{ remainingTurns: 3, damageValue }]);
const poisoned = (damageValue: number) =>
  new CardStatePoisoned(1, 1, damageValue);

describe('TurnManager death by a status tick', () => {
  let predator: FightingCard;
  let victim: FightingCard;

  const endTurnWith = (...states: CardState[]): Step[] => {
    states.forEach((state) => victim.setState(state));
    const player1 = new Player('p1', [predator]);
    const player2 = new Player('p2', [victim]);
    const endEventProcessor = new EndEventProcessor(player1, player2);
    const handler = new DeathSkillHandler(player1, player2, endEventProcessor);
    return new TurnManager(
      player1,
      player2,
      { onCardDeath: [handler] },
      handler,
      endEventProcessor,
    ).endTurn([victim]);
  };
  const predatorHealed = (steps: Step[]) =>
    steps.some(
      (s) => s.kind === StepKind.Healing && (s as any).source.id === 'predator',
    );

  beforeEach(() => {
    predator = createFightingCard({
      id: 'predator',
      health: 1000,
      skills: {
        others: [
          {
            effectRate: 0.1,
            trigger: 'enemy-bleed-death',
            targetingStrategy: 'self',
          },
        ],
      },
    });
    predator.addRealDamage(500);
    victim = createFightingCard({ id: 'victim', health: 80 });
  });

  it('fires the enemy bleed death skills when the bleed kills', () => {
    expect(predatorHealed(endTurnWith(bleeding(100)))).toBe(true);
  });

  it('does not fire them when the poison kills', () => {
    expect(predatorHealed(endTurnWith(poisoned(100)))).toBe(false);
  });

  it('fires them when the bleed bit in a combined lethal tick', () => {
    expect(predatorHealed(endTurnWith(poisoned(50), bleeding(50)))).toBe(true);
  });

  it('does not fire them when the bleeding card survives', () => {
    expect(predatorHealed(endTurnWith(bleeding(10)))).toBe(false);
  });
});
