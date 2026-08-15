import type { Metadata } from "next";

import { CheckoutHeader } from "@/components/checkout/checkout-header";
import { isLiveMode } from "@/lib/razorpay";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const mode = isLiveMode() ? "live" : "mock";

  return (
    <div className="relative min-h-dvh bg-bg grain">
      <CheckoutHeader mode={mode} />
      <main className="relative z-[2]">{children}</main>
      <footer className="container-edge relative z-[2] border-t border-border py-8">
        <div className="flex flex-col gap-2 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            Payments handled by Razorpay. Ember never sees or stores your card number.
          </p>
          <p>
            Questions? <span className="text-ink-muted">frontdesk@ember.club</span> · +91 22 4000
            1200
          </p>
        </div>
      </footer>
    </div>
  );
}
