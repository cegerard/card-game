import type { StateEffectType, StatusCategory } from '@card-game/shared-types';

/** What a status effect does to its bearer: what an immunity is granted against. */

const CATEGORY_BY_TYPE: Record<StateEffectType, StatusCategory> = {
  freeze: 'control',
  stunt: 'control',
  entangle: 'control',
  poison: 'damage-over-time',
  burn: 'damage-over-time',
  bleed: 'damage-over-time',
  hypothermia: 'damage-over-time',
};

export function statusCategoryOf(type: StateEffectType): StatusCategory {
  return CATEGORY_BY_TYPE[type];
}
