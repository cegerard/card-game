import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Targeted Card Strategy — Full Battle Flow', () => {
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
      .send(buildTargetedCardBattlePayload())
      .expect(200);

    stepEntries = Object.entries(response.body) as [string, any][];
  });

  afterEach(async () => {
    await app.close();
  });

  it('produces a targeting_override step after ally dies', () => {
    const overrideIdx = stepEntries.findIndex(
      ([, s]) =>
        s.kind === 'targeting_override' &&
        s.source?.name === 'Avenger' &&
        s.newStrategy === 'targeted-card',
    );

    expect(overrideIdx).toBeGreaterThan(-1);
  });

  it('avenger attacks target enemy after override activates', () => {
    const overrideIdx = stepEntries.findIndex(
      ([, s]) =>
        s.kind === 'targeting_override' && s.source?.name === 'Avenger',
    );
    const slicedEntries = stepEntries.slice(overrideIdx + 1);
    const attackRelIdx = slicedEntries.findIndex(
      ([, s]) =>
        s.kind === 'attack' &&
        s.attacker?.name === 'Avenger' &&
        s.damages?.length > 0,
    );

    expect(slicedEntries[attackRelIdx][1].damages[0].defender.name).toBe(
      'Target',
    );
  });
});

describe('Targeted Card Strategy — Validation (US3)', () => {
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

  it('rejects targeted-card in SimpleAttackDto.targetingStrategy with 400', async () => {
    const card = buildMinimalCard({
      skills: {
        special: {
          kind: 'ATTACK',
          name: 'Special',
          rate: 2.0,
          energy: 100,
          targetingStrategy: 'position-based',
        },
        simpleAttack: {
          name: 'Attack',
          damages: [{ type: 'PHYSICAL', rate: 1.0 }],
          targetingStrategy: 'targeted-card',
        },
        others: [],
      },
    });

    await request(app.getHttpServer())
      .post('/fight')
      .send(buildPayload([card]))
      .expect(400);
  });

  it('rejects targeted-card in SpecialDto.targetingStrategy with 400', async () => {
    const card = buildMinimalCard({
      skills: {
        special: {
          kind: 'ATTACK',
          name: 'Special',
          rate: 2.0,
          energy: 100,
          targetingStrategy: 'targeted-card',
        },
        simpleAttack: {
          name: 'Attack',
          damages: [{ type: 'PHYSICAL', rate: 1.0 }],
          targetingStrategy: 'position-based',
        },
        others: [],
      },
    });

    await request(app.getHttpServer())
      .post('/fight')
      .send(buildPayload([card]))
      .expect(400);
  });

  it('rejects targeted-card in BuffApplicationDto.targetingStrategy with 400', async () => {
    const card = buildMinimalCard({
      skills: {
        special: {
          kind: 'ATTACK',
          name: 'Special',
          rate: 2.0,
          energy: 100,
          targetingStrategy: 'position-based',
          buffApplication: [
            {
              type: 'attack',
              rate: 0.1,
              duration: 2,
              targetingStrategy: 'targeted-card',
            },
          ],
        },
        simpleAttack: {
          name: 'Attack',
          damages: [{ type: 'PHYSICAL', rate: 1.0 }],
          targetingStrategy: 'position-based',
        },
        others: [],
      },
    });

    await request(app.getHttpServer())
      .post('/fight')
      .send(buildPayload([card]))
      .expect(400);
  });

  it('rejects targeted-card in non-TARGETING_OVERRIDE OtherSkillDto with 400', async () => {
    const card = buildMinimalCard({
      skills: {
        special: {
          kind: 'ATTACK',
          name: 'Special',
          rate: 2.0,
          energy: 100,
          targetingStrategy: 'position-based',
        },
        simpleAttack: {
          name: 'Attack',
          damages: [{ type: 'PHYSICAL', rate: 1.0 }],
          targetingStrategy: 'position-based',
        },
        others: [
          {
            kind: 'HEALING',
            name: 'Heal',
            rate: 0.3,
            targetingStrategy: 'targeted-card',
            event: 'turn-end',
          },
        ],
      },
    });

    await request(app.getHttpServer())
      .post('/fight')
      .send(buildPayload([card]))
      .expect(400);
  });

  it('accepts targeted-card in TARGETING_OVERRIDE OtherSkillDto without targetedCardId (200)', async () => {
    const card = buildMinimalCard({
      id: 'attacker',
      skills: {
        special: {
          kind: 'ATTACK',
          name: 'Special',
          rate: 2.0,
          energy: 100,
          targetingStrategy: 'position-based',
        },
        simpleAttack: {
          name: 'Attack',
          damages: [{ type: 'PHYSICAL', rate: 1.0 }],
          targetingStrategy: 'position-based',
        },
        others: [
          {
            kind: 'TARGETING_OVERRIDE',
            name: 'Vengeance',
            targetingStrategy: 'targeted-card',
            event: 'ally-death',
            targetCardId: 'non-existent-ally',
            terminationEvent: 'end-event',
          },
        ],
      },
    });

    await request(app.getHttpServer())
      .post('/fight')
      .send(buildPayload([card]))
      .expect(200);
  });
});

function buildTargetedCardBattlePayload() {
  return {
    cardSelectorStrategy: 'player-by-player',
    player1: {
      name: 'Team Avenger',
      deck: [
        {
          id: 'protector',
          name: 'Protector',
          attack: 50,
          defense: 0,
          health: 1,
          speed: 50,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Shield Bash',
              rate: 1,
              energy: 9999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Poke',
              damages: [{ type: 'PHYSICAL', rate: 1.0 }],
              targetingStrategy: 'position-based',
            },
            others: [],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
        {
          id: 'avenger',
          name: 'Avenger',
          attack: 500,
          defense: 100,
          health: 10000,
          speed: 100,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Vengeance Strike',
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
                name: 'Rage Buff',
                rate: 0.5,
                targetingStrategy: 'self',
                event: 'ally-death',
                targetCardId: 'protector',
                buffType: 'attack',
                duration: 0,
                terminationEvent: 'vengeance-end',
                activationLimit: 2,
                endEvent: 'vengeance-end',
                powerId: 'vengeance',
              },
              {
                kind: 'TARGETING_OVERRIDE',
                name: 'Lock On',
                targetingStrategy: 'targeted-card',
                event: 'ally-death',
                targetCardId: 'protector',
                terminationEvent: 'vengeance-end',
                powerId: 'vengeance',
              },
            ],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
      ],
    },
    player2: {
      name: 'Team Enemy',
      deck: [
        {
          id: 'target-enemy',
          name: 'Target',
          attack: 500,
          defense: 50,
          health: 3000,
          speed: 50,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Smash',
              rate: 2,
              energy: 9999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Hit',
              damages: [{ type: 'PHYSICAL', rate: 1.0 }],
              targetingStrategy: 'position-based',
            },
            others: [],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
        {
          id: 'distractor',
          name: 'Distractor',
          attack: 50,
          defense: 50,
          health: 10000,
          speed: 50,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Distract',
              rate: 1,
              energy: 9999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Tap',
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

function buildMinimalCard(overrides: any = {}) {
  return {
    id: 'card-1',
    name: 'Card',
    attack: 100,
    defense: 50,
    health: 500,
    speed: 50,
    agility: 20,
    accuracy: 30,
    criticalChance: 0.05,
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Special',
        rate: 2.0,
        energy: 100,
        targetingStrategy: 'position-based',
      },
      simpleAttack: {
        name: 'Attack',
        damages: [{ type: 'PHYSICAL', rate: 1.0 }],
        targetingStrategy: 'position-based',
      },
      others: [],
    },
    behaviors: { dodge: 'simple-dodge' },
    ...overrides,
  };
}

function buildPayload(player1Cards: any[], player2Cards: any[] = []) {
  if (player2Cards.length === 0) {
    player2Cards = [buildMinimalCard({ id: 'enemy-1', name: 'Enemy' })];
  }
  return {
    cardSelectorStrategy: 'player-by-player',
    player1: { name: 'P1', deck: player1Cards },
    player2: { name: 'P2', deck: player2Cards },
  };
}
