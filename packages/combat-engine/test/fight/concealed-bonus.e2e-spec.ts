import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const concealedBonus = { damageType: 'PHYSICAL', multiplier: 1.5 };

const card = (id: string, speed: number, simpleAttack: object = {}) => ({
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
      ...simpleAttack,
    },
    others:
      id === 'selkhet'
        ? [
            {
              kind: 'CONCEALMENT',
              name: 'Marche Fantôme',
              event: 'fight-start',
            },
          ]
        : [],
  },
  behaviors: { dodge: 'simple-dodge' },
});

const payload = (bonus: object) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: {
    name: 'P1',
    deck: [card('selkhet', 1, { concealedBonus: bonus })],
  },
  player2: { name: 'P2', deck: [card('hunter', 50)] },
});

describe('concealedBonus', () => {
  let app: INestApplication;

  const post = (body: object) =>
    request(app.getHttpServer()).post('/fight').send(body);
  const selkhetHits = async (bonus: object | null = concealedBonus) =>
    (Object.values((await post(payload(bonus))).body) as any[])
      .filter((s) => s.kind === 'attack' && s.attacker.id === 'selkhet')
      .map((s) => s.damages[0].damage);

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

  it('boosts the first attack, struck from concealment', async () => {
    const [first] = await selkhetHits();

    expect(first).toBe(150);
  });

  it('no longer boosts the attacks once revealed', async () => {
    const [, second] = await selkhetHits();

    expect(second).toBe(100);
  });

  it('ignores a null concealedBonus instead of failing the fight', async () => {
    const [first] = await selkhetHits(null);

    expect(first).toBe(100);
  });

  it('returns 400 with a multiplier that is not positive', () => {
    return post(payload({ ...concealedBonus, multiplier: 0 })).expect(400);
  });
});
