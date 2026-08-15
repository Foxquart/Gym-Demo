"use client";

import * as React from "react";
import { CreditCard, Landmark, Lock, Smartphone, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn, formatINR } from "@/lib/utils";

/**
 * The stand-in for Razorpay's hosted checkout when no keys are configured.
 *
 * It is not a stub: choosing an outcome calls `/api/payments/mock`, which signs
 * a real HMAC on the server, and the result travels through the same
 * `/api/payments/verify` signature check as a live payment. The only thing that
 * is fake is the bank.
 */

type Method = "upi" | "card" | "netbanking";
type Outcome = "success" | "failure";

const METHODS: { id: Method; label: string; hint: string; icon: React.ElementType }[] = [
  { id: "upi", label: "UPI", hint: "GPay · PhonePe · Paytm", icon: Smartphone },
  { id: "card", label: "Card", hint: "Visa · Mastercard · RuPay", icon: CreditCard },
  { id: "netbanking", label: "Netbanking", hint: "All major Indian banks", icon: Landmark },
];

export type MockAuthorized = {
  razorpay_payment_id: string;
  razorpay_signature: string;
  method: string;
};

export function MockSheet({
  order,
  planName,
  member,
  onCancel,
  onAuthorized,
  onDeclined,
}: {
  order: { id: string; amountInPaise: number };
  planName: string;
  member: { name: string; email: string };
  onCancel: () => void;
  onAuthorized: (result: MockAuthorized) => void;
  onDeclined: (result: { reason: string; code?: string; method: string }) => void;
}) {
  const [method, setMethod] = React.useState<Method>("upi");
  const [outcome, setOutcome] = React.useState<Outcome>("success");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const dialogRef = React.useRef<HTMLDivElement>(null);
  const busyRef = React.useRef(busy);
  busyRef.current = busy;

  // Focus management: move focus into the sheet, keep Tab inside it, and put
  // focus back where it came from on close.
  React.useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busyRef.current) {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [onCancel]);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      // A beat of latency so the flow feels like a real gateway hop.
      await new Promise((resolve) => setTimeout(resolve, 700));
      const response = await fetch("/api/payments/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, outcome, method }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        result?: "authorized" | "declined";
        reason?: string;
        code?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
      };

      if (!response.ok || !data.ok) {
        setError(data.error ?? "The test gateway didn't respond. Try again.");
        setBusy(false);
        return;
      }

      if (data.result === "declined") {
        onDeclined({
          reason: data.reason ?? "The payment was declined.",
          code: data.code,
          method,
        });
        return;
      }

      onAuthorized({
        razorpay_payment_id: data.razorpay_payment_id!,
        razorpay_signature: data.razorpay_signature!,
        method,
      });
    } catch {
      setError("We couldn't reach the test gateway. Check the dev server and try again.");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[2px]"
        onClick={() => !busy && onCancel()}
        aria-hidden
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mock-sheet-title"
        aria-describedby="mock-sheet-desc"
        tabIndex={-1}
        className={cn(
          // Wide rather than tall: on anything above a phone the sheet spreads
          // into two columns so it never outgrows the viewport height.
          "relative w-full max-w-md sm:max-w-2xl lg:max-w-3xl",
          "overflow-hidden bg-surface shadow-[var(--shadow-lg)] outline-none",
          "rounded-t-[var(--radius-card)] sm:rounded-[var(--radius-card)]",
          "border border-border max-h-[92svh] overflow-y-auto overscroll-contain",
        )}
      >
        {/* Header — mirrors the real Razorpay sheet: who, how much. */}
        <div className="flex items-start justify-between gap-4 border-b border-border bg-bg-subtle p-5">
          <div>
            <p id="mock-sheet-title" className="font-display text-base tracking-tight text-ink">
              Ember Athletic Club
            </p>
            <p id="mock-sheet-desc" className="mt-1 text-sm text-ink-muted">
              {planName} · {formatINR(order.amountInPaise)} incl. GST
            </p>
            <p className="mt-1 font-mono text-[11px] text-ink-faint">{order.id}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close the payment sheet"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-surface hover:text-ink disabled:opacity-40"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-5 sm:p-6">
          <p className="rounded-xl border border-amber/30 bg-amber/10 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-muted sm:col-span-2">
            <span className="font-semibold text-amber">Test mode.</span> No Razorpay keys are
            configured, so this sheet stands in for the real one. The signature it returns is still
            verified on the server before your membership starts.
          </p>

          <fieldset className="min-w-0">
            <legend className="mb-2 text-[13px] font-medium text-ink-muted">Payment method</legend>
            <div className="space-y-2">
              {METHODS.map((m) => {
                const Icon = m.icon;
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={busy}
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors duration-200",
                      "min-h-[52px] disabled:opacity-60",
                      active
                        ? "border-brand bg-brand-soft"
                        : "border-border bg-surface hover:border-border-strong",
                    )}
                  >
                    <Icon
                      className={cn("size-[18px] shrink-0", active ? "text-brand" : "text-ink-faint")}
                      aria-hidden
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-ink">{m.label}</span>
                      <span className="block text-xs text-ink-faint">{m.hint}</span>
                    </span>
                    <span
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded-full border",
                        active ? "border-brand" : "border-border-strong",
                      )}
                    >
                      {active && <span className="size-2 rounded-full bg-brand" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex min-w-0 flex-col gap-4">
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-ink-muted">
                Simulate the bank&rsquo;s answer
              </legend>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-bg-subtle p-1">
                {(
                  [
                    { id: "success", label: "Approve" },
                    { id: "failure", label: "Decline" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={outcome === o.id}
                    disabled={busy}
                    onClick={() => setOutcome(o.id)}
                    className={cn(
                      "h-10 rounded-lg text-[13px] font-medium transition-all duration-200",
                      outcome === o.id
                        ? "bg-surface text-ink shadow-[var(--shadow-sm)]"
                        : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="rounded-xl border border-border bg-bg-subtle px-3.5 py-3 text-[13px] break-words text-ink-muted">
              Paying as <span className="text-ink">{member.name}</span> · {member.email}
            </div>

            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}

            {/* Pushed to the bottom of the column so the button lines up with
                the end of the method list on wide screens. */}
            <div className="mt-auto flex flex-col gap-3">
              <Button
                type="button"
                size="lg"
                className="w-full"
                loading={busy}
                onClick={() => void pay()}
              >
                {busy ? "Talking to the bank…" : `Pay ${formatINR(order.amountInPaise)}`}
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-ink-faint">
                <Lock className="size-3" aria-hidden />
                Simulated gateway · nothing is charged
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
