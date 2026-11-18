import type * as Shared from '@card-game/shared-types';
import type { Assert, Equal } from '../../../tools/type-equality';
import type { DamageType } from '../../cards/@types/damage/damage-type';
import type { StepKind } from './step';

/*
 * Compile-time only. The engine builds the shared report steps with these
 * enums because it needs their values at runtime, which shared-types (types
 * only) cannot provide; they must stay equal to the shared unions.
 */
export type SharedReportContractChecks = [
  Assert<Equal<`${StepKind}`, Shared.StepKind>>,
  Assert<Equal<`${DamageType}`, Shared.DamageType>>,
];
