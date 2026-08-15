"use client";

import * as React from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MockSheet, type MockAuthorized } from "@/components/checkout/mock-sheet";
import { formatINR } from "@/lib/utils";

/* ------------------------- Razorpay checkout typings ---------------------- */

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailure = {
  error?: { code?: string; description?: string; reason?: string; metadata?: { payment_id?: string } };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void; confirm_close?: boolean };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (payload: RazorpayFailure) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

/* --------------------------------- panel ---------------------------------- */

type CreateOrderResponse = {
  ok: boolean;
  error?: string;
  mode?: "live" | "mock";
  keyId?: string;
  order?: { id: string; amountInPaise: number; currency: string; receipt: string };
  plan?: { slug: string; name: string; interval: string };
  prefill?: { name: string; email: string; contact: string };
};

type Stage = "idle" | "creating" | "sheet" | "gateway" | "verifying";

export type PayPanelProps = {
  plan: { slug: string; name: string; priceInPaise: number };
  member: { name: string; email: string; phone: string | null };
  mode: "live" | "mock";
};

export function PayPanel({ plan, member, mode }: PayPanelProps) {
  const router = useRouter();
  const [stage, setStage] = React.useState<Stage>("idle");
  const [scriptFailed, setScriptFailed] = React.useState(false);
  const [order, setOrder] = React.useState<CreateOrderResponse | null>(null);

  const busy = stage !== "idle";
  const label =
    stage === "creating"
      ? "Opening a secure order…"
      : stage === "verifying"
        ? "Confirming with the bank…"
        : `Pay ${formatINR(plan.priceInPaise)}`;

  /** Razorpay's modal is its own document, so hand it our brand token as hex. */
  function brandColor() {
    if (typeof window === "undefined") return "#e4572e";
    const token = getComputedStyle(document.documentElement).getPropertyValue("--brand").trim();
    return token || "#e4572e";
  }

  const finish = React.useCallback(
    async (payload: Record<string, string>) => {
      setStage("verifying");
      try {
        const response = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          redirectTo?: string;
          orderId?: string;
        };

        const target =
          data.redirectTo ??
          `/checkout/success?order=${encodeURIComponent(String(payload.razorpay_order_id))}`;

        if (!data.ok) toast.error(data.error ?? "That payment didn't go through.");
        router.replace(target);
        router.refresh();
      } catch {
        setStage("idle");
        toast.error("We couldn't reach the club's servers. Your card has not been charged twice.");
      }
    },
    [router],
  );

  function openLiveCheckout(data: CreateOrderResponse) {
    const Razorpay = window.Razorpay;
    if (!Razorpay || !data.order || !data.keyId) {
      setStage("idle");
      toast.error("The payment window couldn't load. Check your connection and try again.");
      return;
    }

    setStage("gateway");
    const checkout = new Razorpay({
      key: data.keyId,
      amount: data.order.amountInPaise,
      currency: data.order.currency,
      name: "Ember Athletic Club",
      description: `${plan.name} membership`,
      order_id: data.order.id,
      prefill: {
        name: data.prefill?.name ?? member.name,
        email: data.prefill?.email ?? member.email,
        contact: data.prefill?.contact ?? member.phone ?? "",
      },
      notes: { planSlug: plan.slug },
      theme: { color: brandColor() },
      handler: (response) => {
        void finish({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => {
          setStage("idle");
          toast("Payment window closed. Your order is still open — pay whenever you're ready.");
        },
      },
    });

    checkout.on("payment.failed", (payload) => {
      void finish({
        razorpay_order_id: data.order!.id,
        status: "failed",
        reason: payload.error?.description ?? payload.error?.reason ?? "The payment was declined.",
        code: payload.error?.code ?? "",
        razorpay_payment_id: payload.error?.metadata?.payment_id ?? "",
      });
    });

    checkout.open();
  }

  async function startPayment() {
    if (busy) return;
    setStage("creating");
    try {
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: plan.slug }),
      });
      const data = (await response.json()) as CreateOrderResponse;

      if (!response.ok || !data.ok || !data.order) {
        setStage("idle");
        toast.error(data.error ?? "We couldn't start that payment. Try again in a moment.");
        return;
      }

      setOrder(data);

      if (data.mode === "mock") {
        setStage("sheet");
        return;
      }

      openLiveCheckout(data);
    } catch {
      setStage("idle");
      toast.error("We couldn't reach the club's servers. Check your connection and try again.");
    }
  }

  /* ------------------------------ mock handlers ----------------------------- */

  function onMockAuthorized(result: MockAuthorized) {
    if (!order?.order) return;
    void finish({
      razorpay_order_id: order.order.id,
      razorpay_payment_id: result.razorpay_payment_id,
      razorpay_signature: result.razorpay_signature,
      method: result.method,
    });
  }

  function onMockDeclined(result: { reason: string; code?: string; method: string }) {
    if (!order?.order) return;
    void finish({
      razorpay_order_id: order.order.id,
      status: "failed",
      reason: result.reason,
      code: result.code ?? "",
      method: result.method,
    });
  }

  /* --------------------------------- render -------------------------------- */

  return (
    <>
      {mode === "live" && (
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
          onError={() => setScriptFailed(true)}
        />
      )}

      {/* Desktop / tablet: the button lives inside the order summary. */}
      <div className="hidden md:block">
        <Button size="lg" className="w-full" loading={busy} onClick={() => void startPayment()}>
          {label}
        </Button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink-faint">
          <Lock className="size-3" aria-hidden />
          {mode === "mock"
            ? "Test mode — a simulated sheet opens, nothing is charged"
            : "Card, UPI, netbanking and wallets via Razorpay"}
        </p>
        {scriptFailed && (
          <p role="alert" className="mt-2 text-center text-xs text-danger">
            The Razorpay window failed to load. Disable your ad blocker and refresh.
          </p>
        )}
      </div>

      {/* Phones: one-handed sticky bar so the total and the button are always
          within thumb reach, whatever the page scroll. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border glass px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] tracking-wide text-ink-faint uppercase">Total incl. GST</p>
            <p className="font-display text-lg leading-tight text-ink">
              {formatINR(plan.priceInPaise)}
            </p>
          </div>
          <Button
            size="lg"
            className="ml-auto flex-1 max-w-[62%]"
            loading={busy}
            onClick={() => void startPayment()}
          >
            {stage === "idle" ? "Pay now" : label}
          </Button>
        </div>
      </div>

      {stage === "sheet" && order?.order && (
        <MockSheet
          order={{ id: order.order.id, amountInPaise: order.order.amountInPaise }}
          planName={plan.name}
          member={{ name: member.name, email: member.email }}
          onCancel={() => {
            setStage("idle");
            toast("Test sheet closed. Your order is still open.");
          }}
          onAuthorized={onMockAuthorized}
          onDeclined={onMockDeclined}
        />
      )}
    </>
  );
}
