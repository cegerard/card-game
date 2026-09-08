import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RosterCard from '../RosterCard.svelte';
import { CHARACTER_ROSTER } from '../roster.js';

const card = CHARACTER_ROSTER[0];

describe('RosterCard', () => {
  it('shows the card name', () => {
    render(RosterCard, {
      props: {
        card,
        progression: { cardId: card.id, experience: 0, tier: 1 },
        selected: false,
        disabled: false,
        ontoggle: () => {},
      },
    });
    expect(screen.getByText(card.name)).toBeTruthy();
  });

  it('shows the tier as a star badge', () => {
    render(RosterCard, {
      props: {
        card,
        progression: { cardId: card.id, experience: 1200, tier: 2 },
        selected: false,
        disabled: false,
        ontoggle: () => {},
      },
    });
    expect(screen.getByText('★2')).toBeTruthy();
  });

  it('shows XP as a fraction of the tier cap below the ceiling', () => {
    render(RosterCard, {
      props: {
        card,
        progression: { cardId: card.id, experience: 1200, tier: 1 },
        selected: false,
        disabled: false,
        ontoggle: () => {},
      },
    });
    expect(screen.getByText('1200/5000')).toBeTruthy();
  });

  it('clamps the displayed fraction at the tier cap when XP is in reserve', () => {
    render(RosterCard, {
      props: {
        card,
        progression: { cardId: card.id, experience: 8000, tier: 1 },
        selected: false,
        disabled: false,
        ontoggle: () => {},
      },
    });
    expect(screen.getByText('5000/5000')).toBeTruthy();
  });

  it('shows the total accumulated XP at the maximum tier (uncapped)', () => {
    render(RosterCard, {
      props: {
        card,
        progression: { cardId: card.id, experience: 62000, tier: 5 },
        selected: false,
        disabled: false,
        ontoggle: () => {},
      },
    });
    expect(screen.getByText('62000 XP')).toBeTruthy();
  });

  it('shows the base stat value when the card has no XP', () => {
    render(RosterCard, {
      props: {
        card,
        progression: { cardId: card.id, experience: 0, tier: 1 },
        selected: false,
        disabled: false,
        ontoggle: () => {},
      },
    });
    expect(screen.getByText(String(card.stats.attack))).toBeTruthy();
  });

  it('does not mark a stat as boosted when the card has no XP', () => {
    const { container } = render(RosterCard, {
      props: {
        card,
        progression: { cardId: card.id, experience: 0, tier: 1 },
        selected: false,
        disabled: false,
        ontoggle: () => {},
      },
    });
    expect(container.querySelector('dd.boosted')).toBeNull();
  });

  it('shows a stat value greater than the base once XP is accumulated', () => {
    const { container } = render(RosterCard, {
      props: {
        card,
        progression: { cardId: card.id, experience: 10000, tier: 2 },
        selected: false,
        disabled: false,
        ontoggle: () => {},
      },
    });
    const boostedAttack = container.querySelector('dd.boosted');
    expect(Number(boostedAttack?.textContent)).toBeGreaterThan(
      card.stats.attack,
    );
  });
});
