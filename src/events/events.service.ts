import {
  Injectable,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventEntity } from './event.entity';
import { OutboxEntity } from './outbox.entity';
import { Between } from 'typeorm';
import { GetEventsDto } from './dto/get-events.dto';

@Injectable()
export class EventsService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(query: GetEventsDto, user: any) {
  const {
    entityId,
    type,
    from,
    to,
    page,
    limit,
  } = query;

  const where: any = {
    companyId: user.companyId,
  };

  if (entityId) {
    where.entityId = entityId;
  }

  if (type) {
    where.type = type;
  }

  if (from || to) {
    where.occurredAt = Between(
      from ? new Date(from) : new Date('1970-01-01'),
      to ? new Date(to) : new Date(),
    );
  }
  const [items, total] = await this.dataSource.manager.findAndCount(
    EventEntity,
    {
      where,
      order: { occurredAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    },
  );

  return {
    data: items,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

  async create(dto: any, user: any) {
    // 🔐 company isolation
    if (dto.companyId !== user.companyId && user.role !== 'system') {
      throw new ForbiddenException('Cross-company access denied');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ♻️ idempotency
      const existing = await queryRunner.manager.findOne(EventEntity, {
        where: { id: dto.eventId },
      });

      if (existing) {
        await queryRunner.rollbackTransaction();
        return existing; // 200 OK
      }

      const event = queryRunner.manager.create(EventEntity, {
        id: dto.eventId,
        companyId: dto.companyId,
        entityId: dto.entityId,
        type: dto.type,
        source: dto.source,
        payload: dto.payload,
        occurredAt: new Date(dto.occurredAt),
      });

      await queryRunner.manager.save(event);

      // 📦 outbox
      await queryRunner.manager.save(OutboxEntity, {
        eventId: event.id,
      });

      await queryRunner.commitTransaction();
      return event; // 201 Created
    } catch (e) {
        await queryRunner.rollbackTransaction();

        console.error('EVENT CREATE ERROR:', e); // ⬅️ MUHIM

        throw e; // ⬅️ vaqtincha shunday
    //   await queryRunner.rollbackTransaction();
    //   throw new ServiceUnavailableException();
    } finally {
      await queryRunner.release();
    }
  }
}