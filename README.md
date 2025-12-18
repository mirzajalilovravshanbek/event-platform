# Event Platform

## Umumiy tavsif

Loyiha **NestJS + Node.js + PostgreSQL + TypeORM + RabbitMQ** asosida qurilgan.

Tizim quyidagi kafolatlarni beradi:

* eventlar yo‘qolmaydi
* eventlar dublikat bo‘lmaydi
* eventlar o‘zgartirilmaydi (immutable)
* to‘liq audit trail mavjud
* qisman nosozliklarda ham tizim barqaror ishlaydi

Bu loyiha **feature ko‘pligiga emas**, balki **arxitektura to‘g‘riligiga va ishonchlilikka** urg‘u beradi.

---

## Biznes kontekst

* Multi-tenant B2B platforma
* Tuzilma: **Company → Entity → Event**
* Eventlar:

  * turli manbalardan keladi (mobile, partner, manual)
  * yo‘qolmasligi kerak
  * dublikat bo‘lmasligi kerak
  * orqaga qarab o‘zgartirilmasligi kerak
* Tashqi tizimlar va tarmoq ishonchsiz

---

## Texnologiyalar

| Qism               | Tanlov           | Sabab                                 |
| ------------------ | ---------------- | ------------------------------------- |
| Backend            | NestJS (Node.js) | Modul arxitektura, DI, testlash qulay |
| Ma’lumotlar bazasi | PostgreSQL       | ACID, transaction, JSONB              |
| ORM                | TypeORM          | Migrations, aniq mapping              |
| Queue              | RabbitMQ         | Durable message, retry imkoniyati     |
| Auth               | JWT + RBAC       | Company-scoped xavfsizlik             |
| Test               | Jest + Supertest | E2E va invariant testlar              |

---

## Domain modeli

### Asosiy entitylar

* **Company** – tenant chegarasi
* **Entity** – biznes obyekti (masalan, vehicle)
* **Event** – immutable biznes fakt
* **OutboxEvent** – event yetkazib berish kafolati
* **AuditLog** – audit va compliance uchun

---

## Ma’lumotlar bazasi dizayni

### Nega PostgreSQL?

* Huquqiy ahamiyatga ega eventlar uchun **strict consistency** talab qilinadi
* Event va outbox yozuvlari **bitta transaction** ichida saqlanadi
* JSONB payload uchun mos
* Katta hajmdagi o‘qishlar uchun indexlar mavjud

### Jadvallar

* `companies`
* `users`
* `events`
* `outbox_events`
* `audit_logs`

DB’da `snake_case`, kodda `camelCase` ishlatiladi. Mapping TypeORM orqali aniq ko‘rsatilgan.

---

## API

### POST /api/events

Yangi event yaratish.

**Kafolatlar:**

* `eventId` bo‘yicha idempotent
* Dublikat yaratilmaydi
* Event immutable
* Retry’larda xavfsiz

**Natija:**

* Birinchi so‘rov → `201 Created`
* Qayta yuborish → `200 OK` (mavjud event)

---

### GET /api/events

Eventlarni o‘qish (company scope’da).

**Imkoniyatlar:**

* entityId bo‘yicha filter
* type bo‘yicha filter
* sana oralig‘i
* pagination
* indexlardan foydalanish

---

## Autentifikatsiya va avtorizatsiya

* JWT asosida
* RBAC: `system`, `operator`, `partner`
* Har bir so‘rov company scope’da

**Muhim qoida:**

> CompanyId hech qachon request body’dan olinmaydi, faqat JWT’dan.

---

## Event processing pipeline

### Outbox Pattern

Event yaratishda quyidagi oqim ishlaydi:

1. Event `events` jadvaliga yoziladi
2. Shu transaction ichida `outbox_events` jadvaliga yoziladi
3. API shu joyda javob qaytaradi
4. Background worker outbox’dan o‘qib RabbitMQ’ga yuboradi

Bu yondashuv event yo‘qolishini oldini oladi.

---

## RabbitMQ Consumer

Consumer quyidagilarni bajaradi:

* RabbitMQ’dan eventni oladi
* Idempotent ishlaydi
* Tashqi tizimga yuborishni imitatsiya qiladi
* Muvaffaqiyat → ack
* Xato → nack + retry
* AuditLog yozadi

---

## Audit log

AuditLog quyidagilarni yozadi:

* Kim (user / system)
* Qachon
* Qaysi amal
* Payload

AuditLog **user action** va **system action** larni ajratib ko‘rsatadi.

---

## Konsistensiya modeli

* **Strict consistency**:

  * Event yaratish
  * Idempotency

* **Eventual consistency**:

  * RabbitMQ publish
  * External system integratsiyasi

Bu ajratish ongli ravishda qilingan.

---

## Failure scenario’lar

### DB vaqtincha ishlamasa

* API 503 qaytaradi
* Event yozilmaydi

### RabbitMQ ishlamasa

* API ishlashda davom etadi
* Outbox yozuvlari PENDING bo‘lib qoladi

### Worker yiqilsa

* Event DB’da saqlangan
* Keyingi ishga tushishda davom etadi

### Duplicate eventId

* Yangi yozuv yaratilmaydi
* Mavjud event qaytariladi

---

## Yuklama va degradatsiya

Agar:

* 1000 event / minut
* RabbitMQ sekinlashsa

Unda:

* Outbox jadvali o‘sadi
* API ishlashda davom etadi
* Oxirgi limit — DB resurslari

---

## Test strategiya

Testlar minimal, lekin muhim joylarga qaratilgan:

* Event idempotency (E2E)
* Outbox retry logic

Auth test rejimida guard override orqali bypass qilingan.

---

## Ongli kompromisslar

* Kafka o‘rniga RabbitMQ tanlandi (soddaroq setup)
* Exactly-once emas, at-least-once delivery
* External system mock qilingan

---

## Kengaytirish (x10 scale)

Agar yuklama 10 baravar oshsa:

* Outbox worker alohida servisga ajratiladi
* Batch publish qo‘shiladi
* Partitioned queues
* Read-replica DB

---

## Backend javobgarlik chegarasi

Backend mas’ul:

* Eventni ishonchli saqlash
* Eventni yetkazishga urinish
* Audit trail

Backend mas’ul EMAS:

* External system biznes xatolari
* Client retry strategiyasi

---

## O‘rnatish va ishga tushirish

### Talablar

Quyidagi vositalar oldindan o‘rnatilgan bo‘lishi kerak:

* Node.js **v18+**
* PostgreSQL **v14+**
* RabbitMQ **v3.9+**
* npm yoki yarn

---

### 1. Repository’ni klonlash

```bash
git clone https://github.com/mirzajalilovravshanbek/event-platform.git
cd event-platform
```

---

### 2. Dependency’larni o‘rnatish

```bash
npm install
```

---

### 3. Environment sozlash

Loyiha root’ida `.env` fayl yarating:

```env
# App
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=123456
DB_NAME=event_platform

# JWT
JWT_SECRET=supersecret
JWT_EXPIRES_IN=1h

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
```

---

### 4. PostgreSQL’da database yaratish

```sql
CREATE DATABASE event_platform;
```

---

### 5. Migration’larni ishga tushirish

```bash
npm run migration:run
```

Bu buyruq barcha kerakli jadvallarni yaratadi:

* companies
* users
* events
* outbox_events
* audit_logs

---

### 6. Ilovani ishga tushirish

```bash
npm run start:dev
```

Ilova quyidagi manzilda ishga tushadi:

```
http://localhost:3000/api
```

---

### 7. Testlarni ishga tushirish

```bash
npm run test
```

Test rejimida:

* Auth guard bypass qilinadi
* Background worker’lar ishga tushmaydi
* E2E testlar deterministic ishlaydi
