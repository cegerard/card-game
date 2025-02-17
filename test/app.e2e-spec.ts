import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/fight (POST)', () => {
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
              },
              simpleAttack: {
                name: 'Simple Attack',
                damageRate: 1.0,
                targetingStrategy: 'position-based',
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
                targetingStrategy: 'all-owner-card',
              },
              simpleAttack: {
                name: 'Simple Attack',
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
              },
              simpleAttack: {
                name: 'Simple Attack',
                damageRate: 1.0,
                targetingStrategy: 'position-based',
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
