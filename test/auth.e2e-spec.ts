import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { Role } from '@prisma/client';

function generateRandomEmail(): string {
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${randomString}@example.com`;
}

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

  afterAll(async () => {
    await databaseService.$disconnect();
    await app.close();
  });

  it('registers a user if the payload is valid', async () => {
    const payload = {
      first_name: 'Ife',
      last_name: 'Olubo',
      email: generateRandomEmail(),
      password: 'somepassword123',
      role: 'ADMIN',
    };
    return request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(payload)
      .expect(201);
  });

  it('throws BAD REQUEST error if first name is empty', async () => {
    const payload = {
      first_name: '',
      last_name: 'Olubo',
      email: generateRandomEmail(),
      password: 'somepassword123',
      role: 'ADMIN',
    };
    return request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(payload)
      .expect(400);
  });

  it('throws BAD REQUEST error if last name is empty', async () => {
    const payload = {
      first_name: 'Ife',
      last_name: '',
      email: generateRandomEmail(),
      password: 'somepassword123',
      role: 'ADMIN',
    };
    return request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(payload)
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
    const payload = {
      first_name: 'Ife',
      last_name: 'Olubo',
      email: generateRandomEmail(),
      password: 'some',
      role: 'ADMIN',
    };
    return request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(payload)
      .expect(400);
  });

  it('throws BAD REQUEST error if password does not contain a number', async () => {
    const payload = {
      first_name: 'Ife',
      last_name: 'Olubo',
      email: generateRandomEmail(),
      password: 'somepassword',
      role: 'ADMIN',
    };
    return request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(payload)
      .expect(400);
  });

  it('throws BAD REQUEST error if invalid role is passed', async () => {
    const payload = {
      first_name: 'Ife',
      last_name: 'Olubo',
      email: generateRandomEmail(),
      password: 'somepassword123',
      role: 'BUYER',
    };
    return request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(payload)
      .expect(400);
  });

  it('login a user and defaults to CUSTOMER if role was not provided', async () => {
    const payload = {
      first_name: 'Ife',
      last_name: 'Olubo',
      email: generateRandomEmail(),
      password: 'somepassword123',
    };
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(payload)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: payload.email, password: payload.password })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.role).toBe(Role.CUSTOMER);
  });

  it('throws error on login if password is not correct', async () => {
    const payload = {
      first_name: 'Ife',
      last_name: 'Olubo',
      email: generateRandomEmail(),
      password: 'somepassword123',
      role: 'ADMIN',
    };
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: payload.email, password: 'somepassword12' })
      .expect(401);
  });

  it('throws error on login if email is not correct', async () => {
    const payload = {
      first_name: 'Ife',
      last_name: 'Olubo',
      email: generateRandomEmail(),
      password: 'somepassword123',
      role: 'ADMIN',
    };
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: `random${payload.email}`, password: payload.password })
      .expect(401);
  });

  it('throws 409 if email already exists', async () => {
    const payload = {
      first_name: 'Ife',
      last_name: 'Olubo',
      email: generateRandomEmail(),
      password: 'somepassword123',
      role: 'ADMIN',
    };
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(payload)
      .expect(409);
  });
});
