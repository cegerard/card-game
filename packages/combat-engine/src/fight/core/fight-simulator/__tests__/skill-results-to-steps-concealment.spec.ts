import { skillResultsToSteps } from '../skill-results-to-steps';
import { AttackSkillResults, SkillKind } from '../../cards/skills/skill';
import { StepKind } from '../@types/step';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';

describe('skillResultsToSteps: concealment', () => {
  let card: FightingCard;

  beforeEach(() => {
    card = createFightingCard({ id: 'selkhet' });
  });

  it('emits a concealment_started step', () => {
    const steps = skillResultsToSteps(card, [
      {
        skillKind: SkillKind.Concealment,
        name: 'Marche Fantôme',
        concealment: { name: 'Marche Fantôme', remainingTurns: 1 },
      },
    ]);

    expect(steps).toEqual([
      {
        kind: StepKind.ConcealmentStarted,
        name: 'Marche Fantôme',
        card: card.identityInfo,
        remainingTurns: 1,
      },
    ]);
  });

  describe('when a concealed card strikes with a triggered attack', () => {
    const counter = (defender: FightingCard): AttackSkillResults => ({
      skillKind: SkillKind.Attack,
      name: 'Riposte',
      results: [
        {
          damage: 10,
          isCritical: false,
          dodge: false,
          defender,
          remainingHealth: 90,
        },
      ],
    });

    beforeEach(() => {
      card.conceal('Marche Fantôme');
    });

    it('reports the concealment ended right after the attack step', () => {
      const steps = skillResultsToSteps(card, [
        counter(createFightingCard({})),
      ]);

      expect(steps[1]).toEqual({
        kind: StepKind.ConcealmentEnded,
        name: 'Marche Fantôme',
        card: card.identityInfo,
        reason: 'attacked',
      });
    });

    it('reveals the card', () => {
      skillResultsToSteps(card, [counter(createFightingCard({}))]);

      expect(card.isConcealed()).toBe(false);
    });
  });

  it('keeps the card concealed when its attack struck nobody', () => {
    card.conceal('Marche Fantôme');
    skillResultsToSteps(card, [
      { skillKind: SkillKind.Attack, name: 'Riposte', results: [] },
    ]);

    expect(card.isConcealed()).toBe(true);
  });
});
