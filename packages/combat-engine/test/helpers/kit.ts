import { expect, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

type Card = Record<string, any>;

const roster: Card[] = JSON.parse(
  readFileSync(
    join(fileURLToPath(import.meta.url), '../../../samples/cards.json'),
    'utf-8',
  ),
);

/** A roster card, criticals off unless overridden, so every hit lands the same. */
export const rosterCard = (id: string, overrides: Card = {}): Card => ({
  ...roster.find((card) => card.id === id),
  criticalChance: 0,
  ...overrides,
});

/**
 * A neutral opponent: no element bonus, no defense, no dodge, a special it
 * never charges, and health enough to outlast the kit under test.
 */
export const dummy = (id: string, overrides: Card = {}): Card => ({
  id,
  name: id,
  attack: 0,
  defense: 0,
  health: 10000,
  speed: 50,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
  element: 'PHYSICAL',
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      energy: 9999,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: 'Attack',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      targetingStrategy: 'position-based',
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
  ...overrides,
});

/** Pins every roll of the fight to `roll`. */
export const rolling = (roll: number) =>
  jest.spyOn(Math, 'random').mockReturnValue(roll);

/** Matches a card of a step by its id. */
export const card = (id: string) => expect.objectContaining({ id });

/**
 * An alteration entry of a buff or debuff step: kind and value, then the
 * remaining turns and the target when given.
 */
export const alteration = (
  kind: string,
  value: number,
  remainingTurns?: number | null,
  target?: string,
) =>
  expect.objectContaining({
    kind,
    value,
    ...(remainingTurns === undefined ? {} : { remainingTurns }),
    ...(target === undefined ? {} : { target: card(target) }),
  });

/** The alterations of the first `kind` step (buff, debuff…) named `name`. */
export const alterationsOf = (steps: any[], kind: string, name: string) =>
  named(steps, kind, name)[0].alterations;

export const named = (steps: any[], kind: string, name: string) =>
  steps.filter((s) => s.kind === kind && s.name === name);

export const ofKind = (steps: any[], kind: string) =>
  steps.filter((s) => s.kind === kind);

/** The names of the attacks and specials a card launched, in order. */
export const actionsOf = (steps: any[], id: string) =>
  steps
    .filter(
      (s) =>
        ['attack', 'special_attack'].includes(s.kind) && s.attacker.id === id,
    )
    .map((s) => s.name);

/** Index of the step reporting the death of `id`, -1 if it lives. */
export const deathOf = (steps: any[], id: string) =>
  steps.findIndex(
    (s) =>
      s.kind === 'status_change' && s.status === 'dead' && s.card.id === id,
  );

/** The values of `keys` in a step, a card reduced to its id, to compare at once. */
export const pick = (step: any, ...keys: string[]) =>
  keys.map((key) => step[key]?.id ?? step[key]);

/** Where `name` stands in a list of action names. */
export const positionsOf = (actions: string[], name: string) =>
  actions.flatMap((action, i) => (action === name ? [i] : []));

/** Each hit a card took: the damages entries aimed at it, in order. */
export const hitsOn = (steps: any[], id: string) =>
  steps
    .filter((s) => ['attack', 'special_attack'].includes(s.kind))
    .flatMap((s) => s.damages.filter((d) => d.defender.id === id));

/**
 * Remaining turns of the `status` ticks on `id` from step `from`, up to the
 * one ending it: a status lasting two turns reads [1, 0].
 */
export const statusTicks = (
  steps: any[],
  status: string,
  id: string,
  from = 0,
) => {
  const ticks = steps
    .slice(from)
    .filter(
      (s) => s.kind === 'state_effect' && s.type === status && s.card.id === id,
    )
    .map((s) => s.remainingTurns);
  return ticks.slice(0, ticks.indexOf(0) + 1);
};

/**
 * Boots the app around each test of the calling `describe` and returns a
 * `fight()` that posts two decks and resolves to the report steps.
 */
export function useFight() {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  const post = (player1: Card[], player2: Card[]) =>
    request(app.getHttpServer())
      .post('/fight')
      .send({
        cardSelectorStrategy: 'player-by-player',
        player1: { name: 'P1', deck: player1 },
        player2: { name: 'P2', deck: player2 },
      });
  const fight = async (player1: Card[], player2: Card[]): Promise<any[]> =>
    Object.values((await post(player1, player2).expect(200)).body);

  // `post` leaves the status to the caller, for the requests the engine refuses
  return Object.assign(fight, { post });
}
