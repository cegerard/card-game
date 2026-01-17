import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

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
            name: 'Support Paladin',
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
                name: 'Holy Strike',
                rate: 2.0,
                energy: 40,
                targetingStrategy: 'position-based',
              },
              simpleAttack: {
                name: 'Shield Bash',
                damageRate: 1.0,
                targetingStrategy: 'position-based',
              },
              others: [
                {
                  kind: 'BUFF',
                  name: 'Defense Blessing',
                  rate: 0.1,
                  targetingStrategy: 'all-allies',
                  event: 'turn-end',
                  buffType: 'defense',
                  duration: 3,
                },
              ],
            },
            behaviors: {
              dodge: 'simple-dodge',
            },
          },
          {
            name: 'DPS Warrior',
            attack: 120,
            defense: 60,
            health: 150,
            speed: 70,
            agility: 25,
            accuracy: 30,
            criticalChance: 0.15,
            skills: {
              special: {
                kind: 'ATTACK',
                name: 'Power Strike',
                rate: 2.5,
                energy: 50,
                targetingStrategy: 'position-based',
              },
              simpleAttack: {
                name: 'Sword Slash',
                damageRate: 1.2,
                targetingStrategy: 'position-based',
              },
              others: [
                {
                  kind: 'BUFF',
                  name: 'Battle Fury',
                  rate: 0.1,
                  targetingStrategy: 'self',
                  event: 'turn-end',
                  buffType: 'attack',
                  duration: 4,
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
            name: 'Basic Fighter',
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
                name: 'Heavy Strike',
                rate: 2.0,
                energy: 45,
                targetingStrategy: 'position-based',
              },
              simpleAttack: {
                name: 'Basic Attack',
                damageRate: 1.0,
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
            name: 'Archer',
            attack: 100,
            defense: 50,
            health: 140,
            speed: 80,
            agility: 35,
            accuracy: 40,
            criticalChance: 0.2,
            skills: {
              special: {
                kind: 'ATTACK',
                name: 'Multi Shot',
                rate: 1.8,
                energy: 35,
                targetingStrategy: 'target-all',
              },
              simpleAttack: {
                name: 'Arrow Shot',
                damageRate: 1.1,
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
          buffs: [
            {
              kind: 'attack',
              remainingTurns: 4,
              target: {
                deckIdentity: 'Team Buffer-1',
                name: 'DPS Warrior',
              },
              value: 12,
            },
          ],
          energy: 10,
          kind: 'buff',
          source: {
            deckIdentity: 'Team Buffer-1',
            name: 'DPS Warrior',
          },
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
                rate: 2.0,
                energy: 40,
                targetingStrategy: 'position-based',
              },
              simpleAttack: {
                name: 'Test Attack',
                damageRate: 1.0,
                targetingStrategy: 'position-based',
              },
              others: [
                {
                  kind: 'BUFF',
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
                rate: 2.0,
                energy: 45,
                targetingStrategy: 'position-based',
              },
              simpleAttack: {
                name: 'Enemy Attack',
                damageRate: 1.0,
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
      .expect(500); // Should return 500 Internal Server Error due to validation error
  });
});
