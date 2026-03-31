Mera-Pe Task API

Express + TypeScript + PostgreSQL backend for earned wage limit and concurrency-safe withdrawals.

Setup
1. Copy .env.example to .env
2. Set DATABASE_URL
3. npm install
4. npm run db:schema
5. npm run db:seed
6. npm run dev

Endpoints
GET /api/limit/:userId
POST /api/withdraw with Idempotency-Key header
