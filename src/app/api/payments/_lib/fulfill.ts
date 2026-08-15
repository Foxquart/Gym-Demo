import "server-only";

import { addMonths } from "date-fns";

import { prisma } from "@/lib/prisma";
import { intervalMonths } from "@/lib/utils";

/**
 * The one place a payment turns into a membership.
 *
 * Both `/api/payments/verify` (client-driven, after signature check) and
 * `/api/webhooks/razorpay` (server-to-server) call these functions, so whichever
 * arrives first wins and the second is a no-op. Idempotency comes from two
 * things: `Payment.razorpayOrderId` is unique, and the CREATED → PAID flip is a
 * conditional `updateMany` inside a transaction. Under Postgres' READ COMMITTED
 * the loser of a race re-evaluates the WHERE clause after the winner commits,
 * sees status = PAID and matches zero rows — so a subscription can never be
 * extended twice for the same order.
 */

export type FulfilledPayment = {
  id: string;
  orderId: string;
  amountInPaise: number;
  status: "PAID";
  subscriptionId: string | null;
  endsAt: Date | null;
  planName: string | null;
};

export type FulfillResult =
  | { outcome: "paid"; payment: FulfilledPayment }
  | { outcome: "already_paid"; payment: FulfilledPayment }
  | { outcome: "not_found" }
  | { outcome: "amount_mismatch"; expectedInPaise: number; receivedInPaise: number };

type MarkPaidInput = {
  orderId: string;
  paymentId?: string | null;
  signature?: string | null;
  method?: string | null;
  /** Amount reported by the gateway, cross-checked against our own record. */
  reportedAmountInPaise?: number | null;
  /** When set, refuses to fulfil an order that belongs to someone else. */
  expectUserId?: string;
};

function shape(
  payment: {
    id: string;
    razorpayOrderId: string;
    amountInPaise: number;
    subscriptionId: string | null;
  },
  endsAt: Date | null,
  planName: string | null,
): FulfilledPayment {
  return {
    id: payment.id,
    orderId: payment.razorpayOrderId,
    amountInPaise: payment.amountInPaise,
    status: "PAID",
    subscriptionId: payment.subscriptionId,
    endsAt,
    planName,
  };
}

export async function markPaymentPaid(input: MarkPaidInput): Promise<FulfillResult> {
  const existing = await prisma.payment.findUnique({
    where: { razorpayOrderId: input.orderId },
    include: { plan: true, subscription: true },
  });

  if (!existing) return { outcome: "not_found" };
  if (input.expectUserId && existing.userId !== input.expectUserId) return { outcome: "not_found" };

  if (
    typeof input.reportedAmountInPaise === "number" &&
    input.reportedAmountInPaise !== existing.amountInPaise
  ) {
    return {
      outcome: "amount_mismatch",
      expectedInPaise: existing.amountInPaise,
      receivedInPaise: input.reportedAmountInPaise,
    };
  }

  // Replay: already settled. Backfill anything the first writer did not know
  // (the webhook carries the method, the client callback carries the signature)
  // but never touch the subscription again.
  if (existing.status === "PAID") {
    const backfill: Record<string, string> = {};
    if (input.paymentId && !existing.razorpayPaymentId) backfill.razorpayPaymentId = input.paymentId;
    if (input.signature && !existing.razorpaySignature) backfill.razorpaySignature = input.signature;
    if (input.method && !existing.method) backfill.method = input.method;
    const payment = Object.keys(backfill).length
      ? await prisma.payment.update({ where: { id: existing.id }, data: backfill })
      : existing;

    return {
      outcome: "already_paid",
      payment: shape(payment, existing.subscription?.endsAt ?? null, existing.plan?.name ?? null),
    };
  }

  return prisma.$transaction(async (tx) => {
    // The lock. Only one caller can move the row out of CREATED/FAILED.
    const claimed = await tx.payment.updateMany({
      where: { id: existing.id, status: { in: ["CREATED", "FAILED"] } },
      data: {
        status: "PAID",
        razorpayPaymentId: input.paymentId ?? existing.razorpayPaymentId,
        razorpaySignature: input.signature ?? existing.razorpaySignature,
        method: input.method ?? existing.method,
        failureReason: null,
      },
    });

    if (claimed.count === 0) {
      const fresh = await tx.payment.findUniqueOrThrow({
        where: { id: existing.id },
        include: { plan: true, subscription: true },
      });
      return {
        outcome: "already_paid" as const,
        payment: shape(fresh, fresh.subscription?.endsAt ?? null, fresh.plan?.name ?? null),
      };
    }

    // A payment without a plan (a one-off charge) still settles, it just does
    // not grant membership time.
    if (!existing.planId || !existing.plan) {
      const fresh = await tx.payment.findUniqueOrThrow({ where: { id: existing.id } });
      return { outcome: "paid" as const, payment: shape(fresh, null, null) };
    }

    const now = new Date();
    const months = intervalMonths[existing.plan.interval] ?? 1;

    const current = await tx.subscription.findFirst({
      where: { userId: existing.userId, planId: existing.planId, status: "ACTIVE" },
      orderBy: { endsAt: "desc" },
    });

    // Renewing early should not cost the member days: stack onto the existing
    // end date when it is still in the future, otherwise start from today.
    const subscription = current
      ? await tx.subscription.update({
          where: { id: current.id },
          data: {
            status: "ACTIVE",
            endsAt: addMonths(current.endsAt > now ? current.endsAt : now, months),
          },
        })
      : await tx.subscription.create({
          data: {
            userId: existing.userId,
            planId: existing.planId,
            status: "ACTIVE",
            startsAt: now,
            endsAt: addMonths(now, months),
          },
        });

    // Switching plans retires the old membership rather than running two.
    await tx.subscription.updateMany({
      where: { userId: existing.userId, status: "ACTIVE", NOT: { id: subscription.id } },
      data: { status: "CANCELLED" },
    });

    const payment = await tx.payment.update({
      where: { id: existing.id },
      data: { subscriptionId: subscription.id },
    });

    return {
      outcome: "paid" as const,
      payment: shape(payment, subscription.endsAt, existing.plan.name),
    };
  });
}

export type FailResult =
  | { outcome: "failed" }
  | { outcome: "already_paid" }
  | { outcome: "not_found" };

/** Records a decline. Never downgrades a payment that already settled. */
export async function markPaymentFailed(input: {
  orderId: string;
  reason: string;
  paymentId?: string | null;
  method?: string | null;
  expectUserId?: string;
}): Promise<FailResult> {
  const existing = await prisma.payment.findUnique({
    where: { razorpayOrderId: input.orderId },
    select: { id: true, status: true, userId: true },
  });

  if (!existing) return { outcome: "not_found" };
  if (input.expectUserId && existing.userId !== input.expectUserId) return { outcome: "not_found" };
  if (existing.status === "PAID" || existing.status === "REFUNDED") return { outcome: "already_paid" };

  await prisma.payment.updateMany({
    where: { id: existing.id, status: "CREATED" },
    data: {
      status: "FAILED",
      failureReason: input.reason.slice(0, 240),
      razorpayPaymentId: input.paymentId ?? undefined,
      method: input.method ?? undefined,
    },
  });

  return { outcome: "failed" };
}
