import { CardStateBurned } from '../cards/@types/state/card-state-burned';
import { CardStateFrozen } from '../cards/@types/state/card-state-frozen';
import { CardStatePoisoned } from '../cards/@types/state/card-state-poisoned';
import { FightingCard } from '../cards/fighting-card';
import {
  duel,
  hit,
  knockOut,
  statusChange,
  striker,
  target,
  tick,
} from '../../../../test/helpers/status-duel';

const freeze = (level: 1 | 2 | 3) => ({ type: 'freeze', rate: 0.5, level });

describe('Add frozen effect level 1', () => {
  let card1: FightingCard;

  beforeEach(() => {
    card1 = striker(freeze(1));
  });

  describe('and the target is already frozen with level 1', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateFrozen(1, 1, 0.5));
    });

    it('does not change the frozen state', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 150, 10),
        tick(card2, 'freeze', 0, 10),
        hit(card1, card2, 10, 0, 20),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the target is already poisoned', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStatePoisoned(1, 1, 50));
    });

    it('adds freeze effect while pausing the poison effect', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 100, 60),
        statusChange(card2, 'freeze'),
        tick(card2, 'freeze', 0, 60),
        hit(card1, card2, 60, 0, 20),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the defender is already burnt with level 1', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateBurned(1, 1, 0.5));
    });

    it('interrupts burn and does not apply the freeze effect', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 100, 60),
        hit(card2, card1, 0, 100),
        hit(card1, card2, 60, 0, 20),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the defender is already burnt with level 2', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateBurned(2, 3, 60));
    });

    it('does not interrupt burn and does not apply freeze effect', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 100, 60),
        hit(card2, card1, 0, 100),
        tick(card2, 'burn', 60, 0, 2),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });
});

describe('Add frozen effect level 2', () => {
  let card1: FightingCard;

  beforeEach(() => {
    card1 = striker(freeze(2));
  });

  describe('and the target is already frozen with level 1', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateFrozen(1, 1, 0.5));
    });

    it('replaces the freeze state with the new one', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 150, 10),
        statusChange(card2, 'freeze'),
        tick(card2, 'freeze', 0, 10, 2),
        hit(card1, card2, 10, 0, 20),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the target is already poisoned', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStatePoisoned(1, 1, 50));
    });

    it('adds freeze effect while pausing poison effect', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 100, 60),
        statusChange(card2, 'freeze'),
        tick(card2, 'freeze', 0, 60, 2),
        hit(card1, card2, 60, 0, 20),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the defender is already burnt with level 1', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateBurned(1, 2, 0.5));
    });

    it('interrupts burn and applies freeze effect level 1', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 100, 60),
        statusChange(card2, 'freeze'),
        tick(card2, 'freeze', 0, 60),
        hit(card1, card2, 60, 0, 20),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the defender is already burnt with level 2', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateBurned(2, 3, 0.5));
    });

    it('interrupts burn and does not apply the freeze effect', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 100, 60),
        hit(card2, card1, 0, 100),
        hit(card1, card2, 60, 0, 20),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });
});

describe('Add frozen effect level 3', () => {
  let card1: FightingCard;

  beforeEach(() => {
    card1 = striker(freeze(3));
  });

  describe('and the target is already frozen with level 1', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateFrozen(1, 1, 0.5));
    });

    it('replaces the freeze state with the new one', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 150, 10),
        statusChange(card2, 'freeze'),
        tick(card2, 'freeze', 0, 10, 4),
        hit(card1, card2, 10, 0, 20),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the target is already frozen with level 2', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateFrozen(2, 3, 0.5));
    });

    it('replaces the burn state with the new one', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 150, 10),
        statusChange(card2, 'freeze'),
        tick(card2, 'freeze', 0, 10, 4),
        hit(card1, card2, 10, 0, 20),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the target is already poisoned', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStatePoisoned(1, 1, 50));
    });

    it('adds freeze effect while pausing poison effect', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 100, 60),
        statusChange(card2, 'freeze'),
        tick(card2, 'freeze', 0, 60, 4),
        hit(card1, card2, 60, 0, 20),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the defender is already burnt with level 1', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateBurned(1, 2, 50));
    });

    it('interrupts burn and applies freeze effect level 2', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 100, 60),
        statusChange(card2, 'freeze'),
        tick(card2, 'freeze', 0, 60, 2),
        hit(card1, card2, 60, 0, 20),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the defender is already burnt with level 2', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateBurned(1, 3, 0.5));
    });

    it('interrupts burn and applies freeze effect level 2', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 100, 60),
        statusChange(card2, 'freeze'),
        tick(card2, 'freeze', 0, 60, 2),
        hit(card1, card2, 60, 0, 20),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the defender is already burnt with level 3', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateBurned(3, 5, 0.5));
    });

    it('interrupts burn and does not apply the freeze effect', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 100, 60),
        hit(card2, card1, 0, 100),
        hit(card1, card2, 60, 0, 20),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });
});

describe('Trigger card attack after freeze dissipation', () => {
  let card1: FightingCard;
  let card2: FightingCard;

  beforeEach(() => {
    card1 = striker(undefined, 100);
    card1.setState(new CardStateFrozen(1, 1, 0.2));
    card2 = target(100);
  });

  it('kill the opponent', () => {
    expect(duel(card1, card2)).toMatchObject([
      tick(card1, 'freeze', 0, 100),
      hit(card2, card1, 0, 100),
      hit(card1, card2, 100, 0),
      ...knockOut(card2, 'Player 1'),
    ]);
  });
});
