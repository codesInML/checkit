import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { Role } from '@prisma/client';

describe('Authentication endpoints', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    databaseService = app.get(DatabaseService);
    await databaseService.$connect();
  });

  beforeEach(async () => {
    await databaseService.user.deleteMany();
  });

  afterAll(async () => {
    await databaseService.$disconnect();
    await app.close();
  });

  it('registers a user if the payload is valid', async () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        first_name: 'Ife',
        last_name: 'Olubo',
        email: 'ife@olubo.com',
        password: 'somepassword123',
        role: 'ADMIN',
      })
      .expect(201);
  });

  it('throws BAD REQUEST error if first name is empty', async () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        first_name: '',
        last_name: 'Olubo',
        email: 'ife@olubo.com',
        password: 'somepassword123',
        role: 'ADMIN',
      })
      .expect(400);
  });

  it('throws BAD REQUEST error if last name is empty', async () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        first_name: 'Ife',
        last_name: '',
        email: 'ife@olubo.com',
        password: 'somepassword123',
        role: 'ADMIN',
      })
      .expect(400);
  });

  it('throws BAD REQUEST error if not valid email', async () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        first_name: 'Ife',
        last_name: 'Olubo',
        email: 'ife',
        password: 'somepassword123',
        role: 'ADMIN',
      })
      .expect(400);
  });

  it('throws BAD REQUEST error if password is less than 8', async () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        first_name: 'Ife',
        last_name: 'Olubo',
        email: 'ife@olubo.com',
        password: 'some',
        role: 'ADMIN',
      })
      .expect(400);
  });

  it('throws BAD REQUEST error if password does not contain a number', async () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        first_name: 'Ife',
        last_name: 'Olubo',
        email: 'ife@olubo.com',
        password: 'somepassword',
        role: 'ADMIN',
      })
      .expect(400);
  });

  it('throws BAD REQUEST error if invalid role is passed', async () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        first_name: 'Ife',
        last_name: 'Olubo',
        email: 'ife@olubo.com',
        password: 'somepassword123',
        role: 'BUYER',
      })
      .expect(400);
  });

  it('login a user and defaults to CUSTOMER if role was not provided', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        first_name: 'Ife',
        last_name: 'Olubo',
        email: 'ife@olubo.com',
        password: 'somepassword123',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'ife@olubo.com', password: 'somepassword123' })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.role).toBe(Role.CUSTOMER);
  });

  it('throws 409 if email already exists', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        first_name: 'Ife',
        last_name: 'Olubo',
        email: 'ife@olubo.com',
        password: 'somepassword123',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        first_name: 'Ife',
        last_name: 'Olubo',
        email: 'ife@olubo.com',
        password: 'somepassword123',
      })
      .expect(409);
  });
});
