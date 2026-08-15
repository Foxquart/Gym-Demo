import "server-only";

import crypto from "node:crypto";
import Razorpay from "razorpay";

/**
 * Ember's payment provider layer.
 *
 * The whole checkout talks to `getProvider()` and never reads a Razorpay env var
 * directly. Two implementations sit behind that interface:
 *
 *   live — real Razorpay REST orders + real HMAC-SHA256 signatures, used the
 *          moment RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are both present.
 *   mock — local order ids and a deterministic HMAC keyed on AUTH_SECRET, so a
 *          fresh clone with an empty .env still exercises every branch:
 *          order → payment → signature verification → subscription.
 *
 * Nothing here is ever imported by a client component ("server-only" above makes
 * that a build error). Only `provider.keyId` is safe to hand to the browser.
 */

export type ProviderMode = "live" | "mock";

export type ProviderOrder = {
  id: string;
  amountInPaise: number;
  currency: string;
  receipt: string;
  status: string;
  createdAt: number;
};

export type CreateOrderInput = {
  amountInPaise: number;
  receipt: string;
  notes?: Record<string, string>;
};

export type PaymentSignatureInput = {
  orderId: string;
  paymentId: string;
  signature: string;
};

export interface PaymentProvider {
  readonly mode: ProviderMode;
  /** Publishable key id — the only credential allowed to reach the browser. */
  readonly keyId: string;
  createOrder(input: CreateOrderInput): Promise<ProviderOrder>;
  /** HMAC-SHA256 of `order_id|payment_id`, compared in constant time. */
  verifyPaymentSignature(input: PaymentSignatureInput): boolean;
  /** HMAC-SHA256 of the raw webhook body against the webhook secret. */
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  /** Whether a webhook secret is configured at all. */
  hasWebhookSecret(): boolean;
}

/* ------------------------------ env plumbing ------------------------------ */

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** Placeholder key id shown in mock mode. Deliberately obvious in the DOM. */
export const MOCK_KEY_ID = "rzp_test_mockemberclub";

/** Mock orders carry this prefix so they can never be confused with live ones. */
const MOCK_ORDER_PREFIX = "order_MOCK";
const MOCK_PAYMENT_PREFIX = "pay_MOCK";

export function isLiveMode(): boolean {
  return Boolean(env("RAZORPAY_KEY_ID") && env("RAZORPAY_KEY_SECRET"));
}

export function isMockOrderId(orderId: string): boolean {
  return orderId.startsWith(MOCK_ORDER_PREFIX);
}

/** The signing secret for mock mode — real enough to be worth verifying. */
function mockSecret(): string {
  const secret = env("AUTH_SECRET");
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters. See .env.example");
  }
  return secret;
}

function hmac(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function randomId(bytes: number): string {
  // Razorpay ids are base62-ish; base36 is close enough to read naturally.
  return crypto.randomBytes(bytes).toString("hex").slice(0, bytes).toUpperCase();
}

/* -------------------------------- live mode ------------------------------- */

let liveClient: Razorpay | null = null;

function client(): Razorpay {
  if (!liveClient) {
    liveClient = new Razorpay({
      key_id: env("RAZORPAY_KEY_ID")!,
      key_secret: env("RAZORPAY_KEY_SECRET")!,
    });
  }
  return liveClient;
}

const liveProvider: PaymentProvider = {
  mode: "live",
  get keyId() {
    // NEXT_PUBLIC_ is what the browser bundle inlines; fall back to the server
    // copy so a half-filled .env still opens the real checkout.
    return env("NEXT_PUBLIC_RAZORPAY_KEY_ID") ?? env("RAZORPAY_KEY_ID")!;
  },

  async createOrder({ amountInPaise, receipt, notes }) {
    const order = await client().orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes,
    });
    return {
      id: order.id,
      amountInPaise: Number(order.amount),
      currency: order.currency,
      receipt: String(order.receipt ?? receipt),
      status: order.status,
      createdAt: Number(order.created_at) * 1000,
    };
  },

  verifyPaymentSignature({ orderId, paymentId, signature }) {
    const expected = hmac(`${orderId}|${paymentId}`, env("RAZORPAY_KEY_SECRET")!);
    return safeEqual(expected, signature);
  },

  verifyWebhookSignature(rawBody, signature) {
    const secret = env("RAZORPAY_WEBHOOK_SECRET");
    if (!secret) return false;
    return safeEqual(hmac(rawBody, secret), signature);
  },

  hasWebhookSecret() {
    return Boolean(env("RAZORPAY_WEBHOOK_SECRET"));
  },
};

/* -------------------------------- mock mode ------------------------------- */

const mockProvider: PaymentProvider = {
  mode: "mock",
  keyId: MOCK_KEY_ID,

  async createOrder({ amountInPaise, receipt }) {
    return {
      id: `${MOCK_ORDER_PREFIX}${randomId(10)}`,
      amountInPaise,
      currency: "INR",
      receipt,
      status: "created",
      createdAt: Date.now(),
    };
  },

  verifyPaymentSignature({ orderId, paymentId, signature }) {
    return safeEqual(hmac(`${orderId}|${paymentId}`, mockSecret()), signature);
  },

  verifyWebhookSignature(rawBody, signature) {
    // Prefer a configured webhook secret even in mock mode so the doc's ngrok
    // walkthrough works without keys; otherwise sign with AUTH_SECRET.
    const secret = env("RAZORPAY_WEBHOOK_SECRET") ?? mockSecret();
    return safeEqual(hmac(rawBody, secret), signature);
  },

  hasWebhookSecret() {
    return true;
  },
};

export function getProvider(): PaymentProvider {
  return isLiveMode() ? liveProvider : mockProvider;
}

/* ----------------------------- mock gateway ------------------------------- */

/**
 * Stands in for Razorpay's servers. Only reachable from `/api/payments/mock`,
 * which refuses to run when live keys are configured — the secret never leaves
 * the server, exactly like the real thing.
 */
export function mockAuthorize(orderId: string): {
  razorpay_payment_id: string;
  razorpay_signature: string;
} {
  if (isLiveMode()) throw new Error("mockAuthorize called while live keys are configured");
  const paymentId = `${MOCK_PAYMENT_PREFIX}${randomId(10)}`;
  return {
    razorpay_payment_id: paymentId,
    razorpay_signature: hmac(`${orderId}|${paymentId}`, mockSecret()),
  };
}

/** Signs a webhook body the way Razorpay would — used by the docs' curl recipe. */
export function signWebhookBody(rawBody: string): string {
  const secret = env("RAZORPAY_WEBHOOK_SECRET") ?? (isLiveMode() ? "" : mockSecret());
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not set");
  return hmac(rawBody, secret);
}

/* ----------------------------------- GST ---------------------------------- */

export const GST_RATE_PCT = 18;

/**
 * Plan prices are the amount actually charged, GST inclusive — so the line
 * items below always add up to the number on the Pay button. We show the split
 * because members ask for it at reimbursement time.
 */
export function gstBreakdown(totalInPaise: number) {
  const baseInPaise = Math.round(totalInPaise / (1 + GST_RATE_PCT / 100));
  return {
    baseInPaise,
    gstInPaise: totalInPaise - baseInPaise,
    totalInPaise,
    ratePct: GST_RATE_PCT,
  };
}

/** Receipt ids are capped at 40 chars by Razorpay. */
export function buildReceipt(userId: string): string {
  return `ember_${userId.slice(-10)}_${Date.now().toString(36)}`.slice(0, 40);
}
