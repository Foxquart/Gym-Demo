# Ember Athletic Club — project brief

Full-stack gym platform: an award-tier marketing site, a member dashboard, an admin portal,
and Razorpay checkout. Next.js 15 (App Router) · React 19 · Tailwind v4 · Prisma 7 · Postgres.

## Brand

**Ember Athletic Club.** A coaching-led strength and conditioning club. The voice is warm,
confident and specific — never hype, never "crush your goals". Copy sounds like a good coach:
concrete numbers, plain verbs, dry humour. Indian metro context, prices in ₹.

## Design system — use these, do not invent new ones

Tokens live in `src/app/globals.css`. Reference them through Tailwind classes:

| Purpose | Class |
| --- | --- |
| Page background / subtle band | `bg-bg` / `bg-bg-subtle` |
| Card surface | `bg-surface` / `bg-surface-raised` |
| Text | `text-ink` / `text-ink-muted` / `text-ink-faint` |
| Brand (ember orange) | `bg-brand` `text-brand` `bg-brand-soft` `text-brand-ink` |
| Accents | `text-amber` `text-clay` `text-sage` `text-success` `text-danger` |
| Borders | `border-border` / `border-border-strong` |
| Shadows | `shadow-[var(--shadow-sm)]` `-md` `-lg` `-glow` |

Fonts: `font-display` (Bricolage Grotesque, headings) · `font-sans` (Inter, body) ·
`font-serif` (Instrument Serif, italic pull-quotes only).

Fluid heading sizes: `text-display-xl` `text-display-lg` `text-display-md` `text-display-sm`.
Layout helpers: `.container-edge` (full-bleed page gutter) · `.container-read` (max-w-78rem).
Texture: `.grain` (needs `relative` on the same element) · `.glass` · `.text-gradient-ember`.
Easing: `ease-[var(--ease-out-expo)]`.

**Every colour must come from a token** so light and dark both work. Never hard-code hex, never
use Tailwind's default palette (`gray-500`, `orange-600`, …). Test both themes.

## Shared building blocks — import, don't duplicate

- `@/components/ui/button` → `Button`, `ButtonLink`
- `@/components/ui` → `Card`, `CardHeader/Title/Description/Content/Footer`, `Input`, `Textarea`,
  `Select`, `Label`, `Field`, `Badge`, `Eyebrow`, `EmptyState`, `Skeleton`
- `@/components/theme` → `ThemeProvider` (already mounted), `ThemeToggle`
- `@/lib/utils` → `cn`, `formatINR`, `formatDate`, `relativeDays`, `initials`, `intervalLabel`,
  `intervalMonths`
- `@/lib/prisma` → `prisma`
- `@/lib/auth` → `getSession`, `getCurrentUser`, `requireUser`, `requireAdmin`, `createSession`,
  `destroySession`, `hashPassword`, `verifyPassword`, type `CurrentUser`
- `sonner` → `toast` (Toaster already mounted in the root layout)

## Money

Always stored and passed around in **paise** (`priceInPaise`, `amountInPaise`). Convert only at
the display edge with `formatINR()`.

## Responsive contract

- Phones: single column, 44px minimum tap targets, no horizontal scroll ever, bottom-anchored
  nav where it helps one-handed use.
- Laptop/desktop: **full page width** — marketing sections go edge to edge with `.container-edge`,
  app shells use the whole viewport with a fixed sidebar. Do not centre everything in a narrow
  `max-w-5xl` column.
- Breakpoints: design mobile-first, then `sm:` `md:` `lg:` `xl:` `2xl:`.

## Motion

GSAP + `@gsap/react` (`useGSAP`), Lenis for smooth scroll on marketing pages only. All GSAP
plugins are free in v3.13+ (ScrollTrigger, SplitText, Flip, ScrollSmoother excluded).
Honour `prefers-reduced-motion` — the `.js-reveal` utility already no-ops under it.

## Auth

Cookie session (`ember_session`) holding a JOSE JWT. `src/middleware.ts` guards `/dashboard`,
`/admin`, `/checkout` and bounces signed-in users away from `/login` and `/register`.
Roles: `USER` | `ADMIN`.

## Seeded logins

- Admin — `admin@ember.club` / `password123`
- Member — `member@ember.club` / `password123`

## Commands

```bash
npm run dev          # dev server
npm run db:seed      # reseed
npm run db:reset     # drop, migrate, then seed
npm run typecheck    # tsc --noEmit
```

Postgres runs in Docker: `docker start gym-pg` (host port **5455**).

## Rules for parallel work

Dependencies are already installed — **do not run `npm install`** or edit `package.json`,
`globals.css`, `src/app/layout.tsx`, or files owned by another agent. Verify with
`npx tsc --noEmit`, not `next build`.
