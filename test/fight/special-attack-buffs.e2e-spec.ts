import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Special Attack with Buffs (e2e)', () => {
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

  it('POST /fight - should apply buffs after special attack and increase stats in subsequent turns', () => {
    const fightData = {
      cardSelectorStrategy: 'player-by-player',
      player1: {
        name: 'Player 1',
        deck: [
          {
            name: 'Attacker with Buff',
            attack: 100,
            defense: 0,
            health: 200,
            speed: 100,
            agility: 50,
            accuracy: 50,
            criticalChance: 0,
            skills: {
              simpleAttack: {
                name: 'Simple Attack',
                damages: [{ type: 'PHYSICAL', rate: 1.0 }],
                targetingStrategy: 'position-based',
              },
              special: {
                kind: 'ATTACK',
                name: 'Buff Special',
                rate: 1.0,
                energy: 0,
                targetingStrategy: 'target-all',
                buffApplication: {
                  type: 'attack',
                  rate: 0.2,
                  duration: 3,
                  targetingStrategy: 'all-owner-cards',
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
            name: 'Defender',
            attack: 0,
            defense: 0,
            health: 500,
            speed: 1,
            agility: 50,
            accuracy: 50,
            criticalChance: 0,
            skills: {
              simpleAttack: {
                name: 'Simple Attack',
                damages: [{ type: 'PHYSICAL', rate: 1.0 }],
                targetingStrategy: 'position-based',
              },
              special: {
                kind: 'ATTACK',
                name: 'Special',
                rate: 1.0,
                energy: 100,
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
      .send(fightData)
      .expect(200)
      .then((response) => {
        const result = response.body;

        expect(result['1']).toMatchObject({
          kind: 'special_attack',
          attacker: {
            name: 'Attacker with Buff',
            deckIdentity: 'Player 1-0',
          },
          damages: [
            {
              defender: {
                name: 'Defender',
                deckIdentity: 'Player 2-0',
              },
              damage: 100,
              isCritical: false,
              dodge: false,
              remainingHealth: 400,
            },
          ],
          energy: 0,
        });

        expect(result['2']).toMatchObject({
          kind: 'buff',
          source: {
            name: 'Attacker with Buff',
            deckIdentity: 'Player 1-0',
          },
          buffs: [
            {
              target: {
                name: 'Attacker with Buff',
                deckIdentity: 'Player 1-0',
              },
              kind: 'attack',
              value: 20,
              remainingTurns: 3,
            },
          ],
          energy: 0,
        });

        expect(result['3']).toMatchObject({
          kind: 'attack',
          attacker: {
            name: 'Defender',
            deckIdentity: 'Player 2-0',
          },
        });

        expect(result['4']).toMatchObject({
          kind: 'special_attack',
          attacker: {
            name: 'Attacker with Buff',
            deckIdentity: 'Player 1-0',
          },
          damages: [
            {
              defender: {
                name: 'Defender',
                deckIdentity: 'Player 2-0',
              },
              damage: 120,
              isCritical: false,
              dodge: false,
            },
          ],
        });
      });
  });
});
