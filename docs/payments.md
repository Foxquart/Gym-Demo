# Payments

Membership checkout runs on **Razorpay Orders** with server-side signature verification and a
webhook for server-to-server truth. It ships with a **mock provider** so the entire flow works
before you have credentials.

## Two modes, one code path

`src/lib/razorpay.ts` exposes a single `getProvider()`. Everything else — routes, UI, fulfilment —
is written against that interface and never branches on environment variables.

| | Live mode | Mock mode |
| --- | --- | --- |
| Trigger | `RAZORPAY_KEY_ID` **and** `RAZORPAY_KEY_SECRET` both set | either one empty |
| Order creation | Razorpay REST API | local, id prefixed `order_MOCK` |
| Payment sheet | `checkout.razorpay.com/v1/checkout.js` | in-app sheet, `src/components/checkout/mock-sheet.tsx` |
| Signature | HMAC-SHA256 with `RAZORPAY_KEY_SECRET` | HMAC-SHA256 with `AUTH_SECRET` |
| DB writes, subscription activation, redirects | identical | identical |

Mock mode is not a stub. It still creates a `Payment` row, still produces an
`order_id|payment_id` HMAC, and `/api/payments/verify` still checks that signature for real —
a forged one is rejected exactly as in production. `/api/payments/mock` refuses to run the moment
live keys are present.

## Configuration

```bash
RAZORPAY_KEY_ID=""              # rzp_test_… — server side
RAZORPAY_KEY_SECRET=""          # server side, never exposed
RAZORPAY_WEBHOOK_SECRET=""      # whatever you typed into the dashboard webhook form
NEXT_PUBLIC_RAZORPAY_KEY_ID=""  # the same key id, this one reaches the browser
```

Get test keys at **Dashboard → Account & Settings → API Keys** (make sure the dashboard is in
*Test mode*). `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID` hold the same value; only the
public one is sent to the client. The secret is read exclusively in server code.

## The flow

```
/checkout/[slug]
      │  POST /api/payments/create-order   { planSlug }
      │      → Payment row, status CREATED, razorpayOrderId stored
      │      ← { mode, keyId, order: { id, amountInPaise, … }, plan, prefill }
      ▼
Razorpay Checkout modal  (or the mock sheet)
      │  POST /api/payments/verify   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
      │      → signature checked → Payment PAID → Subscription created/extended
      │      ← { status, replay, subscriptionId, endsAt, redirectTo }
      ▼
/checkout/success?order=order_…

meanwhile, independently:
POST /api/webhooks/razorpay   payment.captured | order.paid | payment.failed
      → same idempotent markPaymentPaid() / markPaymentFailed()
```

**The amount is never taken from the client.** `create-order` reads `Plan.priceInPaise` from the
database on every request, and the webhook rejects any event whose reported amount disagrees with
the stored order (`handled: "amount_mismatch"` — logged loudly, still a 200, no subscription
granted).

### Idempotency

`markPaymentPaid()` is the only thing that flips a payment to `PAID`, and it keys off
`razorpayOrderId`, which is `@unique`. Whichever arrives first — the browser's verify call or the
webhook — wins; the second observes the payment is already `PAID` and returns the existing
`subscriptionId` with `replay: true` / `handled: "already_paid"`. A subscription is never
double-extended, and a webhook retry is always safe.

## Testing without keys

`npm run dev`, sign in as `member@ember.club` / `password123`, pick a plan at `/checkout`, and the
mock sheet lets you choose success or failure and a payment method. A failed attempt records a
`FAILED` payment with a bank-style reason and offers a retry.

To drive it from the shell:

```bash
# 1. create an order (needs a session cookie)
curl -s -X POST localhost:3000/api/payments/create-order \
  -H 'Content-Type: application/json' -H "Cookie: ember_session=$TOKEN" \
  -d '{"planSlug":"forge"}'

# 2. have the simulated gateway authorise it — returns a real signature
curl -s -X POST localhost:3000/api/payments/mock \
  -H 'Content-Type: application/json' -H "Cookie: ember_session=$TOKEN" \
  -d '{"orderId":"order_MOCK…","outcome":"success","method":"upi"}'

# 3. verify, exactly as the browser would
curl -s -X POST localhost:3000/api/payments/verify \
  -H 'Content-Type: application/json' -H "Cookie: ember_session=$TOKEN" \
  -d '{"razorpay_order_id":"order_MOCK…","razorpay_payment_id":"pay_MOCK…","razorpay_signature":"…"}'
```

## Testing with real test keys

Fill in all four variables and restart. The "Test mode" badge stays on the checkout page — it
reflects the Razorpay *key* being a test key, not the mock provider.

**Test cards** (any future expiry, any CVV):

| Card | Result |
| --- | --- |
| `4111 1111 1111 1111` | success |
| `5104 0600 0000 0008` | success (Mastercard) |
| `4000 0000 0000 0002` | failure — declined |

**Test UPI:** `success@razorpay` succeeds, `failure@razorpay` fails.
**Test netbanking:** pick any bank, then click the success/failure button on the simulator page.

Never use real card numbers against test keys.

## Moving real money (the ₹1 live test)

**Test keys never move money.** No amount of testing with `rzp_test_…` will produce a real debit,
a settlement, or a bank statement line. To see money actually move you need a *live* key, which
means an activated Razorpay account.

### 1. Activate the account

Dashboard → **Account & Settings → Account activation**. Razorpay asks for:

- Business type (Individual / Proprietorship / Pvt Ltd — an individual account is fine to start)
- **PAN** of the business or the individual
- **Bank account** in the same name, for settlements
- Address proof, and GSTIN if you have one
- Your website or app URL, and the category (Fitness / Health)

Approval typically takes 1–3 working days. Until it completes, the Live keys section stays locked.

### 2. Switch the dashboard to Live and generate keys

Flip the **Test / Live** toggle at the top of the dashboard, then
**Account & Settings → API Keys → Generate Live Key**. The secret is shown exactly once.

```bash
RAZORPAY_KEY_ID="rzp_live_…"
RAZORPAY_KEY_SECRET="…"
RAZORPAY_WEBHOOK_SECRET="…"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_…"
```

Restart the app. `isLiveMode()` now returns true, the mock sheet is gone, `/api/payments/mock`
returns 404, and the real Razorpay modal loads.

### 3. Pay ₹1 to yourself

The seed ships a hidden plan for exactly this:

| | |
| --- | --- |
| URL | `/checkout/live-test` |
| Charge | **₹1.00** (₹0.85 base + ₹0.15 GST — the GST is inclusive, so the debit is exactly ₹1) |
| Visibility | `internal: true` — never appears on `/pricing`, `/checkout`, or the landing page |

₹1 is Razorpay's live minimum; anything smaller is rejected. Open `/checkout/live-test` while
signed in, pay with your own UPI id or card, and you should see:

- a real debit on your phone / bank app
- the payment in **Dashboard → Transactions → Payments** with status `captured`
- a `PAID` row in the app's `Payment` table and an active `Subscription`
- settlement into your bank account on the usual T+2 working-day cycle

Refund it from **Transactions → Payments → the payment → Refund** when you're done. The refund
lands back in 5–7 working days. Note that Razorpay's fee (~2% + GST) is **not** returned on a
refund, so a ₹1 round trip costs you a few paise — deliberately trivial.

To change the amount, edit the plan in the admin portal at `/admin/plans` (it is visible there,
just not to customers) or re-run `npm run db:seed`.

> Keep the live secret out of git. `.env` is already ignored; use your host's secret manager in
> production rather than committing anything.

## Webhooks

1. Expose your dev server: `ngrok http 3000`
2. Dashboard → **Settings → Webhooks → Add New Webhook**
3. URL `https://<your-ngrok-host>/api/webhooks/razorpay`, secret → `RAZORPAY_WEBHOOK_SECRET`
4. Subscribe to `payment.captured`, `payment.failed`, and optionally `order.paid`
5. Restart the app so it picks up the secret

The handler reads the **raw** request body before parsing, because the signature is an HMAC of the
exact bytes Razorpay sent — re-serialising the JSON first would change whitespace or key order and
break verification. A missing or invalid signature is a `400`; an unrecognised event is a `200`
with `handled: "ignored:<event>"` so Razorpay stops retrying. Genuine processing failures return
`500`, which Razorpay retries.

`GET /api/webhooks/razorpay` returns `200` for the dashboard's reachability ping.

To exercise it locally without ngrok, sign the body yourself — in mock mode the webhook secret
falls back to `AUTH_SECRET`:

```bash
BODY='{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_x","order_id":"order_MOCK…","amount":399000,"method":"card"}}}}'
SIG=$(node -e "console.log(require('crypto').createHmac('sha256',process.env.AUTH_SECRET).update(process.argv[1]).digest('hex'))" "$BODY")
curl -s -X POST localhost:3000/api/webhooks/razorpay \
  -H 'Content-Type: application/json' -H "x-razorpay-signature: $SIG" -d "$BODY"
```

## Going to production

- Swap test keys for live keys and re-point the webhook at your real domain.
- Razorpay requires HTTPS for live webhooks.
- Keep `AUTH_SECRET` stable — rotating it invalidates sessions *and* any mock signatures in flight.
- Consider Razorpay **Subscriptions** if you want the gateway to auto-charge on renewal. Today the
  app records a paid period and advances `Subscription.endsAt`; renewal is a fresh checkout.
- `Payment.razorpaySignature` is stored for dispute forensics; treat the table as financial data.
