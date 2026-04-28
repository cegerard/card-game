/**
 * Fight Replayer — Icon & Color Design System
 * Centralises all icon glyphs and event colour tokens.
 */

/** Emoji icons by category */
export const ICON = {
  /* Attacks */
  attack:            '⚔️',
  special_attack:    '✨',
  /* Healing */
  healing:           '💚',
  /* Buff / Debuff */
  buff:              '⬆️',
  debuff:            '⬇️',
  buff_removed:      '✖️',
  debuff_removed:    '✖️',
  buff_expired:      '⬇️',
  debuff_expired:    '⬇️',
  /* Status effects */
  burn:              '🔥',
  poison:            '☠️',
  freeze:            '❄️',
  dead:              '💀',
  status_change:     '⚡',
  state_effect:      '💢',
  /* Targeting */
  targeting_override: '🎯',
  targeting_reverted: '🔄',
  /* Events */
  effect_removed:    '✖️',
  fight_end:         '🏆',
  fight_end_loss:    '💀',
  /* Fallbacks */
  start:             '⚡',
  unknown:           '•',
};

/** Per-status icon lookup */
export const STATUS_ICON = {
  burn:   ICON.burn,
  poison: ICON.poison,
  freeze: ICON.freeze,
};

/** Primary colour per event kind */
export const EVENT_COLOR = {
  attack:            '#fb923c',
  special_attack:    '#f59e0b',
  healing:           '#22c55e',
  buff:              '#a3e635',
  debuff:            '#f87171',
  buff_removed:      '#94a3b8',
  debuff_removed:    '#94a3b8',
  buff_expired:      '#94a3b8',
  debuff_expired:    '#94a3b8',
  status_change:     '#f97316',
  state_effect_burn: '#f97316',
  state_effect_poison: '#84cc16',
  state_effect_freeze: '#38bdf8',
  targeting_override: '#c084fc',
  targeting_reverted: '#c084fc',
  effect_removed:    '#94a3b8',
  fight_end:         '#22c55e',
};

/** Elemental damage type colours */
export const ELEM_COLOR = {
  FIRE:     '#ef4444',
  PHYSICAL: '#94a3b8',
  WATER:    '#38bdf8',
  EARTH:    '#84cc16',
  AIR:      '#a78bfa',
};
