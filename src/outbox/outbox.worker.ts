import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Inject } from '@nestjs/common';
import { RABBITMQ_CONNECTION } from '../queue/rabbitmq.provider';
import { OutboxEntity } from '../events/outbox.entity';
import { AuditLog } from '../audit/audit.entity';

@Injectable()
export class OutboxWorker {
  private readonly logger = new Logger(OutboxWorker.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(RABBITMQ_CONNECTION) private readonly connection: any,
  ) {
    if (process.env.NODE_ENV !== 'test') {
      this.start();
    }
  }

  async start() {
    setInterval(() => this.process(), 5000);
  }

  async process() {
    const manager = this.dataSource.manager;

    const pending = await manager.find(OutboxEntity, {
      where: { status: 'PENDING' },
      take: 10,
    });

    if (!pending.length) return;

    let channel;
    try {
      channel = await this.connection.createChannel();
    } catch {
      this.logger.warn('RabbitMQ channel unavailable');
      return;
    }
    await channel.assertQueue('events', { durable: true });

    for (const item of pending) {
      try {
        channel.sendToQueue(
          'events',
          Buffer.from(JSON.stringify({ eventId: item.eventId })),
          { persistent: true },
        );

        item.status = 'SENT';
        await manager.save(item);

        this.logger.log(`Event ${item.eventId} published`);
      } catch (e) {
        item.attempts += 1;
        item.status = 'FAILED';
        item.lastError = e.message;
        await manager.save(AuditLog, {
          action: 'EVENT_PUBLISH_FAILED',
          role: 'system',
          payload: {
            eventId: item.eventId,
            error: e.message,
          },
        });

        this.logger.error(`Failed ${item.eventId}`, e);
      }
    }

    await channel.close();
  }
}