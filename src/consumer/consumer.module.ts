import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventConsumer } from './event.consumer';
import { AuditLog } from '../audit/audit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [EventConsumer],
})
export class ConsumerModule {}