import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { Role } from '@prisma/client';

type UserWithAccessToken = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: Role;
  access_token?: string;
};

function generateRandomEmail(): string {
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${randomString}@example.com`;
}

describe('Order endpoints', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let customer1: UserWithAccessToken;
  let admin1: UserWithAccessToken;
  let customer2: UserWithAccessToken;

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

    customer1 = {
      first_name: 'Ife',
      last_name: 'Olubo',
      email: generateRandomEmail(),
      password: 'somepassword123',
      role: 'CUSTOMER',
    };
    admin1 = {
      first_name: 'Ife',
      last_name: 'Olubo',
      email: generateRandomEmail(),
      password: 'somepassword123',
      role: 'ADMIN',
    };
    customer2 = {
      first_name: 'Ife',
      last_name: 'Olubo',
      email: generateRandomEmail(),
      password: 'somepassword123',
      role: 'CUSTOMER',
    };

    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(customer1)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(admin1)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(customer2)
      .expect(201);

    let customerLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: customer1.email,
        password: customer1.password,
      })
      .expect(200);
    customer1.access_token = customerLoginResponse.body.accessToken;

    customerLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: customer2.email,
        password: customer2.password,
      })
      .expect(200);
    customer2.access_token = customerLoginResponse.body.accessToken;

    let adminLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: admin1.email,
        password: admin1.password,
      })
      .expect(200);
    admin1.access_token = adminLoginResponse.body.accessToken;
  }, 20000);

  afterAll(async () => {
    await databaseService.$disconnect();
    await app.close();
  });

  it('only customers can create an order', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/order')
      .set('Authorization', `Bearer ${customer1.access_token}`)
      .send({
        name: 'Order 1',
        description: 'This is the first order',
        specifications: 'This is the first order specifications',
        quantity: 10,
        due_date: '2025-10-01',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/order')
      .set('Authorization', `Bearer ${admin1.access_token}`)
      .send({
        name: 'Order 3',
        description: 'This is the second order',
        specifications: 'This is the second order specifications',
        quantity: 10,
        due_date: '2025-10-01',
      })
      .expect(403);
  });

  it('customer can see all their orders', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/order')
      .set('Authorization', `Bearer ${customer1.access_token}`)
      .send({
        name: 'Order 1',
        description: 'This is the first order',
        specifications: 'This is the first order specifications',
        quantity: 10,
        due_date: '2025-10-01',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/order')
      .set('Authorization', `Bearer ${customer1.access_token}`)
      .send({
        name: 'Order 1',
        description: 'This is the first order',
        specifications: 'This is the first order specifications',
        quantity: 10,
        due_date: '2025-10-01',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/api/v1/order')
      .set('Authorization', `Bearer ${customer1.access_token}`)
      .expect(200);

    expect(response.body.length).toBeGreaterThanOrEqual(2);
  });

  it('other customers cannot see another customer order', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/order')
      .set('Authorization', `Bearer ${customer1.access_token}`)
      .send({
        name: 'Order 1',
        description: 'This is the first order',
        specifications: 'This is the first order specifications',
        quantity: 10,
        due_date: '2025-10-01',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/api/v1/order')
      .set('Authorization', `Bearer ${customer1.access_token}`)
      .expect(200);

    expect(response.body.length).toBeGreaterThanOrEqual(2);

    await request(app.getHttpServer())
      .get(`/api/v1/order/${response.body[0].id}`)
      .set('Authorization', `Bearer ${customer2.access_token}`)
      .expect(403);
  });

  it('order fails to create if invalid payload is sent', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/order')
      .set('Authorization', `Bearer ${customer1.access_token}`)
      .send({
        name: '',
        description: 'This is the first order',
        specifications: 'This is the first order specifications',
        due_date: '2025-10-01',
      })
      .expect(400);
  });

  it('admins can see all order', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/order')
      .set('Authorization', `Bearer ${customer1.access_token}`)
      .send({
        name: 'Order 1',
        description: 'This is the first order',
        specifications: 'This is the first order specifications',
        quantity: 10,
        due_date: '2025-10-01',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/order')
      .set('Authorization', `Bearer ${customer2.access_token}`)
      .send({
        name: 'Order 3',
        description: 'This is the second order',
        specifications: 'This is the second order specifications',
        quantity: 10,
        due_date: '2025-10-01',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/api/v1/order')
      .set('Authorization', `Bearer ${admin1.access_token}`)
      .expect(200);

    expect(response.body.length).toBeGreaterThanOrEqual(2);
  });
});
