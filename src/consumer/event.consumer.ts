import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditLog } from '../audit/audit.entity';

@Injectable()
export class EventConsumer implements OnModuleInit {
    private channel: amqp.Channel | null = null;
  private readonly logger = new Logger(EventConsumer.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    this.connectWithRetry();
}

 async connectWithRetry(retry = 0) {
  try {
    const connection = await amqp.connect('amqp://localhost');
    this.channel = await connection.createChannel();

    await this.channel.assertQueue('events', { durable: true });
    this.channel.prefetch(5);

    this.channel.consume(
      'events',
      this.handleMessage.bind(this),
      { noAck: false },
    );

    this.logger.log('RabbitMQ consumer connected');
  } catch (err) {
    const delay = Math.min(5000 * (retry + 1), 30000);

    this.logger.error(
      `RabbitMQ unavailable. Retry in ${delay}ms`,
    );

    setTimeout(() => this.connectWithRetry(retry + 1), delay);
  }
}


async handleMessage(msg: amqp.ConsumeMessage | null) {
  if (!msg || !this.channel) return;

  const { eventId } = JSON.parse(msg.content.toString());

  try {
    await this.processEvent(eventId);
    this.channel.ack(msg);
  } catch (e) {
    this.channel.nack(msg, false, true);
  }
}


  async processEvent(eventId: string) {
    const manager = this.dataSource.manager;

    //idempotency(audit orqali)
    const exists = await manager.findOne(AuditLog, {
      where: {
        action: 'EXTERNAL_SENT',
        payload: { eventId },
      },
    });

    if (exists) {
      this.logger.warn(`Duplicate event ${eventId}, skipping`);
      return;
    }

    //external system mock
    await this.simulateExternalCall(eventId);

    //audit log
    await manager.save(AuditLog, {
      action: 'EXTERNAL_SENT',
      role: 'system',
      payload: { eventId },
    });
  }

  async simulateExternalCall(eventId: string) {
    //simulate network unreliability
    if (Math.random() < 0.2) {
      throw new Error('External system timeout');
    }

    await new Promise((res) => setTimeout(res, 300));
  }
}