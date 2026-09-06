import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import XpGainList from '../XpGainList.svelte';

describe('XpGainList', () => {
  it('renders nothing when there are no gains', () => {
    const { container } = render(XpGainList, { props: { gains: [] } });
    expect(container.querySelector('ul')).toBeNull();
  });

  it('shows the card name for a gain', () => {
    render(XpGainList, {
      props: { gains: [{ cardId: 'arionis', name: 'Arionis', gain: 137 }] },
    });
    expect(screen.getByText('Arionis')).toBeTruthy();
  });

  it('rounds the displayed gain to the nearest integer', () => {
    render(XpGainList, {
      props: { gains: [{ cardId: 'arionis', name: 'Arionis', gain: 137.4 }] },
    });
    expect(screen.getByText('+137 XP')).toBeTruthy();
  });

  it('shows one entry per gain', () => {
    render(XpGainList, {
      props: {
        gains: [
          { cardId: 'arionis', name: 'Arionis', gain: 100 },
          { cardId: 'kaelion', name: 'Kaelion', gain: 50 },
        ],
      },
    });
    expect(screen.getByText('Kaelion')).toBeTruthy();
  });
});
