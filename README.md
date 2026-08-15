# Ember Athletic Club

A full-stack gym platform: an animation-led marketing site, a member dashboard, an admin portal,
and a Razorpay checkout — one Next.js app, warm palette, light and dark throughout.

- **Landing** — GSAP + ScrollTrigger choreography, Lenis smooth scroll, full-bleed on desktop
- **Member dashboard** — membership status, class booking, billing history, training log
- **Admin portal** — members, plans, trainers, classes, payments and leads, with revenue analytics
- **Payments** — Razorpay orders, signature verification, webhooks, and a keyless mock mode

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, Server Components, server actions) · React 19 |
| Styling | Tailwind CSS v4 with a CSS-variable token system |
| Motion | GSAP 3 (`@gsap/react`, ScrollTrigger, SplitText) · Lenis |
| Database | PostgreSQL 16 · Prisma 7 with the `pg` driver adapter |
| Auth | JOSE-signed JWT in an httpOnly cookie, enforced in middleware |
| Payments | Razorpay Checkout + webhooks, with a local mock provider |
| Charts | Recharts |

## Getting started

```bash
# 1. Database (Docker) — host port 5455
docker compose up -d

# 2. Environment
cp .env.example .env      # then fill in AUTH_SECRET; Razorpay keys are optional

# 3. Schema + demo data
npm install
npm run db:migrate
npm run db:seed

# 4. Run it
npm run dev               # http://localhost:3000
```

### Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@ember.club` | `password123` |
| Member | `member@ember.club` | `password123` |

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `AUTH_SECRET` | yes | ≥32 chars — `openssl rand -hex 32` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | no | Leave empty to run checkout in mock mode |
| `RAZORPAY_WEBHOOK_SECRET` | no | Needed only for live webhook verification |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | no | Public key id for the Razorpay checkout modal |

With no Razorpay keys the checkout runs a local mock provider: it creates the same `Payment` rows,
verifies a real HMAC signature, and activates the same `Subscription` — so the full flow is
demonstrable end to end. Drop in test keys and it switches to live with no code change.
See [docs/payments.md](docs/payments.md).

## Scripts

```bash
npm run dev          # dev server
npm run build        # prisma generate && next build
npm run start        # production server
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run db:migrate   # create + apply a migration
npm run db:seed      # reseed demo data
npm run db:reset     # drop, migrate, seed
npm run db:studio    # Prisma Studio
```

## Project layout

```
prisma/
  schema.prisma        12 models: users, plans, subscriptions, payments,
  seed.ts              trainers, classes, bookings, check-ins, logs, leads
src/
  app/
    page.tsx           landing page
    (marketing)/       classes, trainers, pricing, contact
    (auth)/            login, register
    dashboard/         member area
    admin/             operator portal
    checkout/          plan chooser, order summary, success
    api/               payment endpoints + Razorpay webhook
    actions/           server actions, grouped by domain
  components/
    ui/                shared primitives (Button, Card, Input, Badge, …)
    site/              marketing header, footer, smooth scroll
    landing/           landing sections
    dashboard/         member-area components
    admin/             operator components
    checkout/          payment components
  lib/                 prisma, auth, auth-edge, razorpay, gsap, utils
  middleware.ts        route guards for /dashboard, /admin, /checkout
```

## Design system

Every colour, shadow and radius is a CSS variable declared in `src/app/globals.css` — light values
on `:root`, dark values on `.dark`, exposed to Tailwind via `@theme inline`. Components reference
tokens (`bg-surface`, `text-ink-muted`, `border-border`, `text-brand`), never raw hex and never
Tailwind's default palette, so both themes stay correct by construction.

The palette is warm throughout: ember orange, clay and amber over sand neutrals in light, and over
deep espresso in dark. Type is Bricolage Grotesque for display, Inter for body, Instrument Serif
for pull-quotes. Headings use `clamp()` sizes so a phone and a 4K monitor both get sensible scale
without a media query.

`CLAUDE.md` documents the full token table and the shared component contract.

## Responsive behaviour

Marketing sections run edge to edge on desktop via `.container-edge`; the dashboard and admin
shells use the whole viewport with a fixed sidebar. On phones the sidebars become a bottom tab bar
and a drawer, tables become stacked cards, and tap targets stay at 44px. `prefers-reduced-motion`
is honoured globally — animated elements resolve to their final state instead of moving.
