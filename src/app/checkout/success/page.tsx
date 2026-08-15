import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  Dumbbell,
  Hourglass,
  RotateCcw,
  Smartphone,
  TriangleAlert,
} from "lucide-react";

import { ReceiptReveal } from "@/components/checkout/receipt-reveal";
import { Badge } from "@/components/ui";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gstBreakdown } from "@/lib/razorpay";
import { formatDate, formatINR, intervalLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Payment confirmation" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ order?: string }> };

const METHOD_LABEL: Record<string, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Netbanking",
  wallet: "Wallet",
  emi: "EMI",
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { order } = await searchParams;
  const user = await requireUser();

  if (!order) redirect("/checkout");

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: order },
    include: { plan: true, subscription: true },
  });

  // Someone else's order id is simply not found — never confirm it exists.
  if (!payment || payment.userId !== user.id) notFound();

  const { baseInPaise, gstInPaise, ratePct } = gstBreakdown(payment.amountInPaise);
  const per = payment.plan ? (intervalLabel[payment.plan.interval] ?? "month") : "month";
  const retryHref = payment.plan ? `/checkout/${payment.plan.slug}` : "/checkout";

  /* ------------------------------- declined ------------------------------- */
  if (payment.status === "FAILED") {
    return (
      <Shell>
        <div className="mx-auto max-w-xl text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-danger/12 text-danger">
            <TriangleAlert className="size-7" aria-hidden />
          </span>
          <h1 className="mt-6 text-display-sm text-ink">That payment didn&rsquo;t go through.</h1>
          <p className="mt-4 text-base leading-relaxed text-ink-muted">
            {payment.failureReason ?? "Your bank declined the payment."} Nothing was charged, and
            your membership is unchanged — banks decline for boring reasons far more often than
            interesting ones.
          </p>

          <div className="mt-8 rounded-[var(--radius-card)] border border-border bg-surface p-5 text-left">
            <Row label="Plan" value={payment.plan?.name ?? "—"} />
            <Row label="Amount" value={formatINR(payment.amountInPaise)} />
            <Row label="Order" value={payment.razorpayOrderId} mono />
            <Row label="Attempted" value={formatDate(payment.createdAt, "long")} last />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href={retryHref} size="lg">
              <RotateCcw className="size-4" aria-hidden />
              Try again
            </ButtonLink>
            <ButtonLink href="/checkout" variant="outline" size="lg">
              Choose a different plan
            </ButtonLink>
          </div>

          <p className="mt-6 text-sm text-ink-faint">
            Third time unlucky? Call the front desk on +91 22 4000 1200 and we&rsquo;ll take it over
            the phone.
          </p>
        </div>
      </Shell>
    );
  }

  /* -------------------------------- pending ------------------------------- */
  if (payment.status !== "PAID") {
    return (
      <Shell>
        <div className="mx-auto max-w-xl text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-amber/15 text-amber">
            <Hourglass className="size-7" aria-hidden />
          </span>
          <h1 className="mt-6 text-display-sm text-ink">We&rsquo;re still waiting on your bank.</h1>
          <p className="mt-4 text-base leading-relaxed text-ink-muted">
            This order is open but unconfirmed. If you completed the payment, refresh in a few
            seconds — the confirmation reaches us either from your browser or straight from
            Razorpay, whichever gets here first.
          </p>

          <div className="mt-8 rounded-[var(--radius-card)] border border-border bg-surface p-5 text-left">
            <Row label="Plan" value={payment.plan?.name ?? "—"} />
            <Row label="Amount" value={formatINR(payment.amountInPaise)} />
            <Row label="Order" value={payment.razorpayOrderId} mono last />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href={`/checkout/success?order=${payment.razorpayOrderId}`} size="lg">
              Refresh status
            </ButtonLink>
            <ButtonLink href={retryHref} variant="outline" size="lg">
              Start the payment again
            </ButtonLink>
          </div>
        </div>
      </Shell>
    );
  }

  /* --------------------------------- paid --------------------------------- */
  const isRenewal =
    payment.subscription != null &&
    payment.subscription.startsAt.getTime() < payment.createdAt.getTime() - 60_000;

  return (
    <Shell>
      <ReceiptReveal className="mx-auto max-w-2xl">
        <div className="text-center">
          <span
            data-seal
            className="mx-auto grid size-16 place-items-center rounded-full bg-brand text-brand-ink shadow-[var(--shadow-glow)]"
          >
            <Check className="size-8" strokeWidth={2.5} aria-hidden />
          </span>

          <h1 data-reveal className="mt-6 text-display-sm text-ink">
            {isRenewal ? "Membership extended." : `Welcome to Ember, ${user.name.split(" ")[0]}.`}
          </h1>
          <p data-reveal className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-ink-muted">
            {isRenewal
              ? "Same plan, more runway. Your coach already knows — nothing about your training changes."
              : "Your membership is live from right now. A coach will message you within a day to book your movement screen."}
          </p>
          <div data-reveal className="mt-5 flex justify-center">
            <Badge tone="success" className="gap-1.5">
              <BadgeCheck className="size-3.5" aria-hidden />
              Payment verified
            </Badge>
          </div>
        </div>

        {/* ------------------------------ receipt ------------------------------ */}
        <div
          data-reveal
          className="mt-10 overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-md)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-bg-subtle px-6 py-4">
            <div>
              <p className="font-display text-base tracking-tight text-ink">Receipt</p>
              <p className="mt-0.5 text-xs text-ink-faint">
                {formatDate(payment.updatedAt, "long")}
              </p>
            </div>
            <p className="font-display text-2xl leading-none tracking-tight text-ink">
              {formatINR(payment.amountInPaise)}
            </p>
          </div>

          <div className="px-6 py-2">
            <Row label="Plan" value={`${payment.plan?.name ?? "Membership"} · per ${per}`} />
            <Row label={`Base (excl. GST)`} value={formatINR(baseInPaise)} />
            <Row label={`GST @ ${ratePct}%`} value={formatINR(gstInPaise)} />
            <Row label="Paid with" value={METHOD_LABEL[payment.method ?? ""] ?? "Razorpay"} />
            <Row label="Order id" value={payment.razorpayOrderId} mono />
            <Row label="Payment id" value={payment.razorpayPaymentId ?? "—"} mono />
            {payment.subscription && (
              <Row
                label="Next billing date"
                value={formatDate(payment.subscription.endsAt, "long")}
                last
              />
            )}
          </div>
        </div>

        <p data-reveal className="mt-4 text-center text-xs text-ink-faint">
          A GST invoice is on its way to {user.email}. It also lives in Billing, forever.
        </p>

        {/* ------------------------------- next up ----------------------------- */}
        <div data-reveal className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: CalendarDays,
              title: "Book your screen",
              body: "Forty minutes with a coach before you touch a barbell.",
            },
            {
              icon: Dumbbell,
              title: "Pick your first class",
              body: "The timetable is open to you from this second.",
            },
            {
              icon: Smartphone,
              title: "Get the app",
              body: "Your plan, your lifts and your check-ins in one place.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              data-line
              className="rounded-[var(--radius-card)] border border-border bg-surface p-5"
            >
              <span className="grid size-9 place-items-center rounded-full bg-brand-soft text-brand">
                <Icon className="size-[18px]" aria-hidden />
              </span>
              <p className="mt-3 font-display text-base tracking-tight text-ink">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
            </div>
          ))}
        </div>

        <div data-reveal className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href="/dashboard" size="lg">
            Go to my dashboard
          </ButtonLink>
          <ButtonLink href="/dashboard/billing" variant="outline" size="lg">
            View billing
          </ButtonLink>
        </div>

        <p data-reveal className="mt-8 text-center text-sm text-ink-faint">
          Something looks wrong on this receipt?{" "}
          <a
            href={`mailto:frontdesk@ember.club?subject=Receipt%20${encodeURIComponent(payment.razorpayOrderId)}`}
            className="text-ink-muted underline underline-offset-4 hover:text-brand"
          >
            Tell the front desk
          </a>{" "}
          and we&rsquo;ll fix it the same day.
        </p>
      </ReceiptReveal>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="container-edge py-14 sm:py-20 lg:py-24">{children}</div>;
}

function Row({
  label,
  value,
  mono,
  last,
}: {
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <div
      data-line
      className={`flex items-start justify-between gap-4 py-3.5 ${last ? "" : "border-b border-border"}`}
    >
      <p className="text-sm text-ink-faint">{label}</p>
      <p
        className={`text-right text-sm break-all text-ink ${mono ? "font-mono text-[13px]" : "tabular-nums"}`}
      >
        {value}
      </p>
    </div>
  );
}
