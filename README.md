# Rollnexa — Heavy Machinery Marketplace

Rollnexa is a full-stack marketplace for buying and selling construction and heavy equipment (excavators, road rollers, loaders, and more).

Built with **Next.js App Router**, **Better Auth**, **Prisma**, **local MongoDB**, **Tailwind CSS**, and **shadcn/ui**.

## Features

- Public marketplace browse, search, filters, compare, and machine details
- Buyer dashboard: favorites, inquiries, messages, reviews, recently viewed
- Seller dashboard: listings, moderation workflow, analytics, messaging
- Admin panel: users, machines, approvals, reports, catalogs, subscriptions
- Subscription & premium plans with payment architecture (manual + provider-ready)
- Notifications, reviews & ratings, Cloudinary image uploads

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Auth | Better Auth |
| Database | Local MongoDB + Prisma 6 |
| UI | Tailwind CSS 4, Lucide, Framer Motion |
| Forms | React Hook Form + Zod |
| Hosting | Vercel (recommended) |

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB 4.2+ running locally

## Installation

```bash
git clone https://github.com/mannanjr-755/Rollnexa.git
cd Rollnexa
npm install
cp backend/.env.example backend/.env
```

Fill in the values in `.env` (see below), then:

```bash
npm run db:push
npm run db:generate
npm run db:seed
npm run seed:plans
npm run seed:admin   # optional local admin bootstrap
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
market-place/
├── frontend/          # Next.js UI, App Router pages, and API routes
├── backend/           # Prisma schema, generated client, seeds, DB/dev scripts
├── package.json       # Root scripts that delegate to frontend/backend
└── README.md
```

Next.js hosts the HTTP API under `frontend/app/api` (no separate API server).

## Environment Variables

Copy `backend/.env.example` to `backend/.env` / Vercel project settings. **Never commit secrets.**

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | Local MongoDB replica-set URI, e.g. `mongodb://127.0.0.1:27018/rollnexa_marketplace?replicaSet=rs0` (run `npm run db:mongo`) |
| `BETTER_AUTH_SECRET` | Yes | Auth secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Yes | Public site URL (e.g. `https://your-app.vercel.app`) |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical SEO base URL (sitemap, Open Graph, robots) |
| `APP_URL` | Recommended | App URL used in emails / fallbacks |
| `CLOUDINARY_CLOUD_NAME` | No | Image hosting |
| `CLOUDINARY_API_KEY` | No | Image hosting |
| `CLOUDINARY_API_SECRET` | No | Image hosting |
| `RESEND_API_KEY` | No | Transactional email |
| `PAYMENT_PROVIDER` | No | `manual` (default), `stripe`, etc. |
| `ALLOW_MANUAL_PAYMENTS` | Prod | Must be `true` to allow manual payment confirmation in production |
| `STRIPE_SECRET_KEY` | No | Stripe server key |
| `STRIPE_PUBLIC_KEY` | No | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhooks |
| `ADMIN_NAME` / `DEV_ADMIN_NAME` | Local/ops | Designated admin display name |
| `ADMIN_EMAIL` / `DEV_ADMIN_EMAIL` | Local/ops | Designated admin email (only this account may use Admin Panel) |
| `ADMIN_PASSWORD` / `DEV_ADMIN_PASSWORD` | Local/ops | Designated admin password (never commit; used by `npm run seed:admin`) |

**Important:** Do not leave empty `MONGODB_URI` / `BETTER_AUTH_*` / `CLOUDINARY_*` keys in `.env.local` - empty values override `.env` and break the app.
## Local MongoDB

Prisma + MongoDB requires a replica set (transactions). The Windows MongoDB service on
port 27017 is often a standalone instance, which causes `P2031` on auth writes.

This repo expects a local single-node replica set on **27018**:

```bash
npm run db:mongo
```

That starts `mongod --replSet rs0 --port 27018` with data in `.mongo-rs0/` and runs
`rs.initiate()` once. Then:

```env
MONGODB_URI=mongodb://127.0.0.1:27018/rollnexa_marketplace?replicaSet=rs0
```

Alternatively, reconfigure the system MongoDB service with `replication.replSetName: rs0`,
restart it, run `rs.initiate()`, and point `MONGODB_URI` at port 27017.

MongoDB does not use Prisma SQL migrations. Use `npm run db:push` to sync Prisma indexes and constraints to the local database, then run the seed scripts. If seeding fails with "Prisma needs to perform transactions", ensure the replica set is PRIMARY (`mongosh --port 27018 --eval "rs.status()"`).

## Scripts

```bash
npm run db:mongo    # Start local MongoDB replica set on :27018
npm run dev          # Development server
npm run build        # Prisma generate + production build
npm run start        # Start production server
npm run lint         # ESLint
npm run test:qa      # End-to-end QA suite (requires `npm run dev`)
npm run test:admin-auth  # Admin auth gate tests (requires ADMIN_PASSWORD or DEV_ADMIN_PASSWORD)
npm run db:push      # Sync Prisma schema to local MongoDB
npm run db:seed      # Seed categories & brands
npm run seed:plans   # Seed subscription plans
npm run seed:admin   # Bootstrap designated admin (requires ADMIN_* or DEV_ADMIN_*)
```

## Project Structure

```
frontend/          Next.js App Router (UI + API routes)
backend/           Prisma schema, seeds, scripts
  prisma/          MongoDB schema (source of truth)
  generated/       Prisma client output (gitignored)
  scripts/         DB seeds, QA, and local Mongo/Prisma tooling
```

## Roles & Access

| Role | Default landing |
|------|-----------------|
| BUYER | `/buyer/dashboard` |
| SELLER | `/seller/dashboard` |
| ADMIN | `/admin` |

Public registration only creates **BUYER** or **SELLER**. Admin accounts are created via secure seed / DB promotion.

## Deployment (Vercel)

1. Push this repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Set environment variables from the table above.
4. Set `BETTER_AUTH_URL` to your Vercel production URL.
5. Deploy. Build command: `npm run build` (already configured).
6. After first deploy, sync the schema and seed subscription plans:
   ```bash
   npm run db:push
   npm run seed:plans
   ```

## Production Checklist

- [ ] `MONGODB_URI` points to the intended MongoDB database
- [ ] `BETTER_AUTH_SECRET` is a strong unique secret
- [ ] `BETTER_AUTH_URL` / `NEXT_PUBLIC_SITE_URL` match the live domain
- [ ] Prisma schema synced (`npm run db:push`)
- [ ] Subscription plans seeded
- [ ] Cloudinary configured for image uploads (recommended)
- [ ] Set `ALLOW_MANUAL_PAYMENTS=false` once Stripe (or another provider) is live
- [ ] Verify `/robots.txt` and `/sitemap.xml` on production
- [ ] Spot-check Open Graph / Twitter cards with a social debugger

## SEO & Security Notes

- Public pages use `buildMetadata()` for canonical URLs, Open Graph, and Twitter cards
- Dynamic sitemap: `/sitemap.xml` · robots: `/robots.txt`
- Private areas (`/admin`, `/buyer`, `/seller`, auth) are `noindex`
- Security headers, rate limiting, origin checks, and upload magic-byte validation live in `lib/security.ts` + `proxy.ts`

## License

Private / proprietary — all rights reserved unless otherwise stated.
