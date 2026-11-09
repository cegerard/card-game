import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { EnergyGainSkill } from '../energy-gain';
import { AllySkillUsedTrigger } from '../../../trigger/ally-skill-used';
import { skillResultsToSteps } from '../../../fight-simulator/skill-results-to-steps';

describe('EnergyGainSkill', () => {
  const skill = new EnergyGainSkill('Souffle', 3, new AllySkillUsedTrigger());

  it('fills the gauge of its owner', () => {
    const owner = createFightingCard();
    skill.launch(owner);

    expect(owner.actualEnergy).toBe(3);
  });

  it('fires on an ally skill', () => {
    expect(skill.isTriggered('ally-skill-used')).toBe(true);
  });

  it('reports nothing on a full gauge', () => {
    const owner = createFightingCard();
    owner.gainEnergy(Number.MAX_SAFE_INTEGER);

    expect(skillResultsToSteps(owner, [skill.launch(owner)])).toEqual([]);
  });

  it('rejects an amount below 1', () => {
    expect(
      () => new EnergyGainSkill('Souffle', 0, new AllySkillUsedTrigger()),
    ).toThrow('ENERGY_GAIN amount must be an integer >= 1');
  });
});
