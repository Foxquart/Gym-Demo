import type { Metadata } from "next";
import { CalendarDays, ReceiptText, Snowflake } from "lucide-react";

import { PlanCard } from "@/components/checkout/plan-card";
import { Eyebrow, EmptyState } from "@/components/ui";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Choose your membership" };
export const dynamic = "force-dynamic";

const ASSURANCES = [
  {
    icon: CalendarDays,
    title: "No lock-in",
    body: "Cancel from your dashboard before the next renewal and it simply stops. No calls, no retention script.",
  },
  {
    icon: Snowflake,
    title: "Freeze for 30 days a year",
    body: "Travel, injury, a brutal quarter at work. Pause the clock and pick it back up where you left off.",
  },
  {
    icon: ReceiptText,
    title: "GST invoice, every time",
    body: "An 18% GST invoice lands in your inbox within a minute of payment — reimbursement-ready.",
  },
];

export default async function CheckoutPlansPage() {
  const user = await requireUser();

  const [plans, current] = await Promise.all([
    prisma.plan.findMany({
      where: { active: true, internal: false },
      orderBy: [{ sortOrder: "asc" }, { priceInPaise: "asc" }],
    }),
    prisma.subscription.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { endsAt: "desc" },
      include: { plan: true },
    }),
  ]);

  const monthly = plans.filter((p) => p.interval === "MONTHLY");
  const longer = plans.filter((p) => p.interval !== "MONTHLY");

  return (
    <div className="container-edge py-12 sm:py-16 lg:py-20">
      <header className="max-w-3xl">
        <Eyebrow>Membership</Eyebrow>
        <h1 className="mt-4 text-display-md text-ink">Pick the plan you&rsquo;ll actually use.</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
          Every membership is coached — there is no version of Ember where you get a keycard and
          good luck. Start on the one that fits this quarter; move up or down from your dashboard
          whenever the training changes.
        </p>

        {current?.plan && (
          <p className="mt-6 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[var(--radius-pill)] border border-border bg-surface px-4 py-2.5 text-sm text-ink-muted">
            <span className="text-ink">You&rsquo;re on {current.plan.name}</span>
            until {formatDate(current.endsAt, "long")}.
            <span className="text-ink-faint">Paying now adds time to that, it doesn&rsquo;t reset it.</span>
          </p>
        )}
      </header>

      {plans.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            title="No memberships on sale right now"
            description="We're rebuilding the plan list. Call the front desk on +91 22 4000 1200 and we'll sort you out by hand."
            action={<ButtonLink href="/">Back to the club</ButtonLink>}
          />
        </div>
      ) : (
        <>
          <section aria-labelledby="monthly-heading" className="mt-14">
            <h2 id="monthly-heading" className="sr-only">
              Monthly memberships
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
              {monthly.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrent={current?.planId === plan.id}
                />
              ))}
            </div>
          </section>

          {longer.length > 0 && (
            <section aria-labelledby="annual-heading" className="mt-16 sm:mt-20">
              <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-10">
                <div>
                  <h2 id="annual-heading" className="font-display text-2xl tracking-tight text-ink">
                    Pay for the year, train for fourteen months
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
                    The members who commit for a year are the ones whose numbers move. We price it
                    accordingly.
                  </p>
                </div>
              </div>
              <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
                {longer.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} isCurrent={current?.planId === plan.id} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="mt-16 grid gap-6 border-t border-border pt-10 sm:mt-20 sm:grid-cols-3 sm:gap-8">
        {ASSURANCES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <div>
              <p className="font-display text-base tracking-tight text-ink">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
