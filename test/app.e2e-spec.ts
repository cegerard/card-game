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
            damage: 10,
            defense: 15,
            health: 100,
            speed: 3,
            criticalChance: 0.05,
          },
        ],
      },
      player2: {
        name: 'Player 2',
        deck: [
          {
            name: 'Sword',
            damage: 11,
            defense: 14,
            health: 100,
            speed: 2,
            criticalChance: 0.04,
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
