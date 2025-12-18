import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';


@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;


    @Column({ name: 'company_id', type: 'uuid', nullable: true })
    companyId?: string;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    userId?: string;

    @Column({ nullable: true })
    role?: string;

    @Column()
    action: string;

    @Column('jsonb', { nullable: true })
    payload?: any;

    @Column({ name: 'ip_address', nullable: true })
    ipAddress?: string;

    @Column({
        name: 'created_at',
        type: 'timestamptz',
        default: () => 'now()',
    })
    createdAt: Date;
}