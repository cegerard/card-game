import { SurviveSkill } from '../survive';

describe('SurviveSkill', () => {
  describe('tryConsume()', () => {
    it('returns true on first call', () => {
      const skill = new SurviveSkill('Last Stand');

      expect(skill.tryConsume()).toBe(true);
    });

    it('returns false on second call', () => {
      const skill = new SurviveSkill('Last Stand');
      skill.tryConsume();

      expect(skill.tryConsume()).toBe(false);
    });

    it('returns false on every subsequent call after the first', () => {
      const skill = new SurviveSkill('Last Stand');
      skill.tryConsume();
      skill.tryConsume();

      expect(skill.tryConsume()).toBe(false);
    });
  });

  describe('name', () => {
    it('exposes the skill name', () => {
      const skill = new SurviveSkill('Earth Embrace');

      expect(skill.name).toBe('Earth Embrace');
    });
  });
});
