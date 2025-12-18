import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { FakeAuthGuard } from './fake-auth.guard';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { randomUUID } from 'crypto';

describe('POST /events idempotency', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(FakeAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
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
      .send(payload);

    const second = await request(app.getHttpServer())
      .post('/api/events')
      .send(payload);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(first.body.id).toBe(second.body.id);
  });

  afterAll(async () => {
    await app.close();
  });
});
