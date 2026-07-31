# Rollnexa — Heavy Machinery Marketplace

Rollnexa is a full-stack marketplace for buying and selling construction and heavy equipment (excavators, road rollers, loaders, and more).

Built with **Next.js App Router**, **Better Auth**, **Prisma**, **PostgreSQL (Neon)**, **Tailwind CSS**, and **shadcn/ui**.

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
| Database | PostgreSQL + Prisma 7 |
| UI | Tailwind CSS 4, Lucide, Framer Motion |
| Forms | React Hook Form + Zod |
| Hosting | Vercel (recommended) |

## Prerequisites

- Node.js 20+
- npm 10+
- A PostgreSQL database (Neon recommended)

## Installation

```bash
git clone https://github.com/mannanjr-755/Rollnexa.git
cd Rollnexa
npm install
cp .env.example .env
```

Fill in the values in `.env` (see below), then:

```bash
npx prisma migrate deploy
npx prisma generate
npm run db:seed
npm run seed:plans
npm run seed:admin   # optional local admin bootstrap
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env` / Vercel project settings. **Never commit secrets.**

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Auth secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Yes | Public site URL (e.g. `https://your-app.vercel.app`) |
| `CLOUDINARY_CLOUD_NAME` | No | Image hosting |
| `CLOUDINARY_API_KEY` | No | Image hosting |
| `CLOUDINARY_API_SECRET` | No | Image hosting |
| `RESEND_API_KEY` | No | Transactional email |
| `PAYMENT_PROVIDER` | No | `manual` (default), `stripe`, etc. |
| `STRIPE_SECRET_KEY` | No | Stripe server key |
| `STRIPE_PUBLIC_KEY` | No | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhooks |
| `DEV_ADMIN_NAME` | Local only | Seed admin name |
| `DEV_ADMIN_EMAIL` | Local only | Seed admin email |
| `DEV_ADMIN_PASSWORD` | Local only | Seed admin password |

**Important:** Do not leave empty `DATABASE_URL` / `BETTER_AUTH_*` / `CLOUDINARY_*` keys in `.env.local` — empty values override `.env` and break the app.

## Scripts

```bash
npm run dev          # Development server
npm run build        # Prisma generate + production build
npm run start        # Start production server
npm run lint         # ESLint
npm run db:migrate   # Apply Prisma migrations
npm run db:seed      # Seed categories & brands
npm run seed:plans   # Seed subscription plans
npm run seed:admin   # Bootstrap local admin (requires DEV_ADMIN_*)
```

## Project Structure

```
app/
  (marketing)/     Public marketplace pages
  buyer/           Buyer dashboard
  seller/          Seller dashboard
  admin/           Admin panel
  api/             REST API routes
  login|register/  Auth pages
components/        UI & feature components
lib/               Auth, DB, services, validations
prisma/            Schema & migrations
scripts/           Dev utilities (seed, verify)
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
6. After first deploy, run migrations against production DB:
   ```bash
   npx prisma migrate deploy
   npm run seed:plans
   ```

## Production Checklist

- [ ] `DATABASE_URL` points to production Postgres
- [ ] `BETTER_AUTH_SECRET` is a strong unique secret
- [ ] `BETTER_AUTH_URL` matches the live domain
- [ ] Migrations applied (`prisma migrate deploy`)
- [ ] Subscription plans seeded
- [ ] Cloudinary configured for image uploads (recommended)

## License

Private / proprietary — all rights reserved unless otherwise stated.
