import { CardInfo } from '../card-info';
import {
  AlterationDetail,
  Buff,
  Debuff,
} from '../alteration/alteration-detail';

type AlterationResult<T extends AlterationDetail = AlterationDetail> = {
  target: CardInfo;
  alteration: T;
};

export type BuffResult = AlterationResult<Buff>;
export type DebuffResult = AlterationResult<Debuff>;
export type BuffResults = BuffResult[];
export type DebuffResults = DebuffResult[];
