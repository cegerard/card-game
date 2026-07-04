export const ELEMENT_PALETTE = [
  '#ff6b35',
  '#3aacf0',
  '#5ec85e',
  '#ffc044',
  '#c87bff',
] as const;
export const ELEMENT_TOTEMS = ['🔥', '💧', '🌿', '⚡', '⚔️'] as const;
export const ELEMENT_LABELS = ['FIR', 'WAT', 'EAR', 'AIR', 'PHY'] as const;
export const CONFETTI_COLORS = [
  '#ffcf6b',
  '#ff7a45',
  '#4ade80',
  '#37e0ff',
  '#c87bff',
] as const;

export function colorAt(index: number): string {
  return ELEMENT_PALETTE[index % ELEMENT_PALETTE.length];
}

export function totemAt(index: number): string {
  return ELEMENT_TOTEMS[index % ELEMENT_TOTEMS.length];
}

export function labelAt(index: number): string {
  return ELEMENT_LABELS[index % ELEMENT_LABELS.length];
}

export function pct(value: number, max: number): number {
  return Math.round((value / max) * 100);
}
