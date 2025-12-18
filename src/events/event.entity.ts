import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('events')
export class EventEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Index()
  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId?: string;

  @Column()
  type: 'ACCIDENT' | 'SERVICE' | 'TRANSFER';

  @Column()
  source: 'mobile' | 'partner' | 'manual';

  @Column('jsonb')
  payload: any;

  @Index()
  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
