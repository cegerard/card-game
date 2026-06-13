import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import LevelIndicator from '../LevelIndicator.svelte';

describe('LevelIndicator', () => {
  it('renders "Level 1" when level is 1', () => {
    render(LevelIndicator, { props: { level: 1 } });
    expect(screen.getByText('Level 1')).toBeTruthy();
  });

  it('renders "Level 3" when level is 3', () => {
    render(LevelIndicator, { props: { level: 3 } });
    expect(screen.getByText('Level 3')).toBeTruthy();
  });
});
