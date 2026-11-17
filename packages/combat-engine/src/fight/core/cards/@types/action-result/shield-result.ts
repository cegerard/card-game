import type { CardInfo } from '@card-game/shared-types';
import { Shield } from '../shield/shield';

export type ShieldResult = {
  target: CardInfo;
  shield: Shield;
};
