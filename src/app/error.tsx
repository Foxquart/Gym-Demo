"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Swap for your error reporter (Sentry, Axiom, …) in production.
    console.error(error);
  }, [error]);

  return (
    <main className="grain relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 size-[38rem] max-w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--clay) 30%, transparent) 0%, transparent 68%)",
        }}
      />

      <div className="relative z-[2] flex flex-col items-center gap-6">
        <Eyebrow>Something failed</Eyebrow>

        <h1 className="text-display-md text-ink">A set we couldn&apos;t finish.</h1>

        <p className="max-w-md text-pretty text-ink-muted">
          Something broke on our side. Try again — if it keeps happening, tell the front desk and
          quote the reference below.
        </p>

        {error.digest && (
          <code className="rounded-full border border-border bg-bg-subtle px-3 py-1 font-mono text-xs text-ink-faint">
            {error.digest}
          </code>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={reset}>
            <RotateCcw className="size-4" />
            Try again
          </Button>
          <ButtonLink href="/" variant="outline" size="lg">
            Back to the club
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
