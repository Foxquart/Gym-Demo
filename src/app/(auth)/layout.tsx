import Link from "next/link";
import { ArrowLeft, Flame } from "lucide-react";

/**
 * Split-screen auth shell.
 *
 * Desktop: form on the left, an editorial panel on the right that carries the
 * brand so the form itself can stay plain and fast to fill.
 * Mobile: single column — the panel is decoration, and decoration doesn't get
 * to push the password field below the fold.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* ------------------------------- Form side ------------------------------ */}
      <div className="flex min-h-dvh flex-col px-5 py-6 sm:px-8 lg:min-h-0 lg:px-12 xl:px-20">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 rounded-full py-2 pr-3 text-ink"
          >
            <span className="grid size-9 place-items-center rounded-full bg-brand text-brand-ink">
              <Flame className="size-[18px]" aria-hidden />
            </span>
            <span className="font-display text-[17px] tracking-tight">Ember</span>
          </Link>

          <Link
            href="/"
            className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[13px] text-ink-muted transition-colors duration-200 hover:text-brand"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to site
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <div className="w-full max-w-[27rem]">{children}</div>
        </main>

        <footer className="text-xs text-ink-faint">
          Ember Athletic Club · Bandra West, Mumbai · 5am–11pm, every day
        </footer>
      </div>

      {/* ----------------------------- Editorial side --------------------------- */}
      {/* `dark` is re-declared here on purpose: the panel sits on a permanently
          dark photograph, so it should read the dark palette in either theme
          rather than hard-code a second set of colours. */}
      <aside className="dark relative hidden overflow-hidden bg-bg-subtle lg:block">
        {/* Plain <img>: next/image would need a remotePatterns entry in a config
            file this route doesn't own. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=80"
          alt="A coach spotting a member through the last rep of a back squat on the Ember training floor."
          className="absolute inset-0 size-full object-cover"
        />

        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_top,rgba(28,20,16,0.92)_0%,rgba(28,20,16,0.55)_45%,rgba(28,20,16,0.25)_100%)]"
        />
        <div aria-hidden className="grain absolute inset-0" />

        <div className="relative z-[2] flex h-full flex-col justify-end p-12 xl:p-16">
          <p className="flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.22em] text-brand uppercase">
            <span className="h-px w-8 bg-brand" aria-hidden />
            Member since 2023
          </p>

          <blockquote className="mt-6 max-w-[22ch] font-serif text-[clamp(2rem,2.6vw,3rem)] leading-[1.1] text-ink italic">
            &ldquo;Nine years of gym memberships and nobody had ever watched me lift. Six weeks here
            and I finally know what my back is meant to be doing.&rdquo;
          </blockquote>

          <footer className="mt-7 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=120&q=80"
              alt=""
              className="size-11 rounded-full object-cover ring-2 ring-border-strong"
            />
            <div className="text-sm leading-tight">
              <p className="font-medium text-ink">Kavya Iyer</p>
              <p className="text-ink-muted">Forge plan · 4 sessions a week</p>
            </div>
          </footer>

          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-border-strong pt-8">
            {[
              ["1,400+", "members on the floor"],
              ["18", "coaches, all salaried"],
              ["4.9", "average class rating"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="font-display text-2xl text-ink">{value}</dt>
                <dd className="mt-1 text-xs leading-snug text-ink-faint">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  );
}
