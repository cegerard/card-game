export type RendererMode = 'phaser' | 'web';

export function getRendererMode(): RendererMode {
  if (typeof window === 'undefined') return 'phaser';
  const mode = new URLSearchParams(window.location.search).get('mode');
  return mode === 'phaser' ? 'phaser' : 'web';
}
