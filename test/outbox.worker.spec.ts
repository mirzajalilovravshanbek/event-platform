import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { randomUUID } from 'crypto';

describe('POST /events idempotency', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        userId: randomUUID(),
        companyId: randomUUID(),
        role: 'operator',
      });

    expect(res.status).toBe(201);
    expect(res.body.access_token).toBeDefined();

    token = res.body.access_token;
  });

  it('should not create duplicate events for same eventId', async () => {
    const eventId = randomUUID();

    const payload = {
      eventId,
      entityId: randomUUID(),
      type: 'ACCIDENT',
      source: 'mobile',
      payload: { speed: 80 },
      occurredAt: new Date().toISOString(),
    };

    const first = await request(app.getHttpServer())
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    const second = await request(app.getHttpServer())
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(first.body.id).toBe(second.body.id);
  });

  afterAll(async () => {
    await app.close();
  });
});
