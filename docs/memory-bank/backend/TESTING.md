# Testing Guidelines

Tools, configuration and commands: see [STACK.md](../STACK.md) and [CODING_ASSERTIONS.md](CODING_ASSERTIONS.md).

## Levels

- **Unit** (`src/**/__tests__/*.spec.ts`, root `src`): cards, skills, targeting strategies, card selectors, status effects, buffs/debuffs, turn end, damage calculator and elemental matrix, fight simulations (1v1, 2v2, 5v5)
- **Controller** (`src/fight/http-api/__test__/fight.controller.spec.ts`): DTO → domain mapping and factories, with `FightSimulatorStub` (`__test__/fight-simulator-stub.ts`, implements `FightSimulator` and exposes validation helpers)
- **E2E** (`test/**/*.e2e-spec.ts`, config `test/jest-e2e.json`): the full flow from DTO to fight result, one file per feature
  - `samples/cards.json` is the official roster: `sample-cards.e2e-spec.ts` makes it fight itself, and each card has a `<card>-kit.e2e-spec.ts` (Scythra, Selkhet, Vespera) checking every part of its kit appears in the report
  - The roster outgrew a deck (5 cards): the mirror match keeps the five cards its checks were written for; Selkhet (her ultimate can wipe a team in one blow) and Vespera each fight in a deck of their own

## Helpers (`test/helpers/`)

- `createFightingCard()` (`fighting-card.ts`): faker defaults, every attribute configurable (including `id`), builds skills and behaviors, supports status effects. `others` skills with an `ally-death` trigger need `targetCardId`, otherwise it throws (fail fast)
- `createEffect()` (`effect.ts`): poison, burn, freeze effects
- `randomizer-fake.ts`: deterministic randomizer

## Patterns

- `beforeEach()` for isolation, `beforeAll()` for expensive setup
- Cover success and edge cases; verify exact step sequences with `toEqual()`
- Cover status interactions (poison + burn, freeze blocking effects) and buff/debuff duration and stacking
- One expectation per `it`, at most 10 lines
- `ally-death`: assert the **immediate next step** after the death step (`stepEntries[deathStepIndex + 1]`), not a search through later steps, to verify ordering. Canonical case: the survivor has a self-targeting healing skill, an enemy kills its ally, the next step is the survivor healing
