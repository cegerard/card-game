import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('SURVIVE skill', () => {
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
    await app.close();
  });

  // ── US1: core survival mechanic ──────────────────────────────────────────

  it('accepts SURVIVE skill payload and returns 200', async () => {
    await request(app.getHttpServer())
      .post('/fight')
      .send(buildSurvivePayload())
      .expect(200);
  });

  it('emits a survived step after the fatal attack step', async () => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(buildSurvivePayload())
      .expect(200);

    const stepEntries = Object.entries(response.body) as [string, any][];

    const attackIndex = stepEntries.findIndex(
      ([, s]) =>
        s.kind === 'attack' &&
        s.damages?.some((d: any) => d.defender?.name === 'Kaelion'),
    );
    expect(attackIndex).toBeGreaterThan(-1);

    const survivedIndex = stepEntries.findIndex(
      ([, s]) => s.kind === 'survived' && s.card?.name === 'Kaelion',
    );
    expect(survivedIndex).toBe(attackIndex + 1);
  });

  it('survived step carries the skill name', async () => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(buildSurvivePayload())
      .expect(200);

    const stepEntries = Object.entries(response.body) as [string, any][];
    const survivedStep = stepEntries.find(
      ([, s]) => s.kind === 'survived',
    )?.[1];

    expect(survivedStep?.name).toBe("Earth's Embrace");
  });

  it('no status_change: dead emitted on the intercepted blow', async () => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(buildSurvivePayload())
      .expect(200);

    const stepEntries = Object.entries(response.body) as [string, any][];

    const attackIndex = stepEntries.findIndex(
      ([, s]) =>
        s.kind === 'attack' &&
        s.damages?.some((d: any) => d.defender?.name === 'Kaelion'),
    );
    const nextStep = stepEntries[attackIndex + 1]?.[1];

    expect(nextStep?.kind).not.toBe('status_change');
  });

  it('second fatal blow kills the card normally', async () => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(buildSurvivePayload())
      .expect(200);

    const stepEntries = Object.entries(response.body) as [string, any][];
    const deathSteps = stepEntries.filter(
      ([, s]) =>
        s.kind === 'status_change' &&
        s.status === 'dead' &&
        s.card?.name === 'Kaelion',
    );

    expect(deathSteps).toHaveLength(1);
  });

  it('card without survive dies normally on a fatal blow', async () => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(buildNoSurvivePayload())
      .expect(200);

    const stepEntries = Object.entries(response.body) as [string, any][];
    const hasSurvived = stepEntries.some(([, s]) => s.kind === 'survived');
    const hasDeath = stepEntries.some(
      ([, s]) =>
        s.kind === 'status_change' &&
        s.status === 'dead' &&
        s.card?.name === 'Kaelion',
    );

    expect(hasSurvived).toBe(false);
    expect(hasDeath).toBe(true);
  });

  // ── US2: post-survival buffs via survived event ───────────────────────────

  it('buff steps appear immediately after the survived step', async () => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(buildSurviveWithBuffsPayload())
      .expect(200);

    const stepEntries = Object.entries(response.body) as [string, any][];

    const survivedIndex = stepEntries.findIndex(
      ([, s]) => s.kind === 'survived' && s.card?.name === 'Kaelion',
    );
    expect(survivedIndex).toBeGreaterThan(-1);

    const buffStep1 = stepEntries[survivedIndex + 1]?.[1];
    const buffStep2 = stepEntries[survivedIndex + 2]?.[1];

    expect(buffStep1?.kind).toBe('buff');
    expect(buffStep2?.kind).toBe('buff');
  });

  it('defense buff is applied to the surviving card', async () => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(buildSurviveWithBuffsPayload())
      .expect(200);

    const stepEntries = Object.entries(response.body) as [string, any][];
    const survivedIndex = stepEntries.findIndex(
      ([, s]) => s.kind === 'survived' && s.card?.name === 'Kaelion',
    );
    const buffSteps = stepEntries
      .slice(survivedIndex + 1)
      .filter(([, s]) => s.kind === 'buff')
      .map(([, s]) => s);

    const defenseBuffStep = buffSteps.find((s) =>
      s.alterations?.some((a: any) => a.kind === 'defense'),
    );
    expect(defenseBuffStep).toBeDefined();
  });

  it('buffs expire after the surviving card completes its next turn', async () => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(buildSurviveWithBuffsPayload())
      .expect(200);

    const stepEntries = Object.entries(response.body) as [string, any][];

    const buffExpiredSteps = stepEntries.filter(
      ([, s]) => s.kind === 'buff_expired' && s.card?.name === 'Kaelion',
    );
    expect(buffExpiredSteps.length).toBeGreaterThan(0);
  });
});

// ── Payload builders ──────────────────────────────────────────────────────

function buildAttacker() {
  return {
    id: 'arionis',
    name: 'Arionis',
    attack: 500,
    defense: 0,
    health: 5000,
    speed: 100,
    agility: 0,
    accuracy: 100,
    criticalChance: 0,
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Super Attack',
        damages: [{ type: 'PHYSICAL', rate: 1 }],
        energy: 9999,
        targetingStrategy: 'position-based',
      },
      simpleAttack: {
        name: 'Strike',
        damages: [{ type: 'PHYSICAL', rate: 1 }],
        targetingStrategy: 'position-based',
      },
      others: [],
    },
    behaviors: { dodge: 'simple-dodge' },
  };
}

function buildKaelionBase(others: object[]) {
  return {
    id: 'kaelion',
    name: 'Kaelion',
    attack: 1,
    defense: 0,
    health: 100,
    speed: 100,
    agility: 0,
    accuracy: 100,
    criticalChance: 0,
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Weak Special',
        damages: [{ type: 'PHYSICAL', rate: 0.01 }],
        energy: 9999,
        targetingStrategy: 'position-based',
      },
      simpleAttack: {
        name: 'Weak Strike',
        damages: [{ type: 'PHYSICAL', rate: 0.01 }],
        targetingStrategy: 'position-based',
      },
      others,
    },
    behaviors: { dodge: 'simple-dodge' },
  };
}

function buildSurvivePayload() {
  return {
    cardSelectorStrategy: 'player-by-player',
    player1: { name: 'Attacker', deck: [buildAttacker()] },
    player2: {
      name: 'Kaelion Team',
      deck: [
        buildKaelionBase([
          {
            kind: 'SURVIVE',
            name: "Earth's Embrace",
            targetingStrategy: 'self',
          },
        ]),
      ],
    },
  };
}

function buildNoSurvivePayload() {
  return {
    cardSelectorStrategy: 'player-by-player',
    player1: { name: 'Attacker', deck: [buildAttacker()] },
    player2: {
      name: 'Kaelion Team',
      deck: [buildKaelionBase([])],
    },
  };
}

function buildSurviveWithBuffsPayload() {
  // Kaelion defense=250 so the +100% defense buff (=+250) brings actual defense to 500,
  // matching Arionis attack=500 → 0 damage on turn 2, letting Kaelion survive until
  // the buff expires at turn 2 end.
  const kaelion = {
    ...buildKaelionBase([
      {
        kind: 'SURVIVE',
        name: "Earth's Embrace",
        targetingStrategy: 'self',
      },
      {
        kind: 'ALTERATION',
        name: "Earth's Embrace",
        event: 'survived',
        buffType: 'defense',
        rate: 1.0,
        duration: 1,
        targetingStrategy: 'self',
        polarity: 'buff',
      },
      {
        kind: 'ALTERATION',
        name: "Earth's Embrace",
        event: 'survived',
        buffType: 'attack',
        rate: 1.5,
        duration: 1,
        targetingStrategy: 'self',
        polarity: 'buff',
      },
    ]),
    defense: 250,
  };

  return {
    cardSelectorStrategy: 'player-by-player',
    player1: { name: 'Attacker', deck: [buildAttacker()] },
    player2: { name: 'Kaelion Team', deck: [kaelion] },
  };
}
