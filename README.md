# Portfolio Next.js / Prisma / Vercel Blob

## Setup

- Node 18+
- Copy `.env.example` to `.env` and fill values:
  - `DATABASE_URL="file:./prisma/dev.db"`
  - `AUTH_SECRET=...` (random string)
  - `ADMIN_EMAIL=...`
  - `ADMIN_PASSWORD_HASH=...` (generate via `npm run seed:admin` or `scripts/hash-password.cjs`)
  - Optional for local blob delete: `BLOB_READ_WRITE_TOKEN=...`

## Scripts

- `npm run dev` – start dev server
- `npm run build && npm start` – production
- `npm run prisma:migrate` – migrate schema
- `npm run seed:admin` – seed admin user (creates one if none)

## Auth

- Admin session via httpOnly cookie `session`.
- Middleware protects `/admin`, POST/PUT/DELETE on `/api/projects*` and `/api/uploads`.
- No x-admin-key header; only session-based access.

## Images

- Uploads via `/api/uploads` to Vercel Blob (public access).
- On project DELETE, associated blob is removed (best-effort).
- On project UPDATE, old blob is removed if image URL changed (best-effort).

## Models

- `Project`: slug unique, title, description, image, technologies (JSON string), languages (JSON string), repoUrl, demoUrl, timestamps.
- `User`: email unique, passwordHash, role, timestamps.
