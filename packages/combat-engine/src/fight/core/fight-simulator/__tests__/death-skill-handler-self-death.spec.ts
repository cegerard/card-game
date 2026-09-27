import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';
import { DeathSkillHandler } from '../death-skill-handler';
import { EndEventProcessor } from '../end-event-processor';
import { Step, StepKind } from '../@types/step';

describe('DeathSkillHandler self-death phase', () => {
  let guardian: FightingCard;
  let ally: FightingCard;
  let handler: DeathSkillHandler;

  function healingSources(steps: Step[]): string[] {
    return steps
      .filter((s) => s.kind === StepKind.Healing)
      .map((s: any) => s.source.id);
  }

  function notifyGuardianDeath(): Step[] {
    handler.notifyDeath(guardian);
    return handler.drainSteps();
  }

  beforeEach(() => {
    // The guardian leaves a parting gift to the ally it was covering.
    guardian = createFightingCard({
      id: 'guardian',
      health: 1000,
      skills: {
        others: [
          {
            effectRate: 0.4,
            trigger: 'self-death',
            targetCardId: 'guardian',
            targetingStrategy: 'self',
          },
        ],
      },
    });
    ally = createFightingCard({ id: 'ally', health: 1000 });
    ally.addRealDamage(500);
    const player1 = new Player('p1', [guardian, ally]);
    const player2 = new Player('p2', [createFightingCard()]);
    handler = new DeathSkillHandler(
      player1,
      player2,
      new EndEventProcessor(player1, player2),
    );
    guardian.addRealDamage(1000);
  });

  describe('when the card carrying it dies', () => {
    it('fires its own skill', () => {
      expect(healingSources(notifyGuardianDeath())).toContain('guardian');
    });
  });

  describe('when another card dies', () => {
    it('does not fire it', () => {
      handler.notifyDeath(ally);

      expect(healingSources(handler.drainSteps())).toEqual([]);
    });
  });
});

describe('DeathSkillHandler death phase ordering', () => {
  it('lets the fallen card speak before the survivors answer', () => {
    const dying = createFightingCard({
      id: 'dying',
      skills: {
        others: [
          {
            effectRate: 0.1,
            trigger: 'self-death',
            targetCardId: 'dying',
            targetingStrategy: 'self',
          },
        ],
      },
    });
    const survivor = createFightingCard({
      id: 'survivor',
      health: 1000,
      skills: {
        others: [
          {
            effectRate: 0.1,
            trigger: 'ally-death',
            targetCardId: 'dying',
            targetingStrategy: 'self',
          },
        ],
      },
    });
    survivor.addRealDamage(500);
    const player1 = new Player('p1', [dying, survivor]);
    const player2 = new Player('p2', [createFightingCard()]);
    const handler = new DeathSkillHandler(player1, player2);
    dying.addRealDamage(100000);

    handler.notifyDeath(dying);
    const sources = handler
      .drainSteps()
      .filter((s) => s.kind === StepKind.Healing)
      .map((s: any) => s.source.id);

    expect(sources).toEqual(['dying', 'survivor']);
  });
});
