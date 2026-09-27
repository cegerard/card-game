import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';
import { TurnManager } from '../turn-manager';
import { DeathSkillHandler } from '../death-skill-handler';
import { EndEventProcessor } from '../end-event-processor';
import { Step, StepKind } from '../@types/step';

describe('TurnManager protection duration', () => {
  let guardian: FightingCard;
  let ally: FightingCard;
  let manager: TurnManager;

  function endTurn(): Step[] {
    return manager.endTurn([guardian]);
  }

  beforeEach(() => {
    guardian = createFightingCard({ id: 'guardian', accuracy: 0, agility: 0 });
    ally = createFightingCard({ id: 'ally' });
    const player1 = new Player('p1', [guardian, ally]);
    const player2 = new Player('p2', [createFightingCard()]);
    const endEventProcessor = new EndEventProcessor(player1, player2);
    const deathSkillHandler = new DeathSkillHandler(
      player1,
      player2,
      endEventProcessor,
    );
    manager = new TurnManager(
      player1,
      player2,
      { onCardDeath: [deathSkillHandler] },
      deathSkillHandler,
      endEventProcessor,
    );
    guardian.protect(ally, 1);
  });

  describe('while the protection still runs', () => {
    it('emits no protection_ended step', () => {
      expect(endTurn().some((s) => s.kind === StepKind.ProtectionEnded)).toBe(
        false,
      );
    });

    it('keeps the guardian in front', () => {
      endTurn();

      expect(guardian.isProtecting(ally)).toBe(true);
    });
  });

  describe('when the protection runs out', () => {
    let steps: Step[];

    beforeEach(() => {
      endTurn();
      steps = endTurn();
    });

    it('emits a protection_ended step', () => {
      expect(steps.find((s) => s.kind === StepKind.ProtectionEnded)).toEqual({
        kind: StepKind.ProtectionEnded,
        card: guardian.identityInfo,
        protectedCard: ally.identityInfo,
      });
    });

    it('stops protecting the ally', () => {
      expect(guardian.isProtecting(ally)).toBe(false);
    });
  });
});
