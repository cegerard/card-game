import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Simulate fight', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('runs to the end', () => {
    const fightData = {
      cardSelectorStrategy: 'player-by-player',
      player1: {
        name: 'Player 1',
        deck: [
          {
            name: 'Axe',
            attack: 10,
            defense: 6,
            health: 100,
            speed: 3,
            agility: 25,
            accuracy: 15,
            criticalChance: 0.05,
            skills: {
              special: {
                kind: 'ATTACK',
                name: 'Double Strike',
                rate: 2.0,
                energy: 100,
                targetingStrategy: 'target-all',
                effect: {
                  type: 'POISON',
                  rate: 0.5,
                  level: 2,
                },
              },
              simpleAttack: {
                name: 'Simple Attack',
                damageRate: 1.0,
                targetingStrategy: 'position-based',
                effect: {
                  type: 'BURN',
                  rate: 0.2,
                  level: 3,
                },
              },
              others: [
                {
                  kind: 'HEALING',
                  name: 'Heal',
                  rate: 0.3,
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
            name: 'Hammer',
            attack: 10,
            defense: 6,
            health: 100,
            speed: 3,
            agility: 25,
            accuracy: 15,
            criticalChance: 0.05,
            skills: {
              special: {
                kind: 'ATTACK',
                name: 'Double Strike',
                rate: 2.0,
                energy: 100,
                targetingStrategy: 'all-owner-cards',
                effect: {
                  type: 'BURN',
                  rate: 0.1,
                  level: 1,
                },
              },
              simpleAttack: {
                name: 'Simple Attack',
                damageRate: 1.0,
                targetingStrategy: 'position-based',
                effect: {
                  type: 'FREEZE',
                  rate: 0.35,
                  level: 2,
                },
              },
              others: [],
            },
            behaviors: {
              dodge: 'simple-dodge',
            },
          },
        ],
      },
      player2: {
        name: 'Player 2',
        deck: [
          {
            name: 'Sword',
            attack: 11,
            defense: 5,
            health: 100,
            speed: 2,
            agility: 20,
            accuracy: 18,
            criticalChance: 0.04,
            skills: {
              special: {
                kind: 'ATTACK',
                name: 'Double Strike',
                rate: 2.0,
                energy: 100,
                targetingStrategy: 'line-three',
                effect: {
                  type: 'FREEZE',
                  rate: 0.2,
                  level: 1,
                },
              },
              simpleAttack: {
                name: 'Simple Attack',
                damageRate: 1.0,
                targetingStrategy: 'position-based',
                effect: {
                  type: 'POISON',
                  rate: 0.5,
                  level: 1,
                },
              },
              others: [],
            },
            behaviors: {
              dodge: 'random-dodge',
            },
          },
          {
            name: 'Priest',
            attack: 11,
            defense: 5,
            health: 100,
            speed: 2,
            agility: 20,
            accuracy: 18,
            criticalChance: 0.04,
            skills: {
              special: {
                kind: 'HEALING',
                name: 'Cure',
                rate: 2.0,
                energy: 100,
                targetingStrategy: 'all-allies',
              },
              simpleAttack: {
                name: 'Suicide',
                damageRate: 0,
                targetingStrategy: 'self',
              },
              others: [],
            },
            behaviors: {
              dodge: 'random-dodge',
            },
          },
        ],
      },
    };

    return request(app.getHttpServer())
      .post('/fight')
      .send(fightData)
      .expect(200)
      .expect((res) => {
        expect(res.body[Object.keys(res.body).length].kind).toBe('fight_end');
      });
  });
});
