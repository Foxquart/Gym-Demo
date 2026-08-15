import { NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { getProvider } from "@/lib/razorpay";
import { markPaymentFailed, markPaymentPaid } from "../_lib/fulfill";
import { fail, ok } from "../_lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const orderId = z.string().min(6).max(64);

const SuccessBody = z.object({
  razorpay_order_id: orderId,
  razorpay_payment_id: z.string().min(6).max(64),
  razorpay_signature: z.string().min(16).max(512),
  method: z.string().max(32).optional(),
});

const FailureBody = z.object({
  razorpay_order_id: orderId,
  status: z.literal("failed"),
  razorpay_payment_id: z.string().max(64).optional(),
  reason: z.string().max(240).optional(),
  code: z.string().max(64).optional(),
  method: z.string().max(32).optional(),
});

const Body = z.union([FailureBody, SuccessBody]);

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail("Sign in to finish this payment.", 401);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail("We couldn't read that request.", 400);
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "That payment response wasn't valid.", 422);
  }

  const body = parsed.data;
  const redirectTo = `/checkout/success?order=${encodeURIComponent(body.razorpay_order_id)}`;

  try {
    /* ------------------------- the gateway declined ------------------------ */
    if ("status" in body) {
      const reason = body.reason?.trim() || "The payment was declined.";
      const result = await markPaymentFailed({
        orderId: body.razorpay_order_id,
        reason: body.code ? `${reason} (${body.code})` : reason,
        paymentId: body.razorpay_payment_id?.trim() || null,
        method: body.method?.trim() || null,
        expectUserId: user.id,
      });

      if (result.outcome === "not_found") return fail("We couldn't find that order.", 404);
      if (result.outcome === "already_paid") {
        // A webhook already captured it — a late failure callback must not undo that.
        return ok({ status: "PAID", orderId: body.razorpay_order_id, redirectTo });
      }
      return fail(reason, 200, { status: "FAILED", orderId: body.razorpay_order_id, redirectTo });
    }

    /* --------------------------- signature check --------------------------- */
    const provider = getProvider();
    const valid = provider.verifyPaymentSignature({
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    });

    if (!valid) {
      await markPaymentFailed({
        orderId: body.razorpay_order_id,
        reason: "Signature verification failed — payment not trusted.",
        paymentId: body.razorpay_payment_id,
        expectUserId: user.id,
      });
      return fail("We couldn't verify that payment. Nothing has been charged to your membership.", 400, {
        status: "FAILED",
        orderId: body.razorpay_order_id,
        redirectTo,
      });
    }

    /* ------------------------------ settlement ----------------------------- */
    const result = await markPaymentPaid({
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
      method: body.method ?? null,
      expectUserId: user.id,
    });

    if (result.outcome === "not_found") return fail("We couldn't find that order.", 404);
    if (result.outcome === "amount_mismatch") {
      console.error("[payments/verify] amount mismatch", result);
      return fail("That payment didn't match the order total. The front desk has been notified.", 409);
    }

    return ok({
      status: "PAID",
      replay: result.outcome === "already_paid",
      orderId: result.payment.orderId,
      amountInPaise: result.payment.amountInPaise,
      subscriptionId: result.payment.subscriptionId,
      endsAt: result.payment.endsAt?.toISOString() ?? null,
      redirectTo,
    });
  } catch (error) {
    console.error("[payments/verify]", error);
    return fail("Something went wrong confirming that payment. Nothing was charged twice.", 500, {
      orderId: body.razorpay_order_id,
      redirectTo,
    });
  }
}
