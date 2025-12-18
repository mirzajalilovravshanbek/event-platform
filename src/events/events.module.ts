import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventEntity } from './event.entity';
import { OutboxEntity } from './outbox.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity, OutboxEntity])],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}