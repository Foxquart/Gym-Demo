"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { useLenis } from "@/hooks/use-lenis";
import { cn } from "@/lib/utils";
import { NAV_LINKS, SOCIAL_LINKS } from "./nav-data";
import { Wordmark } from "./wordmark";

export type HeaderSession = { name: string; role: "USER" | "ADMIN" } | null;

export function HeaderNav({ session }: { session: HeaderSession }) {
  const pathname = usePathname();
  const lenis = useLenis();

  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  const headerRef = React.useRef<HTMLElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const firstLinkRef = React.useRef<HTMLAnchorElement>(null);
  const menuTl = React.useRef<gsap.core.Timeline | null>(null);
  const openRef = React.useRef(false);

  openRef.current = open;

  const dashboardHref = session?.role === "ADMIN" ? "/admin" : "/dashboard";

  /* ---------------------- scroll state + auto-hide ---------------------- */

  useGSAP(
    () => {
      const el = headerRef.current;
      if (!el) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const glass = ScrollTrigger.create({
        start: 10,
        end: () => ScrollTrigger.maxScroll(window),
        onToggle: (self) => setScrolled(self.isActive),
      });
      setScrolled(window.scrollY > 10);

      // Roll the bar away while reading down, bring it back the moment the
      // user scrolls up. Never hidden while the menu is open or focus is in it.
      const hide = () =>
        gsap.to(el, { yPercent: -105, duration: reduced ? 0 : 0.45, ease: "power3.out", overwrite: true });
      const show = () =>
        gsap.to(el, { yPercent: 0, duration: reduced ? 0 : 0.5, ease: "power3.out", overwrite: true });

      const peek = ScrollTrigger.create({
        start: 260,
        end: () => ScrollTrigger.maxScroll(window),
        onUpdate: (self) => {
          if (openRef.current || el.contains(document.activeElement)) return show();
          if (self.direction === 1) hide();
          else show();
        },
        onLeaveBack: show,
      });

      return () => {
        glass.kill();
        peek.kill();
      };
    },
    { scope: headerRef },
  );

  /* --------------------------- mobile menu tl --------------------------- */

  useGSAP(
    () => {
      const panel = panelRef.current;
      if (!panel) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const d = (n: number) => (reduced ? 0 : n);

      gsap.set(panel, { autoAlpha: 0 });

      menuTl.current = gsap
        .timeline({ paused: true, defaults: { ease: "expo.out" } })
        .set(panel, { pointerEvents: "auto" })
        .to(panel, { autoAlpha: 1, duration: d(0.3), ease: "power2.out" })
        .from(".js-menu-line", { yPercent: 118, opacity: 0, duration: d(0.8), stagger: d(0.06) }, "-=0.1")
        .from(".js-menu-tail", { y: 24, opacity: 0, duration: d(0.6), stagger: d(0.05) }, "-=0.5");

      return () => {
        menuTl.current?.kill();
        menuTl.current = null;
      };
    },
    { scope: panelRef },
  );

  React.useEffect(() => {
    const tl = menuTl.current;
    if (!tl) return;
    if (open) tl.play();
    else tl.reverse();
  }, [open]);

  /* ------------------- scroll lock, escape, focus, route ------------------ */

  React.useEffect(() => {
    if (!open) return;
    lenis?.stop();
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const raf = requestAnimationFrame(() => firstLinkRef.current?.focus());

    return () => {
      lenis?.start();
      document.documentElement.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      cancelAnimationFrame(raf);
    };
  }, [open, lenis]);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  /* ------------------------------- render -------------------------------- */

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500 ease-[var(--ease-out-expo)]",
          scrolled ? "glass border-border" : "border-transparent bg-transparent",
        )}
      >
        <div className="container-edge flex h-16 items-center justify-between gap-4 md:h-20">
          <Wordmark />

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={cn(
                      "group relative inline-flex h-10 items-center rounded-full px-4 text-sm font-medium tracking-tight transition-colors duration-300",
                      isActive(link.href) ? "text-brand" : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {link.label}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-4 bottom-1.5 h-px origin-left bg-brand transition-transform duration-500 ease-[var(--ease-out-expo)]",
                        isActive(link.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                      )}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {session ? (
              <ButtonLink href={dashboardHref} size="sm" className="hidden sm:inline-flex">
                Dashboard
                <ArrowUpRight className="size-4" aria-hidden />
              </ButtonLink>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden text-sm font-medium text-ink-muted transition-colors duration-300 hover:text-ink sm:inline-flex"
                >
                  Sign in
                </Link>
                <ButtonLink href="/pricing" size="sm" className="hidden sm:inline-flex">
                  Join now
                </ButtonLink>
              </>
            )}

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-ink transition-colors duration-300 hover:border-brand hover:text-brand lg:hidden"
            >
              <Menu className="size-[18px]" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------- full-screen menu ------------------------- */}
      <div
        ref={panelRef}
        id="mobile-menu"
        aria-hidden={!open}
        className="invisible fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-bg opacity-0 lg:hidden"
      >
        <div className="grain relative flex min-h-full flex-col">
          <div className="container-edge flex h-16 shrink-0 items-center justify-between md:h-20">
            <Wordmark />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                toggleRef.current?.focus();
              }}
              aria-label="Close menu"
              className="grid size-10 place-items-center rounded-full border border-border text-ink transition-colors duration-300 hover:border-brand hover:text-brand"
            >
              <X className="size-[18px]" aria-hidden />
            </button>
          </div>

          <nav aria-label="Mobile" className="container-edge flex-1 pt-6 pb-10">
            <ul className="flex flex-col">
              {NAV_LINKS.map((link, i) => (
                <li key={link.label} className="overflow-hidden border-b border-border py-1">
                  <Link
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={link.href}
                    tabIndex={open ? 0 : -1}
                    className="js-menu-line flex items-baseline justify-between gap-4 py-3"
                  >
                    <span className="font-display text-[clamp(2.25rem,13vw,4rem)] leading-[0.95] font-extrabold tracking-[-0.04em] text-ink">
                      {link.label}
                    </span>
                    <span className="max-w-[38%] text-right text-[11px] leading-snug tracking-tight text-ink-faint">
                      {link.note}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="js-menu-tail mt-8 flex flex-col gap-3">
              {session ? (
                <ButtonLink href={dashboardHref} size="lg" tabIndex={open ? 0 : -1} className="w-full">
                  Go to dashboard
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink href="/pricing" size="lg" tabIndex={open ? 0 : -1} className="w-full">
                    Join Ember
                  </ButtonLink>
                  <ButtonLink
                    href="/login"
                    size="lg"
                    variant="outline"
                    tabIndex={open ? 0 : -1}
                    className="w-full"
                  >
                    Sign in
                  </ButtonLink>
                </>
              )}
            </div>

            <div className="js-menu-tail mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={open ? 0 : -1}
                  className="transition-colors duration-300 hover:text-brand"
                >
                  {s.label}
                </a>
              ))}
            </div>

            <p className="js-menu-tail mt-6 text-sm leading-relaxed text-ink-faint">
              Pali Naka, Bandra West · 12th Main, Indiranagar
              <br />
              Doors open 5:00am. Coffee from 6.
            </p>
          </nav>
        </div>
      </div>
    </>
  );
}
