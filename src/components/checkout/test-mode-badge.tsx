import { ShieldCheck, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * The one place the payment mode is surfaced. Never prints a key or a secret —
 * only which of the two providers is wired up.
 */
export function TestModeBadge({
  mode,
  className,
}: {
  mode: "live" | "mock";
  className?: string;
}) {
  if (mode === "live") {
    return (
      <Badge
        tone="success"
        className={cn("gap-1.5", className)}
        title="Live Razorpay keys are configured. Real money moves."
      >
        <ShieldCheck className="size-3" aria-hidden />
        Live
      </Badge>
    );
  }

  return (
    <Badge
      tone="amber"
      className={cn("gap-1.5", className)}
      title="No Razorpay keys configured — payments are simulated end to end. Nothing is charged."
    >
      <TriangleAlert className="size-3" aria-hidden />
      Test mode
    </Badge>
  );
}
