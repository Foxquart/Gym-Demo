import { NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildReceipt, getProvider, isMockOrderId } from "@/lib/razorpay";
import { describeError, fail, ok } from "../_lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  planSlug: z
    .string()
    .min(1, "Pick a plan first.")
    .max(64)
    .regex(/^[a-z0-9-]+$/i, "That plan reference doesn't look right."),
});

/** Reuse an unpaid order created in the last 20 minutes instead of piling up rows. */
const REUSE_WINDOW_MS = 20 * 60 * 1000;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail("Sign in to start a membership.", 401);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail("We couldn't read that request.", 400);
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "That request wasn't valid.", 422);
  }

  const plan = await prisma.plan.findUnique({ where: { slug: parsed.data.planSlug } });
  if (!plan || !plan.active) return fail("That plan isn't on sale right now.", 404);

  // The amount is never taken from the client. It is read from the plan row,
  // in paise, every single time.
  const amountInPaise = plan.priceInPaise;
  if (!Number.isInteger(amountInPaise) || amountInPaise < 100) {
    return fail("That plan is misconfigured — please tell the front desk.", 500);
  }

  const provider = getProvider();

  try {
    const reusable = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        planId: plan.id,
        status: "CREATED",
        amountInPaise,
        createdAt: { gte: new Date(Date.now() - REUSE_WINDOW_MS) },
      },
      orderBy: { createdAt: "desc" },
    });

    // Only reuse an order minted by the mode we are currently in — a mock order
    // id would be meaningless to the real Razorpay checkout, and vice versa.
    const canReuse =
      reusable && isMockOrderId(reusable.razorpayOrderId) === (provider.mode === "mock");

    const order = canReuse
      ? {
          id: reusable.razorpayOrderId,
          amountInPaise: reusable.amountInPaise,
          currency: reusable.currency,
          receipt: buildReceipt(user.id),
        }
      : await provider.createOrder({
          amountInPaise,
          receipt: buildReceipt(user.id),
          notes: { planSlug: plan.slug, planName: plan.name, userId: user.id, email: user.email },
        });

    if (!canReuse) {
      await prisma.payment.create({
        data: {
          userId: user.id,
          planId: plan.id,
          amountInPaise,
          currency: "INR",
          status: "CREATED",
          razorpayOrderId: order.id,
        },
      });
    }

    return ok({
      mode: provider.mode,
      keyId: provider.keyId,
      order: {
        id: order.id,
        amountInPaise,
        currency: "INR",
        receipt: order.receipt,
      },
      plan: { slug: plan.slug, name: plan.name, interval: plan.interval },
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone ?? "",
      },
    });
  } catch (error) {
    console.error("[payments/create-order]", error);
    return fail(
      describeError(error, "We couldn't reach the payment gateway. Try again in a moment."),
      502,
    );
  }
}
