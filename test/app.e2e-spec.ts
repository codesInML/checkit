import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DatabaseService } from 'src/database/database.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    databaseService = app.get(DatabaseService);
    await databaseService.$connect();
  });

  afterAll(async () => {
    await databaseService.$disconnect();
    await app.close();
  });

  it('/ (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    expect(response.body.message).toEqual('Welcome to Checkit API 🚀');
  });
});
