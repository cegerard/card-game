import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import GameOverScreen from '../GameOverScreen.svelte';

describe('GameOverScreen', () => {
  it('shows "Game Over" heading', () => {
    render(GameOverScreen);
    expect(screen.getByRole('heading', { name: /game over/i })).toBeTruthy();
  });

  it('shows "Back to Menu" button', () => {
    render(GameOverScreen);
    expect(screen.getByRole('button', { name: /back to menu/i })).toBeTruthy();
  });

  it('calls onmenu callback when "Back to Menu" is clicked', async () => {
    const onmenu = vi.fn();
    render(GameOverScreen, { props: { onmenu } });
    await fireEvent.click(screen.getByRole('button', { name: /back to menu/i }));
    expect(onmenu).toHaveBeenCalledOnce();
  });
});
