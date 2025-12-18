import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

@Entity('outbox_events')
export class OutboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @Column({ default: 'PENDING' })
  status: 'PENDING' | 'SENT' | 'FAILED';

  @Column({ default: 0 })
  attempts: number;

  @Column({ name: 'last_error', nullable: true })
  lastError?: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
