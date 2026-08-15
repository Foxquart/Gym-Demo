"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cancelBooking } from "@/app/dashboard/actions";

/**
 * Two-step cancel. A destructive action gets a confirmation, but a dialog for
 * "give up your 7am spot" is heavier than the decision deserves.
 */
export function CancelBookingButton({
  bookingId,
  title,
}: {
  bookingId: string;
  title: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = React.useState(false);

  function run() {
    startTransition(async () => {
      const result = await cancelBooking(bookingId);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      setConfirming(false);
    });
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setConfirming(true)}
        aria-label={`Cancel your booking for ${title}`}
      >
        Cancel
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={`Confirm cancelling ${title}`}>
      <span className="hidden text-xs text-ink-muted sm:inline">Give up the spot?</span>
      <Button type="button" size="sm" variant="danger" loading={pending} onClick={run}>
        Yes, cancel
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => setConfirming(false)}
      >
        Keep it
      </Button>
    </div>
  );
}
