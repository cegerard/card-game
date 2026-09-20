import { StateEffectType } from './state-effect-type';

/**
 * What a status effect does to its bearer, which is what an immunity is
 * granted against: control takes the turn away, damage-over-time only bites.
 */
export type StatusCategory = 'control' | 'damage-over-time';

const CATEGORY_BY_TYPE: Record<StateEffectType, StatusCategory> = {
  freeze: 'control',
  stunt: 'control',
  poison: 'damage-over-time',
  burn: 'damage-over-time',
};

export function statusCategoryOf(type: StateEffectType): StatusCategory {
  return CATEGORY_BY_TYPE[type];
}
