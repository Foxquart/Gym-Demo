import { NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLiveMode, isMockOrderId, mockAuthorize } from "@/lib/razorpay";
import { fail, ok } from "../_lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The simulated gateway. It stands exactly where Razorpay's servers stand in
 * live mode: it is the only thing that knows the signing secret, and it hands
 * back an `order_id|payment_id` signature that `/api/payments/verify` then has
 * to check for real. Disabled the moment live keys exist.
 */

const Body = z.object({
  orderId: z.string().min(6).max(64),
  outcome: z.enum(["success", "failure"]),
  method: z.enum(["upi", "card", "netbanking"]).default("upi"),
});

const DECLINES: Record<string, string> = {
  upi: "The UPI request timed out before your bank confirmed it.",
  card: "Your bank declined this card. No money left your account.",
  netbanking: "Your bank's payment page ended the session before it completed.",
};

export async function POST(request: NextRequest) {
  if (isLiveMode()) return fail("Mock payments are disabled while live keys are configured.", 404);

  const user = await getCurrentUser();
  if (!user) return fail("Sign in to continue.", 401);

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

  const { orderId, outcome, method } = parsed.data;
  if (!isMockOrderId(orderId)) return fail("That order wasn't created in test mode.", 400);

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: orderId },
    select: { id: true, userId: true, status: true },
  });

  if (!payment || payment.userId !== user.id) return fail("We couldn't find that order.", 404);
  if (payment.status === "PAID") return fail("That order has already been paid.", 409);

  if (outcome === "failure") {
    return ok({
      result: "declined",
      razorpay_order_id: orderId,
      code: "BAD_REQUEST_ERROR",
      reason: DECLINES[method] ?? DECLINES.card,
      method,
    });
  }

  const authorized = mockAuthorize(orderId);
  return ok({
    result: "authorized",
    razorpay_order_id: orderId,
    method,
    ...authorized,
  });
}
