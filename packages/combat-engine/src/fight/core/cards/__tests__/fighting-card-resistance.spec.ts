import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../fighting-card';
import { CardStatePoisoned } from '../@types/state/card-state-poisoned';
import { RandomizerFake } from '../../../../../test/helpers/randomizer-fake';

// 75 de résistance : un refus une fois sur 75 / 200 = 0,375.
const RESISTANCE = 75;
const REFUSAL_CHANCE = RESISTANCE / 200;

describe('FightingCard resistance', () => {
  let randomizer: RandomizerFake;

  function buildCard(resistance: number): FightingCard {
    return createFightingCard({ health: 1000, resistance, randomizer });
  }

  beforeEach(() => {
    randomizer = new RandomizerFake();
  });

  describe('actualResistance', () => {
    it('defaults to 0 when the card declares none', () => {
      expect(createFightingCard().actualResistance).toBe(0);
    });

    it('reports the declared stat', () => {
      expect(buildCard(RESISTANCE).actualResistance).toBe(RESISTANCE);
    });
  });

  describe('when the roll lands under the refusal chance', () => {
    let card: FightingCard;

    beforeEach(() => {
      randomizer.setNextRandomValue(REFUSAL_CHANCE - 0.01);
      card = buildCard(RESISTANCE);
    });

    it('refuses an incoming status effect', () => {
      expect(card.setState(new CardStatePoisoned(1, 1, 10))).toBe(false);
    });

    it('leaves the card free of that status', () => {
      card.setState(new CardStatePoisoned(1, 1, 10));

      expect(card.poisonLevel).toBe(0);
    });

    it('refuses an incoming debuff', () => {
      expect(card.applyDebuff('speed', 0.1, 3)).toBeUndefined();
    });

    it('leaves the stat untouched', () => {
      const before = card.actualSpeed;
      card.applyDebuff('speed', 0.1, 3);

      expect(card.actualSpeed).toBe(before);
    });

    it('still accepts a buff, which resistance does not oppose', () => {
      expect(card.applyBuff('speed', 0.1, 3)).toBeDefined();
    });
  });

  describe('when the roll lands on the refusal chance', () => {
    let card: FightingCard;

    beforeEach(() => {
      randomizer.setNextRandomValue(REFUSAL_CHANCE);
      card = buildCard(RESISTANCE);
    });

    it('accepts the status effect', () => {
      expect(card.setState(new CardStatePoisoned(1, 1, 10))).toBe(true);
    });

    it('accepts the debuff', () => {
      expect(card.applyDebuff('speed', 0.1, 3)).toBeDefined();
    });
  });

  describe('without the stat', () => {
    let card: FightingCard;

    beforeEach(() => {
      randomizer.setNextRandomValue(0);
      card = buildCard(0);
    });

    it('never refuses a status effect', () => {
      expect(card.setState(new CardStatePoisoned(1, 1, 10))).toBe(true);
    });

    it('never refuses a debuff', () => {
      expect(card.applyDebuff('speed', 0.1, 3)).toBeDefined();
    });
  });

  describe('once a debuff lowered it', () => {
    it('lowers the refusal chance accordingly', () => {
      randomizer.setNextRandomValue(1);
      const card = buildCard(RESISTANCE);
      card.applyDebuff('resistance', 0.2, 3);

      expect(card.actualResistance).toBe(60);
    });
  });
});
