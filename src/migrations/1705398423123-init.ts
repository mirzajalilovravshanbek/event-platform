import { MigrationInterface, QueryRunner } from 'typeorm';


export class Init1705398423123 implements MigrationInterface {
name = 'Init1705398423123';


public async up(qr: QueryRunner): Promise<void> {
await qr.query(`CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"`);


await qr.query(`
CREATE TABLE companies (
id UUID PRIMARY KEY,
name TEXT NOT NULL,
created_at TIMESTAMPTZ DEFAULT now()
)
`);


await qr.query(`
CREATE TABLE users (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
company_id UUID,
email TEXT UNIQUE NOT NULL,
role TEXT NOT NULL,
created_at TIMESTAMPTZ DEFAULT now()
)
`);

await qr.query(`
CREATE TABLE events (
id UUID PRIMARY KEY,
company_id UUID NOT NULL,
entity_id UUID,
type TEXT NOT NULL,
source TEXT NOT NULL,
payload JSONB NOT NULL,
occurred_at TIMESTAMPTZ NOT NULL,
created_at TIMESTAMPTZ DEFAULT now()
)
`);


await qr.query(`CREATE UNIQUE INDEX ux_events_id ON events(id)`);
await qr.query(`CREATE INDEX idx_events_company_entity ON events(company_id, entity_id)`);
await qr.query(`CREATE INDEX idx_events_type_date ON events(type, occurred_at)`);


await qr.query(`
CREATE TABLE outbox_events (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
event_id UUID UNIQUE NOT NULL,
status TEXT NOT NULL DEFAULT 'PENDING',
attempts INT NOT NULL DEFAULT 0,
last_error TEXT,
created_at TIMESTAMPTZ DEFAULT now(),
processed_at TIMESTAMPTZ
)
`);

await qr.query(`
CREATE TABLE audit_logs (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
company_id UUID,
user_id UUID,
role TEXT,
action TEXT NOT NULL,
payload JSONB,
ip_address INET,
created_at TIMESTAMPTZ DEFAULT now()
)
`);
}


public async down(qr: QueryRunner): Promise<void> {
await qr.query('DROP TABLE audit_logs');
await qr.query('DROP TABLE outbox_events');
await qr.query('DROP TABLE events');
await qr.query('DROP TABLE users');
await qr.query('DROP TABLE companies');
}
}