import { CardInfo } from '../card-info';
import { Buff, Debuff } from '../alteration/alteration-detail';

export type BuffResult = { target: CardInfo; alteration: Buff };
export type DebuffResult = { target: CardInfo; alteration: Debuff };
