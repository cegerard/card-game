import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Composite Power — grouped skills activate together', () => {
  let app: INestApplication;
  let stepEntries: [string, any][];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(buildCompositePowerPayload())
      .expect(200);

    stepEntries = Object.entries(response.body) as [string, any][];
  });

  afterEach(async () => {
    await app.close();
  });

  it('produces a buff step with powerId from composite power', () => {
    const buffStep = stepEntries.find(
      ([, s]) => s.kind === 'buff' && s.powerId === 'rage-power',
    );

    expect(buffStep).toBeDefined();
  });

  it('produces a healing step with powerId from composite power', () => {
    const healingStep = stepEntries.find(
      ([, s]) =>
        s.kind === 'healing' &&
        s.powerId === 'rage-power' &&
        s.source?.name === 'Rager',
    );

    expect(healingStep).toBeDefined();
  });

  it('buff and healing steps from same power appear on the same turn', () => {
    const buffIdx = stepEntries.findIndex(
      ([, s]) => s.kind === 'buff' && s.powerId === 'rage-power',
    );
    const healingIdx = stepEntries.findIndex(
      ([, s]) =>
        s.kind === 'healing' &&
        s.powerId === 'rage-power' &&
        s.source?.name === 'Rager',
    );

    expect(Math.abs(buffIdx - healingIdx)).toBeLessThanOrEqual(2);
  });
});

describe('Composite Power — expiration removes all grouped buffs', () => {
  let app: INestApplication;
  let stepEntries: [string, any][];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(buildCompositePowerPayload())
      .expect(200);

    stepEntries = Object.entries(response.body) as [string, any][];
  });

  afterEach(async () => {
    await app.close();
  });

  it('produces a buff_removed step with powerId after activationLimit', () => {
    const buffRemovedStep = stepEntries.find(
      ([, s]) => s.kind === 'buff_removed' && s.powerId === 'rage-power',
    );

    expect(buffRemovedStep).toBeDefined();
  });

  it('buff_removed step has eventName matching endEvent', () => {
    const buffRemovedStep = stepEntries.find(
      ([, s]) => s.kind === 'buff_removed' && s.powerId === 'rage-power',
    );

    expect(buffRemovedStep[1].eventName).toBe('rage-end');
  });

  it('no rage-power buff steps appear after buff_removed', () => {
    const buffRemovedIdx = stepEntries.findIndex(
      ([, s]) => s.kind === 'buff_removed' && s.powerId === 'rage-power',
    );
    const laterBuffs = stepEntries
      .slice(buffRemovedIdx + 1)
      .filter(([, s]) => s.kind === 'buff' && s.powerId === 'rage-power');

    expect(laterBuffs).toHaveLength(0);
  });
});

describe('Composite Power — targeting override and revert', () => {
  let app: INestApplication;
  let stepEntries: [string, any][];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(buildTargetingOverridePayload())
      .expect(200);

    stepEntries = Object.entries(response.body) as [string, any][];
  });

  afterEach(async () => {
    await app.close();
  });

  it('produces a targeting_override step with powerId', () => {
    const overrideStep = stepEntries.find(
      ([, s]) => s.kind === 'targeting_override' && s.powerId === 'fury-power',
    );

    expect(overrideStep).toBeDefined();
  });

  it('produces a targeting_reverted step after expiration', () => {
    const revertStep = stepEntries.find(
      ([, s]) => s.kind === 'targeting_reverted' && s.powerId === 'fury-power',
    );

    expect(revertStep).toBeDefined();
  });

  it('targeting_reverted step has correct event name', () => {
    const revertStep = stepEntries.find(
      ([, s]) => s.kind === 'targeting_reverted' && s.powerId === 'fury-power',
    );

    expect(revertStep[1].eventName).toBe('fury-end');
  });

  it('all composite power step types carry powerId', () => {
    const powerStepKinds = stepEntries
      .filter(([, s]) => s.powerId === 'fury-power')
      .map(([, s]) => s.kind);
    const uniqueKinds = [...new Set(powerStepKinds)];

    expect(uniqueKinds).toContain('buff');
    expect(uniqueKinds).toContain('targeting_override');
    expect(uniqueKinds).toContain('buff_removed');
    expect(uniqueKinds).toContain('targeting_reverted');
  });
});

function buildTargetingOverridePayload() {
  return {
    cardSelectorStrategy: 'player-by-player',
    player1: {
      name: 'Team Fury',
      deck: [
        {
          id: 'fury-card',
          name: 'FuryCard',
          attack: 200,
          defense: 50,
          health: 5000,
          speed: 100,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Fury Burst',
              rate: 3,
              energy: 9999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Slash',
              damages: [{ type: 'PHYSICAL', rate: 1.0 }],
              targetingStrategy: 'position-based',
            },
            others: [
              {
                kind: 'BUFF',
                name: 'Fury Buff',
                rate: 0.2,
                targetingStrategy: 'self',
                event: 'turn-end',
                buffType: 'attack',
                duration: 0,
                terminationEvent: 'fury-end',
                activationLimit: 2,
                endEvent: 'fury-end',
                powerId: 'fury-power',
              },
              {
                kind: 'TARGETING_OVERRIDE',
                name: 'Fury Targeting',
                targetingStrategy: 'target-all',
                event: 'turn-end',
                terminationEvent: 'fury-end',
                powerId: 'fury-power',
              },
            ],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
      ],
    },
    player2: {
      name: 'Team Defender',
      deck: [
        {
          id: 'tank-1',
          name: 'Tank1',
          attack: 50,
          defense: 100,
          health: 10000,
          speed: 50,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Bash',
              rate: 2,
              energy: 9999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Punch',
              damages: [{ type: 'PHYSICAL', rate: 1.0 }],
              targetingStrategy: 'position-based',
            },
            others: [],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
      ],
    },
  };
}

function buildCompositePowerPayload() {
  return {
    cardSelectorStrategy: 'player-by-player',
    player1: {
      name: 'Team Rage',
      deck: [
        {
          id: 'rager',
          name: 'Rager',
          attack: 200,
          defense: 50,
          health: 5000,
          speed: 100,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Rage Burst',
              rate: 3,
              energy: 9999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Slash',
              damages: [{ type: 'PHYSICAL', rate: 1.0 }],
              targetingStrategy: 'position-based',
            },
            others: [
              {
                kind: 'BUFF',
                name: 'Rage Attack Boost',
                rate: 0.25,
                targetingStrategy: 'self',
                event: 'turn-end',
                buffType: 'attack',
                duration: 0,
                terminationEvent: 'rage-end',
                activationLimit: 3,
                endEvent: 'rage-end',
                powerId: 'rage-power',
              },
              {
                kind: 'HEALING',
                name: 'Rage Heal',
                rate: 0.1,
                targetingStrategy: 'self',
                event: 'turn-end',
                terminationEvent: 'rage-end',
                powerId: 'rage-power',
              },
            ],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
      ],
    },
    player2: {
      name: 'Team Defender',
      deck: [
        {
          id: 'tank',
          name: 'Tank',
          attack: 50,
          defense: 100,
          health: 10000,
          speed: 50,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Shield Bash',
              rate: 2,
              energy: 9999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Punch',
              damages: [{ type: 'PHYSICAL', rate: 1.0 }],
              targetingStrategy: 'position-based',
            },
            others: [],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
      ],
    },
  };
}
