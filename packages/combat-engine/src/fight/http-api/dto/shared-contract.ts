import type * as Shared from '@card-game/shared-types';
import type { Assert, Equal } from '../../tools/type-equality';
import type {
  AlterationConditionType,
  BuffType,
  CardSelectorStrategy,
  DodgeStrategy,
  Effect,
  ElementDto,
  FightDataDto,
  RateBasisDto,
  SkillKind,
  SpecialKind,
  StatusCategoryDto,
  TargetingStrategy,
  TriggerEvent,
} from './fight-data.dto';

/*
 * Compile-time only. The DTOs `implements` the shared contract, so whatever
 * the engine accepts fits the contract. These checks add the other way round:
 * a field or a value the contract allows is one the engine accepts, so a
 * client built on @card-game/shared-types never meets a 400 for it.
 */

type SameKeys<Dto, Contract> = Equal<keyof Dto, keyof Contract>;
type SameValues<DtoEnum extends string, Contract> = Equal<
  `${DtoEnum}`,
  Contract
>;

type Player = FightDataDto['player1'];
type Card = Player['deck'][number];
type Skills = Card['skills'];
type Special = Skills['special'];
type SimpleAttack = NonNullable<Skills['simpleAttack']>;
type MultipleAttack = NonNullable<Skills['multipleAttack']>;
type Other = Skills['others'][number];
type Effects = NonNullable<SimpleAttack['effects']>[number];
type Battlefield = NonNullable<Special['battlefield']>;

export type SharedContractChecks = [
  Assert<SameKeys<FightDataDto, Shared.FightRequest>>,
  Assert<SameKeys<Player, Shared.FightPlayer>>,
  Assert<SameKeys<Card, Shared.CardConfig>>,
  Assert<SameKeys<Skills, Shared.SkillSet>>,
  Assert<SameKeys<Card['behaviors'], Shared.Behaviors>>,
  Assert<SameKeys<Special, Shared.SpecialSkill>>,
  Assert<SameKeys<SimpleAttack, Shared.SimpleAttackSkill>>,
  Assert<SameKeys<MultipleAttack, Shared.MultipleAttackSkill>>,
  Assert<SameKeys<Other, Shared.OtherSkill>>,
  Assert<SameKeys<Effects, Shared.EffectConfig>>,
  Assert<SameKeys<Battlefield, Shared.Battlefield>>,
  Assert<SameValues<AlterationConditionType, Shared.AlterationConditionType>>,
  Assert<SameValues<BuffType, Shared.BuffType>>,
  Assert<SameValues<CardSelectorStrategy, Shared.CardSelectorStrategy>>,
  Assert<SameValues<DodgeStrategy, Shared.DodgeStrategy>>,
  Assert<SameValues<Effect, Shared.EffectType>>,
  Assert<SameValues<ElementDto, Shared.Element>>,
  Assert<SameValues<RateBasisDto, Shared.RateBasis>>,
  Assert<SameValues<SkillKind, Shared.SkillKind>>,
  Assert<SameValues<SpecialKind, Shared.SpecialKind>>,
  Assert<SameValues<StatusCategoryDto, Shared.StatusCategory>>,
  Assert<SameValues<TargetingStrategy, Shared.TargetingStrategy>>,
  Assert<SameValues<TriggerEvent, Shared.TriggerEvent>>,
];
