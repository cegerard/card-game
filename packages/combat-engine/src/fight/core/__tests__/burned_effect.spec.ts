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

const burn = (level: 1 | 2 | 3) => ({ type: 'burn', rate: 0.5, level });

describe('Add Burned effect level 1', () => {
  let card1: FightingCard;

  beforeEach(() => {
    card1 = striker(burn(1));
  });

  describe('and the target is already burned with level 1', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(150, new CardStateBurned(1, 1, 50));
    });

    it('does not change the burn state', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 100, 50),
        hit(card2, card1, 0, 100),
        tick(card2, 'burn', 50, 0),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the target is already poisoned', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStatePoisoned(1, 1, 50));
    });

    it('adds burn effect while keeping poison effect', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 100, 60),
        statusChange(card2, 'burn'),
        hit(card2, card1, 0, 100),
        tick(card2, 'poison', 50, 10),
        tick(card2, 'burn', 50, 0),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the defender is already frozen with level 1', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateFrozen(1, 2, 0.5));
    });

    it('interrupts freeze and does not apply the burn effect', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 150, 10),
        hit(card2, card1, 0, 100),
        hit(card1, card2, 10, 0, 20),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the defender is already frozen with level 2', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateFrozen(2, 3, 0.5));
    });

    it('does not interrupt freeze and does not apply burn effect', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 150, 10),
        tick(card2, 'freeze', 0, 10, 2),
        hit(card1, card2, 10, 0, 20),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });
});

describe('Add Burned effect level 2', () => {
  let card1: FightingCard;

  beforeEach(() => {
    card1 = striker(burn(2));
  });

  describe('and the target is already burned with level 1', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(150, new CardStateBurned(1, 1, 50));
    });

    it('replaces the burn state with the new one', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 100, 50),
        statusChange(card2, 'burn'),
        hit(card2, card1, 0, 100),
        tick(card2, 'burn', 50, 0, 2),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the target is already poisoned', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStatePoisoned(1, 1, 50));
    });

    it('adds burn effect while keeping poison effect', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 100, 60),
        statusChange(card2, 'burn'),
        hit(card2, card1, 0, 100),
        tick(card2, 'poison', 50, 10),
        tick(card2, 'burn', 50, 0, 2),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the defender is already frozen with level 1', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateFrozen(1, 2, 0.5));
    });

    it('interrupts freeze and applies burn effect level 1', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 150, 10),
        statusChange(card2, 'burn'),
        hit(card2, card1, 0, 100),
        tick(card2, 'burn', 50, 0),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the defender is already frozen with level 2', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateFrozen(2, 3, 0.5));
    });

    it('interrupts freeze and does not apply the burn effect', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 150, 10),
        hit(card2, card1, 0, 100),
        hit(card1, card2, 10, 0, 20),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });
});

describe('Add Burned effect level 3', () => {
  let card1: FightingCard;

  beforeEach(() => {
    card1 = striker(burn(3));
  });

  describe('and the target is already burned with level 1', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(150, new CardStateBurned(1, 1, 50));
    });

    it('replaces the burn state with the new one', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 100, 50),
        statusChange(card2, 'burn'),
        hit(card2, card1, 0, 100),
        tick(card2, 'burn', 50, 0, 4),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the target is already burned with level 2', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(150, new CardStateBurned(2, 3, 50));
    });

    it('replaces the burn state with the new one', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 100, 50),
        statusChange(card2, 'burn'),
        hit(card2, card1, 0, 100),
        tick(card2, 'burn', 50, 0, 4),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the target is already poisoned', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStatePoisoned(1, 1, 50));
    });

    it('adds burn effect while keeping poison effect', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 100, 60),
        statusChange(card2, 'burn'),
        hit(card2, card1, 0, 100),
        tick(card2, 'poison', 50, 10),
        tick(card2, 'burn', 50, 0, 4),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the defender is already frozen with level 1', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateFrozen(1, 2, 0.5));
    });

    it('interrupts freeze and applies burn effect level 2', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 150, 10),
        statusChange(card2, 'burn'),
        hit(card2, card1, 0, 100),
        tick(card2, 'burn', 50, 0, 2),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the defender is already frozen with level 2', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateFrozen(2, 3, 0.5));
    });

    it('interrupts freeze and applies burn effect level 2', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 150, 10),
        statusChange(card2, 'burn'),
        hit(card2, card1, 0, 100),
        tick(card2, 'burn', 50, 0, 2),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });

  describe('and the defender is already frozen with level 3', () => {
    let card2: FightingCard;

    beforeEach(() => {
      card2 = target(160, new CardStateFrozen(3, 4, 0.5));
    });

    it('interrupts freeze and does not apply burn effect', () => {
      expect(duel(card1, card2)).toMatchObject([
        hit(card1, card2, 150, 10),
        hit(card2, card1, 0, 100),
        hit(card1, card2, 10, 0, 20),
        ...knockOut(card2, 'Player 1'),
      ]);
    });
  });
});

describe('Trigger card attack after burn dissipation', () => {
  let card1: FightingCard;
  let card2: FightingCard;

  beforeEach(() => {
    card1 = striker(undefined, 50);
    card1.setState(new CardStateBurned(1, 1, 10));
    card2 = target(100);
  });

  it('kill the opponent', () => {
    expect(duel(card1, card2)).toMatchObject([
      hit(card1, card2, 50, 50),
      tick(card1, 'burn', 10, 90),
      hit(card2, card1, 0, 90),
      hit(card1, card2, 50, 0, 20),
      ...knockOut(card2, 'Player 1'),
    ]);
  });
});
