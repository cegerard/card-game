import type * as Shared from '@card-game/shared-types';
import type { Assert, Equal } from '../../../tools/type-equality';
import type { AlterationType } from '../../cards/@types/alteration/alteration-type';
import type { DamageType } from '../../cards/@types/damage/damage-type';
import type { StateEffectType } from '../../cards/@types/state/state-effect-type';
import type { WeakPointEndReason } from '../../cards/@types/weak-point/weak-point';
import type { StepKind } from './step';

/*
 * Compile-time only. The report steps are the shared types; the engine keeps
 * its own runtime enum and unions to build them, which must stay equal to the
 * shared ones.
 */
export type SharedReportContractChecks = [
  Assert<Equal<`${StepKind}`, Shared.StepKind>>,
  Assert<Equal<AlterationType, Shared.BuffType>>,
  Assert<Equal<`${DamageType}`, Shared.DamageType>>,
  Assert<Equal<StateEffectType, Shared.StateEffectType>>,
  Assert<Equal<WeakPointEndReason, Shared.WeakPointEndReason>>,
];
