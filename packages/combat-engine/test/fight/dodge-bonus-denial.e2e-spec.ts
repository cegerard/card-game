import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const card = (id: string, stats: object, attackEffects = [], others = []) => ({
  id,
  name: id,
  attack: 100,
  defense: 0,
  health: 100000,
  speed: 10,
  agility: 0,
  accuracy: 0,
  criticalChance: 0,
  element: 'PHYSICAL',
  ...stats,
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      energy: 1000,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: 'Lacération du Zéphyr',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
      effects: attackEffects,
    },
    others,
  },
  behaviors: { dodge: 'simple-dodge' },
});

const bleed = { type: 'BLEED', rate: 0.05, duration: 10, maxStacks: 8 };
const aeroTracker = { kind: 'DODGE_BONUS_DENIAL', name: 'Aéro-traqueur' };
// Doubles the prey agility at the first turn end: 50 → 100, above the 80
// accuracy of the tracker.
const evasion = {
  kind: 'ALTERATION',
  name: 'Évasion',
  event: 'turn-end',
  polarity: 'buff',
  buffType: 'agility',
  rate: 1.0,
  duration: 0,
  targetingStrategy: 'self',
  activationLimit: 1,
};

const payload = (trackerOthers: object[]) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: {
    name: 'P1',
    deck: [card('scythra', { accuracy: 80 }, [bleed], trackerOthers)],
  },
  player2: { name: 'P2', deck: [card('prey', { agility: 50 }, [], [evasion])] },
});

describe('DODGE_BONUS_DENIAL skill', () => {
  let app: INestApplication;

  const dodges = async (trackerOthers: object[]) => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(payload(trackerOthers));

    return (Object.values(response.body) as any[])
      .filter((s) => s.kind === 'attack' && s.attacker?.name === 'scythra')
      .slice(0, 4)
      .map((s) => s.damages[0].dodge);
  };

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

  it('lets a buffed prey dodge an ordinary attacker', async () => {
    expect(await dodges([])).toEqual([false, true, true, true]);
  });

  it('denies the agility bonus of a bleeding prey', async () => {
    expect(await dodges([aeroTracker])).toEqual([false, false, false, false]);
  });
});
