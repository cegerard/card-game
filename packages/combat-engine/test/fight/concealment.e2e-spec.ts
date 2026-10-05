import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const concealment = (extra: object = {}) => ({
  kind: 'CONCEALMENT',
  name: 'Marche Fantôme',
  event: 'fight-start',
  ...extra,
});

const card = (id: string, speed: number, others: object[] = []) => ({
  id,
  name: id,
  attack: 100,
  defense: 0,
  health: 100000,
  speed,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
  element: 'PHYSICAL',
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      energy: 1000,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: `${id} attack`,
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
    },
    others,
  },
  behaviors: { dodge: 'simple-dodge' },
});

const payload = (skill: object) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: {
    name: 'P1',
    deck: [card('selkhet', 1, [skill]), card('bait', 1)],
  },
  player2: { name: 'P2', deck: [card('hunter', 50)] },
});

describe('CONCEALMENT skill', () => {
  let app: INestApplication;

  const post = (body: object) =>
    request(app.getHttpServer()).post('/fight').send(body);
  const steps = async (skill = concealment()) =>
    Object.values((await post(payload(skill))).body) as any[];
  const hitsOn = (step: any, id: string) =>
    (step.damages ?? []).some((d) => d.defender.id === id);
  const firstAttackBy = (all: any[], id: string) =>
    all.findIndex((s) => s.kind === 'attack' && s.attacker.id === id);

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('conceals the card right after the fight start', async () => {
    const [, opening] = await steps();

    expect(opening).toEqual(
      expect.objectContaining({
        kind: 'concealment_started',
        name: 'Marche Fantôme',
        card: expect.objectContaining({ id: 'selkhet' }),
      }),
    );
  });

  it('is never hit before its first attack', async () => {
    const all = await steps();
    const beforeFirstAttack = all.slice(0, firstAttackBy(all, 'selkhet'));

    expect(beforeFirstAttack.some((s) => hitsOn(s, 'selkhet'))).toBe(false);
  });

  it('is revealed right after its first attack', async () => {
    const all = await steps();

    expect(all[firstAttackBy(all, 'selkhet') + 1]).toEqual(
      expect.objectContaining({
        kind: 'concealment_ended',
        reason: 'attacked',
      }),
    );
  });

  it('is hit normally once revealed', async () => {
    const all = await steps();
    const afterFirstAttack = all.slice(firstAttackBy(all, 'selkhet'));

    expect(afterFirstAttack.some((s) => hitsOn(s, 'selkhet'))).toBe(true);
  });

  it('runs out after its duration', async () => {
    // Both sides concealed: neither can strike, so only the clock ends it.
    const body = {
      cardSelectorStrategy: 'player-by-player',
      player1: { name: 'P1', deck: [card('selkhet', 1, [concealment()])] },
      player2: {
        name: 'P2',
        deck: [card('hunter', 50, [concealment({ duration: 0 })])],
      },
    };
    const all = Object.values((await post(body)).body) as any[];

    expect(all).toContainEqual(
      expect.objectContaining({
        kind: 'concealment_ended',
        card: expect.objectContaining({ id: 'hunter' }),
        reason: 'expired',
      }),
    );
  });

  it('returns 400 with a negative duration', () => {
    return post(payload(concealment({ duration: -1 }))).expect(400);
  });

  it('returns 400 without an event', () => {
    const { event: _omitted, ...withoutEvent } = concealment();

    return post(payload(withoutEvent)).expect(400);
  });
});
