import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="grain relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Warm ambient glow behind the numeral */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 size-[42rem] max-w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--brand) 26%, transparent) 0%, transparent 68%)",
        }}
      />

      <div className="relative z-[2] flex flex-col items-center gap-6">
        <Eyebrow>Error 404</Eyebrow>

        <h1 className="text-display-lg text-gradient-ember">Rack empty.</h1>

        <p className="max-w-md text-pretty text-ink-muted">
          The page you were reaching for isn&apos;t here. It may have been moved, renamed, or it
          never made it onto the floor.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/" size="lg">
            Back to the club
          </ButtonLink>
          <ButtonLink href="/classes" variant="outline" size="lg">
            See the timetable
          </ButtonLink>
        </div>

        <p className="mt-4 text-sm text-ink-faint">
          Already a member?{" "}
          <Link href="/dashboard" className="text-brand underline-offset-4 hover:underline">
            Go to your dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
