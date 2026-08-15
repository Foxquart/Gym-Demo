import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addMonths } from "date-fns";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";

import { PayPanel } from "@/components/checkout/pay-panel";
import { Badge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProvider, gstBreakdown } from "@/lib/razorpay";
import { formatDate, formatINR, intervalLabel, intervalMonths } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const plan = await prisma.plan.findUnique({ where: { slug }, select: { name: true } });
  return { title: plan ? `Checkout — ${plan.name}` : "Checkout" };
}

export default async function PlanCheckoutPage({ params }: Params) {
  const { slug } = await params;

  // The middleware already bounced signed-out visitors; this is the real gate.
  const user = await requireUser();

  const plan = await prisma.plan.findUnique({ where: { slug } });
  if (!plan || !plan.active) notFound();

  const current = await prisma.subscription.findFirst({
    where: { userId: user.id, planId: plan.id, status: "ACTIVE" },
    orderBy: { endsAt: "desc" },
  });

  const { baseInPaise, gstInPaise, totalInPaise, ratePct } = gstBreakdown(plan.priceInPaise);
  const per = intervalLabel[plan.interval] ?? "month";
  const months = intervalMonths[plan.interval] ?? 1;
  const now = new Date();
  const renewsOn = addMonths(current && current.endsAt > now ? current.endsAt : now, months);
  const mode = getProvider().mode;

  return (
    <div className="container-edge py-8 pb-32 sm:py-12 md:pb-16 lg:py-16">
      <Link
        href="/checkout"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-brand"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All plans
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 xl:gap-20">
        {/* ------------------------------ left ------------------------------ */}
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-display-sm text-ink">{plan.name}</h1>
            {plan.highlight && <Badge tone="brand">Most members</Badge>}
            {current && <Badge tone="success">Renewal</Badge>}
          </div>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-muted">{plan.tagline}</p>

          <section aria-labelledby="included" className="mt-10">
            <h2
              id="included"
              className="text-[11px] font-semibold tracking-[0.22em] text-ink-faint uppercase"
            >
              What&rsquo;s included
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 text-sm leading-relaxed text-ink-muted"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="member" className="mt-10">
            <h2
              id="member"
              className="text-[11px] font-semibold tracking-[0.22em] text-ink-faint uppercase"
            >
              Billed to
            </h2>
            <dl className="mt-5 divide-y divide-border overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
              <div className="flex items-center justify-between gap-4 px-5 py-3.5">
                <dt className="text-sm text-ink-faint">Member</dt>
                <dd className="text-right text-sm text-ink">{user.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-5 py-3.5">
                <dt className="text-sm text-ink-faint">Email</dt>
                <dd className="truncate text-right text-sm text-ink">{user.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-5 py-3.5">
                <dt className="text-sm text-ink-faint">Phone</dt>
                <dd className="text-right text-sm text-ink">
                  {user.phone ?? (
                    <span className="text-ink-faint">Add one at the front desk</span>
                  )}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-ink-faint">
              These details prefill the payment window. Change them in your profile and they follow
              you here.
            </p>
          </section>

          <section className="mt-10 flex gap-3.5 rounded-[var(--radius-card)] border border-border bg-bg-subtle p-5">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-sage" aria-hidden />
            <div className="text-sm leading-relaxed text-ink-muted">
              <p className="text-ink">Card details never touch our servers.</p>
              <p className="mt-1">
                Razorpay handles the payment window and returns a signed receipt, which we verify
                before your membership starts. If verification fails, nothing is activated and
                nothing is charged.
              </p>
            </div>
          </section>
        </div>

        {/* ------------------------------ right ----------------------------- */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-md)]">
            <div className="border-b border-border bg-bg-subtle px-6 py-5">
              <h2 className="font-display text-lg tracking-tight text-ink">Order summary</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {plan.name} membership · billed every {per}
              </p>
            </div>

            <div className="space-y-3.5 px-6 py-6">
              <Line label={`${plan.name} — 1 ${per}`} value={formatINR(baseInPaise)} />
              <Line
                label={`GST @ ${ratePct}%`}
                value={formatINR(gstInPaise)}
                hint="Charged as part of the total below"
              />
              <div className="border-t border-border pt-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-ink">Total due today</p>
                    <p className="mt-0.5 text-xs text-ink-faint">One charge, in INR</p>
                  </div>
                  <p className="font-display text-2xl leading-none tracking-tight text-ink">
                    {formatINR(totalInPaise)}
                  </p>
                </div>
              </div>

              <p className="rounded-xl bg-bg-subtle px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
                {current
                  ? `Renewing now extends your membership to ${formatDate(renewsOn, "long")}.`
                  : `Your membership runs until ${formatDate(renewsOn, "long")}, then renews at the same price.`}
              </p>

              <div className="pt-1">
                <PayPanel
                  plan={{ slug: plan.slug, name: plan.name, priceInPaise: plan.priceInPaise }}
                  member={{ name: user.name, email: user.email, phone: user.phone }}
                  mode={mode}
                />
              </div>
            </div>
          </div>

          <p className="mt-4 px-1 text-xs leading-relaxed text-ink-faint">
            By paying you agree to the club rules and the cancellation policy. Renewals are
            automatic; turn them off any time from Billing.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Line({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-ink-muted">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>}
      </div>
      <p className="shrink-0 text-sm text-ink tabular-nums">{value}</p>
    </div>
  );
}
