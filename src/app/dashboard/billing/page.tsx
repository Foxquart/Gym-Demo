import { CreditCard, Receipt, ShieldCheck } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatINR, intervalLabel, relativeDays } from "@/lib/utils";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/primitives";
import { daysBetween } from "../stats";

export const metadata = { title: "Plan & billing" };

type PaymentStatus = "CREATED" | "PAID" | "FAILED" | "REFUNDED";

const statusTone: Record<PaymentStatus, "success" | "amber" | "danger" | "neutral"> = {
  PAID: "success",
  CREATED: "amber",
  FAILED: "danger",
  REFUNDED: "neutral",
};

const statusLabel: Record<PaymentStatus, string> = {
  PAID: "Paid",
  CREATED: "Pending",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

const methodLabel: Record<string, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net banking",
  wallet: "Wallet",
};

function methodName(method: string | null) {
  if (!method) return "—";
  return methodLabel[method] ?? method;
}

export default async function BillingPage() {
  const user = await requireUser();
  const now = new Date();

  const [subscription, payments, paidTotal] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId: user.id, status: { in: ["ACTIVE", "PENDING"] } },
      orderBy: { endsAt: "desc" },
      include: { plan: true },
    }),
    prisma.payment.findMany({
      where: { userId: user.id },
      include: { plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.aggregate({
      where: { userId: user.id, status: "PAID" },
      _sum: { amountInPaise: true },
    }),
  ]);

  const daysLeft = subscription ? daysBetween(now, subscription.endsAt) : 0;
  const lifetime = paidTotal._sum.amountInPaise ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Plan & billing"
        title="What you pay, and when"
        lede="Memberships bill in advance through Razorpay. Every invoice below is downloadable from the front desk if you need it for reimbursement."
        actions={
          <ButtonLink href="/checkout" variant="outline">
            Change plan
          </ButtonLink>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* --------------------------- Current plan --------------------------- */}
        <Card className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-brand/10 blur-3xl"
          />
          <CardHeader className="relative flex-row items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-ink-faint uppercase">
                Current plan
              </p>
              <CardTitle className="mt-2 font-display text-2xl">
                {subscription ? subscription.plan.name : "No plan yet"}
              </CardTitle>
              <p className="mt-1.5 text-sm text-ink-muted">
                {subscription ? subscription.plan.tagline : "Pick one and the floor opens today."}
              </p>
            </div>
            {subscription ? (
              <Badge tone={subscription.status === "ACTIVE" ? "success" : "amber"}>
                {subscription.status === "ACTIVE" ? "Active" : "Pending"}
              </Badge>
            ) : null}
          </CardHeader>

          <CardContent className="relative">
            {subscription ? (
              <>
                <p className="font-display text-3xl text-ink tabular-nums">
                  {formatINR(subscription.plan.priceInPaise)}
                  <span className="ml-1 text-sm font-medium text-ink-faint">
                    / {intervalLabel[subscription.plan.interval] ?? "month"}
                  </span>
                </p>

                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border pt-5 text-sm">
                  <div>
                    <dt className="text-xs text-ink-faint">Started</dt>
                    <dd className="mt-1 text-ink">{formatDate(subscription.startsAt, "long")}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-faint">Renews</dt>
                    <dd className="mt-1 text-ink">
                      {formatDate(subscription.endsAt, "long")}
                      <span className="block text-xs text-ink-faint">
                        {relativeDays(subscription.endsAt)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-faint">Days remaining</dt>
                    <dd className="mt-1 text-ink tabular-nums">{daysLeft}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-faint">Paid to date</dt>
                    <dd className="mt-1 text-ink tabular-nums">{formatINR(lifetime)}</dd>
                  </div>
                </dl>

                <ul className="mt-5 flex flex-col gap-2 border-t border-border pt-5">
                  {subscription.plan.features.slice(0, 4).map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[13px] text-ink-muted">
                      <ShieldCheck className="mt-px size-4 shrink-0 text-sage" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  <ButtonLink href={`/checkout/${subscription.plan.slug}`} size="sm">
                    Manage plan
                  </ButtonLink>
                  <ButtonLink href="/checkout" size="sm" variant="outline">
                    Compare plans
                  </ButtonLink>
                </div>
              </>
            ) : (
              <EmptyState
                icon={<CreditCard className="size-7" aria-hidden />}
                title="Nothing billing right now"
                description="You don't have a membership on file. Plans start at ₹1,990 a month and you can change or cancel from this page."
                action={
                  <ButtonLink href="/checkout" size="sm" className="mt-2">
                    See the plans
                  </ButtonLink>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* ----------------------------- Reassurance --------------------------- */}
        <Card className="bg-bg-subtle">
          <CardHeader>
            <CardTitle>How billing works here</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-[13px] leading-relaxed text-ink-muted">
            <p>
              <strong className="font-medium text-ink">One charge, one cycle.</strong> Monthly plans
              bill on the same date each month. Annual plans bill once and stay locked at that price.
            </p>
            <p>
              <strong className="font-medium text-ink">Upgrades are prorated.</strong> Move up
              mid-cycle and you only pay the difference for the days remaining.
            </p>
            <p>
              <strong className="font-medium text-ink">Pausing is free, twice a year.</strong> Travel,
              injury, a bad quarter at work — tell the desk and we hold the plan for up to eight weeks.
            </p>
            <p className="border-t border-border pt-4 text-xs text-ink-faint">
              Card details never touch our servers. Razorpay handles the payment and sends us a token.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------- History -------------------------------- */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Payment history</CardTitle>
            <p className="mt-1 text-sm text-ink-muted">
              {payments.length > 0
                ? `${payments.length} transaction${payments.length === 1 ? "" : "s"} on file.`
                : "Nothing charged yet."}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          {payments.length === 0 ? (
            <EmptyState
              icon={<Receipt className="size-7" aria-hidden />}
              title="No payments yet"
              description="Once you start a membership, every invoice lands here — amount, method, and the exact date it cleared."
              action={
                <ButtonLink href="/checkout" size="sm" className="mt-2">
                  Choose a plan
                </ButtonLink>
              }
            />
          ) : (
            <>
              {/* Phones: one card per payment, no sideways scrolling. */}
              <ul className="flex flex-col gap-3 md:hidden">
                {payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="rounded-xl border border-border bg-bg-subtle p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">
                          {payment.plan?.name ?? "Membership"}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-faint">
                          {formatDate(payment.createdAt)} · {methodName(payment.method)}
                        </p>
                      </div>
                      <p className="shrink-0 font-display text-base text-ink tabular-nums">
                        {formatINR(payment.amountInPaise)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <Badge tone={statusTone[payment.status]}>{statusLabel[payment.status]}</Badge>
                      <span className="truncate font-mono text-[10px] text-ink-faint">
                        {payment.razorpayOrderId}
                      </span>
                    </div>
                    {payment.failureReason ? (
                      <p className="mt-2 text-xs text-danger">{payment.failureReason}</p>
                    ) : null}
                  </li>
                ))}
              </ul>

              {/* Laptops: a real table, full width of the content column. */}
              <div className="hidden md:block">
                <table className="w-full border-collapse text-sm">
                  <caption className="sr-only">
                    Your Ember Athletic Club payments, newest first
                  </caption>
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th scope="col" className="py-2.5 pr-4 text-[11px] font-semibold tracking-[0.12em] text-ink-faint uppercase">
                        Date
                      </th>
                      <th scope="col" className="py-2.5 pr-4 text-[11px] font-semibold tracking-[0.12em] text-ink-faint uppercase">
                        Plan
                      </th>
                      <th scope="col" className="py-2.5 pr-4 text-[11px] font-semibold tracking-[0.12em] text-ink-faint uppercase">
                        Method
                      </th>
                      <th scope="col" className="py-2.5 pr-4 text-[11px] font-semibold tracking-[0.12em] text-ink-faint uppercase">
                        Reference
                      </th>
                      <th scope="col" className="py-2.5 pr-4 text-[11px] font-semibold tracking-[0.12em] text-ink-faint uppercase">
                        Status
                      </th>
                      <th scope="col" className="py-2.5 text-right text-[11px] font-semibold tracking-[0.12em] text-ink-faint uppercase">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-border last:border-0 transition-colors duration-200 hover:bg-bg-subtle"
                      >
                        <td className="py-3.5 pr-4 whitespace-nowrap text-ink">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="py-3.5 pr-4 text-ink">{payment.plan?.name ?? "Membership"}</td>
                        <td className="py-3.5 pr-4 text-ink-muted">{methodName(payment.method)}</td>
                        <td className="py-3.5 pr-4 font-mono text-xs text-ink-faint">
                          {payment.razorpayPaymentId ?? payment.razorpayOrderId}
                        </td>
                        <td className="py-3.5 pr-4">
                          <Badge tone={statusTone[payment.status]}>
                            {statusLabel[payment.status]}
                          </Badge>
                          {payment.failureReason ? (
                            <span className="mt-1 block text-xs text-danger">
                              {payment.failureReason}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3.5 text-right font-medium text-ink tabular-nums">
                          {formatINR(payment.amountInPaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
