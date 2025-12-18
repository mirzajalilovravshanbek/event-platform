import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEntity } from '../events/outbox.entity';
import { OutboxWorker } from './outbox.worker';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OutboxEntity]),
    QueueModule,
  ],
  providers: [OutboxWorker],
})
export class OutboxModule {}
