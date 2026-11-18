import type * as Shared from '@card-game/shared-types';
import type { Assert, Equal } from '../../tools/type-equality';
import type { FightDataDto } from './fight-data.dto';

/*
 * Compile-time only. The DTO classes stay because their class-validator
 * decorators validate the request at runtime, and the enums they validate
 * against come from @card-game/shared-types. Each DTO `implements` its shared
 * interface, so whatever the engine accepts fits the contract; these checks
 * add the other way round: a field the contract allows is one the DTO
 * whitelists, so a client built on the contract never meets a 400 for it.
 */

type SameKeys<Dto, Contract> = Equal<keyof Dto, keyof Contract>;

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
];
