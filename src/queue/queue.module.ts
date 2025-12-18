import { Module } from '@nestjs/common';
import { rabbitMqProvider } from './rabbitmq.provider';

@Module({
  providers: [rabbitMqProvider],
  exports: [rabbitMqProvider],
})
export class QueueModule {}