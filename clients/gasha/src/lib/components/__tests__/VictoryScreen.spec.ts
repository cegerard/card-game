import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import VictoryScreen from '../VictoryScreen.svelte';

describe('VictoryScreen', () => {
  it('shows "Next Level" button when not final victory', () => {
    render(VictoryScreen, { props: { level: 2, isFinalVictory: false } });
    expect(screen.getByRole('button', { name: /next level/i })).toBeTruthy();
  });

  it('shows "Back to Menu" button', () => {
    render(VictoryScreen, { props: { level: 2, isFinalVictory: false } });
    expect(screen.getByRole('button', { name: /back to menu/i })).toBeTruthy();
  });

  it('hides "Next Level" button when isFinalVictory is true', () => {
    render(VictoryScreen, { props: { level: 5, isFinalVictory: true } });
    expect(screen.queryByRole('button', { name: /next level/i })).toBeNull();
  });

  it('shows a final victory message when isFinalVictory is true', () => {
    render(VictoryScreen, { props: { level: 5, isFinalVictory: true } });
    expect(screen.getByText(/all levels cleared|final victory|you won/i)).toBeTruthy();
  });
});
