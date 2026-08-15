import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getProvider } from "@/lib/razorpay";
import { markPaymentFailed, markPaymentPaid } from "../../payments/_lib/fulfill";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Razorpay's server-to-server truth.
 *
 * The signature is an HMAC of the *raw* body, so this handler reads
 * `request.text()` and parses the JSON itself — anything that re-serialises the
 * payload first (whitespace, key order) would break the check. App Router route
 * handlers do no body parsing of their own, which is exactly what we want.
 *
 * Ordering does not matter: whether this arrives before or after the browser
 * calls /api/payments/verify, both funnel into the same idempotent
 * markPaymentPaid()/markPaymentFailed() pair, so the end state is identical.
 */

const PaymentEntity = z.object({
  id: z.string().optional(),
  order_id: z.string().nullish(),
  amount: z.number().optional(),
  method: z.string().nullish(),
  error_description: z.string().nullish(),
  error_reason: z.string().nullish(),
  error_code: z.string().nullish(),
});

const Event = z.object({
  event: z.string(),
  payload: z
    .object({
      payment: z.object({ entity: PaymentEntity }).optional(),
      order: z.object({ entity: z.object({ id: z.string().optional() }).passthrough() }).optional(),
    })
    .optional(),
});

function accepted(handled: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: true, handled, ...extra }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ ok: false, error: "Missing signature." }, { status: 400 });
    }

    const provider = getProvider();
    if (!provider.hasWebhookSecret()) {
      console.error("[webhooks/razorpay] RAZORPAY_WEBHOOK_SECRET is not set — rejecting event");
      return NextResponse.json({ ok: false, error: "Webhook not configured." }, { status: 503 });
    }

    // Raw text first, always. Parsing before verifying would defeat the check.
    const raw = await request.text();
    if (!provider.verifyWebhookSignature(raw, signature)) {
      return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 400 });
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json({ ok: false, error: "Malformed payload." }, { status: 400 });
    }

    const parsed = Event.safeParse(json);
    if (!parsed.success) return accepted("ignored:unparseable");

    const { event, payload } = parsed.data;
    const entity = payload?.payment?.entity;
    const orderId = entity?.order_id ?? payload?.order?.entity?.id;

    if (!orderId) return accepted(`ignored:${event}`);

    switch (event) {
      case "payment.captured":
      case "order.paid": {
        const result = await markPaymentPaid({
          orderId,
          paymentId: entity?.id ?? null,
          method: entity?.method ?? null,
          reportedAmountInPaise: typeof entity?.amount === "number" ? entity.amount : null,
        });

        if (result.outcome === "amount_mismatch") {
          // Loud, but still a 200 — retrying will not change the numbers.
          console.error("[webhooks/razorpay] amount mismatch", { orderId, ...result });
          return accepted("amount_mismatch");
        }
        if (result.outcome === "not_found") return accepted("unknown_order");
        return accepted(result.outcome === "already_paid" ? "already_paid" : "paid", {
          subscriptionId: result.payment.subscriptionId,
        });
      }

      case "payment.failed": {
        const reason =
          entity?.error_description ??
          entity?.error_reason ??
          entity?.error_code ??
          "The payment failed at the bank.";
        const result = await markPaymentFailed({
          orderId,
          reason,
          paymentId: entity?.id ?? null,
          method: entity?.method ?? null,
        });
        return accepted(result.outcome === "not_found" ? "unknown_order" : result.outcome);
      }

      default:
        return accepted(`ignored:${event}`);
    }
  } catch (error) {
    // Razorpay retries non-2xx, so a genuine outage gets another attempt —
    // but it is a handled response, never an unhandled throw.
    console.error("[webhooks/razorpay]", error);
    return NextResponse.json({ ok: false, error: "Webhook processing failed." }, { status: 500 });
  }
}

/** Razorpay pings the URL when you add it in the dashboard. */
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "razorpay-webhook" }, { status: 200 });
}
