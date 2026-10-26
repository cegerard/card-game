import { Player } from '../../player';
import { FightStart } from '../../trigger/fight-start';
import { SurvivedTrigger } from '../../trigger/survived';
import { Fight } from '../fight';
import { PlayerByPlayerCardSelector } from '../card-selectors/player-by-player';
import { SurviveSkill } from '../../cards/skills/survive';
import { AlterationSkill } from '../../cards/skills/alteration-skill';
import { Launcher } from '../../targeting-card-strategies/launcher';
import { Step, StepKind } from '../@types/step';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { executioner } from '../../../../../test/helpers/reactive-kill';

const holderWithLimitedBuff = () =>
  createFightingCard({
    id: 'holder',
    health: 100,
    defense: 0,
    agility: 0,
    survive: new SurviveSkill('Last Stand'),
    extraSkills: [
      new AlterationSkill({
        name: 'Resolve',
        polarity: 'buff',
        attributeType: 'attack',
        rate: 0.5,
        duration: 0,
        trigger: new SurvivedTrigger(),
        targetingStrategy: new Launcher(),
        activationLimit: 1,
        endEvent: 'resolve-over',
        terminationEvent: 'resolve-over',
      }),
    ],
  });

describe('Fight survived skill reacting to a fight-start attack', () => {
  it('processes the end event of the limited skill', () => {
    const player1 = new Player('p1', [executioner(new FightStart())]);
    const player2 = new Player('p2', [holderWithLimitedBuff()]);
    const fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );

    const steps = Object.values(fight.start()) as Step[];

    expect(steps.map((s) => s.kind)).toContain(StepKind.BuffRemoved);
  });
});
