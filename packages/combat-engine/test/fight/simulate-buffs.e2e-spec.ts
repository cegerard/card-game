import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const debufferCard = (duration: number) => ({
  id: 'debuffer',
  name: 'Debuffer',
  attack: 150,
  defense: 50,
  health: 1000,
  speed: 50,
  agility: 0,
  accuracy: 100,
  criticalChance: 0,
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Power Strike',
      damages: [{ type: 'PHYSICAL', rate: 2.0 }],
      energy: 1000,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: 'Attack',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
    },
    others: [
      {
        kind: 'ALTERATION',
        name: 'Defense Break',
        rate: 0.3,
        targetingStrategy: 'position-based',
        event: 'turn-end',
        buffType: 'defense',
        duration,
        polarity: 'debuff',
      },
    ],
  },
  behaviors: { dodge: 'simple-dodge' },
});

const tankCard = {
  id: 'tank',
  name: 'Tank',
  attack: 5,
  defense: 100,
  health: 1000,
  speed: 50,
  agility: 0,
  accuracy: 100,
  criticalChance: 0,
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Weak Strike',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      energy: 1000,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: 'Weak Attack',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
};

const buildDebuffFight = (duration: number) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'Debuffer Team', deck: [debufferCard(duration)] },
  player2: { name: 'Defender Team', deck: [tankCard] },
});

describe('Simulate fight with buffs', () => {
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

  it('should handle buff skills in API', () => {
    const fightDataWithBuffs = {
      cardSelectorStrategy: 'player-by-player',
      player1: {
        name: 'Team Buffer',
        deck: [
          {
            id: 'support-paladin',
            name: 'Support Paladin',
            attack: 80,
            defense: 100,
            health: 180,
            speed: 50,
            agility: 20,
            accuracy: 25,
            criticalChance: 0,
            skills: {
              special: {
                kind: 'ATTACK',
                name: 'Holy Strike',
                damages: [{ type: 'PHYSICAL', rate: 2.0 }],
                energy: 40,
                targetingStrategy: 'position-based',
              },
              simpleAttack: {
                name: 'Shield Bash',
                damages: [{ type: 'PHYSICAL', rate: 1 }],
                targetingStrategy: 'position-based',
              },
              others: [
                {
                  kind: 'ALTERATION',
                  name: 'Defense Blessing',
                  rate: 0.1,
                  targetingStrategy: 'all-allies',
                  event: 'turn-end',
                  buffType: 'defense',
                  duration: 3,
                  polarity: 'buff',
                },
              ],
            },
            behaviors: {
              dodge: 'simple-dodge',
            },
          },
          {
            id: 'dps-warrior',
            name: 'DPS Warrior',
            attack: 120,
            defense: 60,
            health: 150,
            speed: 70,
            agility: 25,
            accuracy: 30,
            criticalChance: 0,
            skills: {
              special: {
                kind: 'ATTACK',
                name: 'Power Strike',
                damages: [{ type: 'PHYSICAL', rate: 2.5 }],
                energy: 50,
                targetingStrategy: 'position-based',
              },
              simpleAttack: {
                name: 'Sword Slash',
                damages: [{ type: 'PHYSICAL', rate: 1.2 }],
                targetingStrategy: 'position-based',
              },
              others: [
                {
                  kind: 'ALTERATION',
                  name: 'Battle Fury',
                  rate: 0.1,
                  targetingStrategy: 'self',
                  event: 'turn-end',
                  buffType: 'attack',
                  duration: 4,
                  polarity: 'buff',
                },
              ],
            },
            behaviors: {
              dodge: 'simple-dodge',
            },
          },
        ],
      },
      player2: {
        name: 'Standard Team',
        deck: [
          {
            id: 'basic-fighter',
            name: 'Basic Fighter',
            attack: 90,
            defense: 70,
            health: 160,
            speed: 60,
            agility: 20,
            accuracy: 25,
            criticalChance: 0,
            skills: {
              special: {
                kind: 'ATTACK',
                name: 'Heavy Strike',
                damages: [{ type: 'PHYSICAL', rate: 2.0 }],
                energy: 45,
                targetingStrategy: 'position-based',
              },
              simpleAttack: {
                name: 'Basic Attack',
                damages: [{ type: 'PHYSICAL', rate: 1.0 }],
                targetingStrategy: 'position-based',
              },
              others: [
                {
                  kind: 'HEALING',
                  name: 'Self Heal',
                  rate: 0.5,
                  targetingStrategy: 'self',
                  event: 'turn-end',
                },
              ],
            },
            behaviors: {
              dodge: 'simple-dodge',
            },
          },
          {
            id: 'archer',
            name: 'Archer',
            attack: 100,
            defense: 50,
            health: 140,
            speed: 80,
            agility: 35,
            accuracy: 40,
            criticalChance: 0,
            skills: {
              special: {
                kind: 'ATTACK',
                name: 'Multi Shot',
                damages: [{ type: 'PHYSICAL', rate: 1.8 }],
                energy: 35,
                targetingStrategy: 'target-all',
              },
              simpleAttack: {
                name: 'Arrow Shot',
                damages: [{ type: 'PHYSICAL', rate: 1.1 }],
                targetingStrategy: 'position-based',
              },
              others: [],
            },
            behaviors: {
              dodge: 'simple-dodge',
            },
          },
        ],
      },
    };

    return request(app.getHttpServer())
      .post('/fight')
      .send(fightDataWithBuffs)
      .expect(200)
      .then((res) => {
        expect(res.body[Object.keys(res.body).length].kind).toBe('fight_end');

        expect(res.body[3]).toEqual({
          alterations: [
            {
              kind: 'attack',
              remainingTurns: 4,
              target: {
                id: 'dps-warrior',
                deckIdentity: 'Team Buffer-1',
                name: 'DPS Warrior',
              },
              value: 12,
            },
          ],
          energy: 10,
          kind: 'buff',
          name: 'Battle Fury',
          source: {
            id: 'dps-warrior',
            deckIdentity: 'Team Buffer-1',
            name: 'DPS Warrior',
          },
        });
      });
  });

  describe('ALTERATION skill with polarity debuff (issue #319)', () => {
    let fightResult: Record<string, any>;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/fight')
        .send(buildDebuffFight(5));
      fightResult = res.body;
    });

    it('emits a debuff step at turn-end', () => {
      expect(fightResult[3].kind).toBe('debuff');
    });

    it('debuff targets the defense stat', () => {
      expect(fightResult[3].alterations[0].kind).toBe('defense');
    });

    it('debuff has value of 30% of base defense (30)', () => {
      expect(fightResult[3].alterations[0].value).toBe(30);
    });

    it('subsequent attack deals more damage due to reduced defense', () => {
      expect(fightResult[4].damages[0].damage).toBe(80);
    });
  });

  it('emits a debuff_expired step when debuff duration runs out (issue #321)', () => {
    return request(app.getHttpServer())
      .post('/fight')
      .send(buildDebuffFight(1))
      .expect(200)
      .then((res) => {
        const steps = Object.values(res.body);
        const expiredStep = steps.find(
          (s: any) => s.kind === 'debuff_expired',
        ) as any;
        expect(expiredStep).toMatchObject({
          kind: 'debuff_expired',
          expired: [{ kind: 'defense', value: 30 }],
        });
      });
  });

  it('should validate buff skill parameters', () => {
    const invalidBuffData = {
      cardSelectorStrategy: 'player-by-player',
      player1: {
        name: 'Invalid Team',
        deck: [
          {
            id: 'invalid-buffer',
            name: 'Invalid Buffer',
            attack: 80,
            defense: 100,
            health: 180,
            speed: 50,
            agility: 20,
            accuracy: 25,
            criticalChance: 0.1,
            skills: {
              special: {
                kind: 'ATTACK',
                name: 'Test Strike',
                damages: [{ type: 'PHYSICAL', rate: 2.0 }],
                energy: 40,
                targetingStrategy: 'position-based',
              },
              simpleAttack: {
                name: 'Test Attack',
                damages: [{ type: 'PHYSICAL', rate: 1.0 }],
                targetingStrategy: 'position-based',
              },
              others: [
                {
                  kind: 'ALTERATION',
                  name: 'Invalid Buff',
                  rate: 0,
                  targetingStrategy: 'self',
                  event: 'turn-end',
                },
              ],
            },
            behaviors: {
              dodge: 'simple-dodge',
            },
          },
        ],
      },
      player2: {
        name: 'Enemy',
        deck: [
          {
            id: 'enemy-fighter',
            name: 'Enemy Fighter',
            attack: 90,
            defense: 70,
            health: 160,
            speed: 60,
            agility: 20,
            accuracy: 25,
            criticalChance: 0.1,
            skills: {
              special: {
                kind: 'ATTACK',
                name: 'Enemy Strike',
                damages: [{ type: 'PHYSICAL', rate: 2.0 }],
                energy: 45,
                targetingStrategy: 'position-based',
              },
              simpleAttack: {
                name: 'Enemy Attack',
                damages: [{ type: 'PHYSICAL', rate: 1.0 }],
                targetingStrategy: 'position-based',
              },
              others: [],
            },
            behaviors: {
              dodge: 'simple-dodge',
            },
          },
        ],
      },
    };

    return request(app.getHttpServer())
      .post('/fight')
      .send(invalidBuffData)
      .expect(400);
  });
});
