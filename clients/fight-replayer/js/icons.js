/**
 * Fight Replayer — Icon & Color Design System
 * Centralises all icon glyphs and event colour tokens.
 */

/** Emoji icons by category */
export const ICON = {
  /* Attacks */
  attack:            '⚔️',
  special_attack:    '✨',
  special_stance:    '🌀',
  /* Healing */
  healing:           '💚',
  /* Buff / Debuff */
  buff:              '⬆️',
  debuff:            '⬇️',
  buff_removed:      '✖️',
  debuff_removed:    '✖️',
  buff_expired:      '⬇️',
  buff_transferred:  '🎁',
  debuff_expired:    '⬇️',
  /* Status effects */
  burn:              '🔥',
  poison:            '☠️',
  freeze:            '❄️',
  stunt:             '💫',
  bleed:             '🩸',
  hypothermia:       '🥶',
  entangle:          '🐙',
  dead:              '💀',
  status_change:     '⚡',
  state_effect:      '💢',
  /* Shield */
  shield_applied:    '🛡️',
  shield_broken:     '💥',
  shield_expired:    '🔻',
  /* Survive */
  survived:          '🌟',
  /* Execution */
  executed:          '⚰️',
  /* Damage reduction */
  damage_mitigated:  '🩹',
  /* Stance */
  stance_started:    '🥋',
  stance_ended:      '🔚',
  /* Concealment */
  concealment_started: '🌑',
  concealment_ended:   '👁️',
  /* Protection */
  protection_started: '🫂',
  protection_ended:   '🙌',
  attack_intercepted: '🛡️',
  /* Regeneration */
  regenerated:       '♻️',
  /* Elemental mark */
  mark_applied:      '💠',
  /* Weak points */
  weak_point_revealed: '🔍',
  weak_point_ended:    '🫥',
  analysis_charged:    '🧠',
  /* Battlefield and colony support */
  battlefield_started:  '🌨️',
  battlefield_extended: '⏳',
  battlefield_ended:    '🌤️',
  revived:              '🕊️',
  attack_empowered:     '🔥',
  damage_shared:        '🤝',
  energy_gained:        '🔋',
  effect_cleansed:      '🧼',
  /* Control */
  action_failed:         '🪢',
  energy_drained:        '🪫',
  vulnerability_applied: '💧',
  vulnerability_ended:   '🌤️',
  support_blocked:       '🚫',
  support_block_ended:   '✅',
  decoy_struck:          '🫧',
  /* Transformation */
  transformation_started: '🌀',
  transformation_ended:   '💤',
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
  stunt:  ICON.stunt,
  bleed:  ICON.bleed,
  hypothermia: ICON.hypothermia,
  entangle: ICON.entangle,
};

/** Primary colour per event kind */
export const EVENT_COLOR = {
  attack:            '#fb923c',
  special_attack:    '#f59e0b',
  special_stance:    '#f59e0b',
  healing:           '#22c55e',
  buff:              '#a3e635',
  debuff:            '#f87171',
  buff_removed:      '#94a3b8',
  debuff_removed:    '#94a3b8',
  buff_expired:      '#94a3b8',
  buff_transferred:  '#facc15',
  debuff_expired:    '#94a3b8',
  status_change:     '#f97316',
  state_effect_burn: '#f97316',
  state_effect_poison: '#84cc16',
  state_effect_freeze: '#38bdf8',
  state_effect_bleed: '#dc2626',
  state_effect_hypothermia: '#7dd3fc',
  targeting_override: '#c084fc',
  targeting_reverted: '#c084fc',
  effect_removed:    '#94a3b8',
  shield_applied:    '#60a5fa',
  shield_broken:     '#f87171',
  shield_expired:    '#94a3b8',
  survived:          '#fbbf24',
  executed:          '#dc2626',
  damage_mitigated:  '#7dd3fc',
  stance_started:    '#818cf8',
  stance_ended:      '#94a3b8',
  concealment_started: '#a78bfa',
  concealment_ended:   '#94a3b8',
  protection_started: '#38bdf8',
  protection_ended:   '#94a3b8',
  attack_intercepted: '#60a5fa',
  regenerated:       '#4ade80',
  mark_applied:      '#22d3ee',
  weak_point_revealed: '#e0f2fe',
  weak_point_ended:    '#94a3b8',
  analysis_charged:    '#bae6fd',
  battlefield_started:  '#7dd3fc',
  battlefield_extended: '#7dd3fc',
  battlefield_ended:    '#94a3b8',
  revived:              '#fde68a',
  attack_empowered:     '#f97316',
  damage_shared:        '#60a5fa',
  energy_gained:        '#facc15',
  effect_cleansed:      '#a7f3d0',
  action_failed:         '#94a3b8',
  energy_drained:        '#a855f7',
  vulnerability_applied: '#38bdf8',
  vulnerability_ended:   '#94a3b8',
  support_blocked:       '#f87171',
  support_block_ended:   '#94a3b8',
  decoy_struck:          '#7dd3fc',
  transformation_started: '#a855f7',
  transformation_ended:   '#94a3b8',
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
