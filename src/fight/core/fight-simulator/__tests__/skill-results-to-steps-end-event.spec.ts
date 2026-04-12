import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Player } from '../../player';
import { TurnManager } from '../turn-manager';
import { DeathSkillHandler } from '../death-skill-handler';
import { EndEventProcessor } from '../end-event-processor';
import { StepKind } from '../@types/step';
import { AlterationSkill } from '../../cards/skills/alteration-skill';
import { TurnEnd } from '../../trigger/turn-end';
import { Launcher } from '../../targeting-card-strategies/launcher';

describe('skillResultsToSteps: endEvent on non-Buff skills', () => {
  describe('when a debuff skill exhausts and emits endEvent', () => {
    let buffedCard: ReturnType<typeof createFightingCard>;
    let debuffingCard: ReturnType<typeof createFightingCard>;
    let turnManager: TurnManager;

    beforeEach(() => {
      debuffingCard = createFightingCard({ id: 'debuffer', health: 5000 });
      buffedCard = createFightingCard({ id: 'ally', health: 5000 });

      const debuffSkill = new AlterationSkill({
        polarity: 'debuff',
        attributeType: 'attack',
        rate: 0.2,
        duration: 1,
        trigger: new TurnEnd(),
        targetingStrategy: new Launcher(),
        activationLimit: 1,
        endEvent: 'debuff-lifecycle-end',
      });
      (debuffingCard as any).skills = [debuffSkill];

      // Give buffedCard an event-bound buff that should be removed on 'debuff-lifecycle-end'
      buffedCard.applyBuff('attack', 0.5, Infinity, 'debuff-lifecycle-end');

      const player1 = new Player('p1', [debuffingCard, buffedCard]);
      const player2 = new Player('p2', [createFightingCard()]);
      const endEventProcessor = new EndEventProcessor(player1, player2);
      const deathSkillHandler = new DeathSkillHandler(
        player1,
        player2,
        endEventProcessor,
      );
      turnManager = new TurnManager(
        player1,
        player2,
        { onCardDeath: [deathSkillHandler] },
        deathSkillHandler,
        endEventProcessor,
      );
    });

    it('emits a BuffRemoved step when the debuff skill lifecycle ends', () => {
      const steps = turnManager.endTurn([debuffingCard]);

      expect(steps.some((s) => s.kind === StepKind.BuffRemoved)).toBe(true);
    });
  });
});
