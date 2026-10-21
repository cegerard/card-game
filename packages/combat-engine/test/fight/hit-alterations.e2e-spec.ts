import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const JUDGEMENT = 'Jugement de l’Obsidienne';
const ENEMY_IDS = ['enemy-1', 'enemy-2', 'enemy-3'];

const judgement = (extra: object = {}) => ({
  kind: 'CONDITIONAL_ATTACK',
  name: JUDGEMENT,
  event: 'turn-start',
  targetingStrategy: 'target-all',
  damages: [{ type: 'EARTH', rate: 0.1 }],
  hitAlterations: [
    { type: 'agility', rate: 0.5, duration: 3, polarity: 'debuff' },
  ],
  ...extra,
});

const card = (id: string, others: object[] = []) => ({
  id,
  name: id,
  attack: 100,
  defense: 0,
  health: 100000,
  speed: 100,
  agility: 0,
  accuracy: 1000,
  criticalChance: 0,
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Unused',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      energy: 9999,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: 'Griffe',
      damages: [{ type: 'PHYSICAL', rate: 0.1 }],
      targetingStrategy: 'position-based',
    },
    others,
  },
  behaviors: { dodge: 'simple-dodge' },
});

const payload = (others: object[]) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [card('selkhet', others)] },
  player2: { name: 'P2', deck: ENEMY_IDS.map((id) => card(id)) },
});

describe('CONDITIONAL_ATTACK hitAlterations', () => {
  let app: INestApplication;

  const post = (body: object) =>
    request(app.getHttpServer()).post('/fight').send(body);
  const steps = async (others: object[]) =>
    Object.values((await post(payload(others))).body) as any[];

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

  it('debuffs the agility of every enemy hit', async () => {
    const debuff = (await steps([judgement()])).find(
      (s) => s.kind === 'debuff' && s.name === JUDGEMENT,
    );

    expect(
      debuff.alterations.map((a) => [a.target.id, a.kind, a.remainingTurns]),
    ).toEqual(ENEMY_IDS.map((id) => [id, 'agility', 3]));
  });

  it('reports the debuff right after the attack step', async () => {
    const all = await steps([judgement()]);
    const attack = all.findIndex(
      (s) => s.kind === 'attack' && s.name === JUDGEMENT,
    );

    expect(all[attack + 1]).toEqual(
      expect.objectContaining({ kind: 'debuff', name: JUDGEMENT }),
    );
  });

  it('reports the debuff on the next-action path too', async () => {
    const all = await steps([judgement({ event: 'next-action', interval: 1 })]);

    expect(all).toContainEqual(
      expect.objectContaining({ kind: 'debuff', name: JUDGEMENT }),
    );
  });

  it('returns 400 on a skill kind other than CONDITIONAL_ATTACK', () => {
    return post(
      payload([
        {
          kind: 'ALTERATION',
          name: 'Instinct',
          event: 'turn-end',
          polarity: 'buff',
          buffType: 'speed',
          rate: 0.15,
          duration: 2,
          targetingStrategy: 'self',
          hitAlterations: judgement().hitAlterations,
        },
      ]),
    ).expect(400);
  });

  it('returns 400 on an unknown polarity', () => {
    return post(
      payload([
        judgement({
          hitAlterations: [
            { type: 'agility', rate: 0.5, duration: 3, polarity: 'neutral' },
          ],
        }),
      ]),
    ).expect(400);
  });
});
