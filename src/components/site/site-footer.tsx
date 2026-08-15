"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Clock, MapPin, Phone } from "lucide-react";

import { gsap, useGSAP, MQ } from "@/lib/gsap";
import { LEGAL_LINKS, LOCATIONS, NAV_LINKS, SOCIAL_LINKS } from "./nav-data";
import { Wordmark } from "./wordmark";

export function SiteFooter() {
  const root = React.useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        // The oversized wordmark drifts up as the footer arrives — transform
        // only, and it lives inside an overflow-hidden band so nothing spills.
        gsap.fromTo(
          ".js-footer-mark",
          { yPercent: 22 },
          {
            yPercent: 0,
            ease: "none",
            scrollTrigger: {
              trigger: ".js-footer-mark-wrap",
              start: "top bottom",
              end: "bottom bottom",
              scrub: 0.6,
            },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="relative border-t border-border bg-bg-subtle">
      <div className="container-edge grid gap-12 py-16 md:py-20 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <Wordmark />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-muted">
            A coaching-led strength and conditioning club. Two rooms, four coaches, a timetable
            capped small enough that somebody always knows your name and your numbers.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-ink-muted transition-colors duration-300 hover:text-brand"
              >
                {s.label}
                <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Footer" className="lg:col-span-2">
          <h2 className="text-[11px] font-semibold tracking-[0.22em] text-ink-faint uppercase">
            Explore
          </h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="text-ink-muted transition-colors duration-300 hover:text-brand"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/login"
                className="text-ink-muted transition-colors duration-300 hover:text-brand"
              >
                Member sign in
              </Link>
            </li>
          </ul>
        </nav>

        <div className="grid gap-8 sm:grid-cols-2 lg:col-span-6">
          {LOCATIONS.map((loc) => (
            <div key={loc.name}>
              <h2 className="font-display text-lg tracking-tight text-ink">{loc.name}</h2>
              <ul className="mt-4 flex flex-col gap-3 text-sm text-ink-muted">
                <li className="flex gap-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                  <span className="leading-relaxed">{loc.address}</span>
                </li>
                <li className="flex gap-2.5">
                  <Clock className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                  <span className="leading-relaxed">{loc.hours}</span>
                </li>
                <li className="flex gap-2.5">
                  <Phone className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                  <a
                    href={`tel:${loc.phone.replace(/\s/g, "")}`}
                    className="transition-colors duration-300 hover:text-brand"
                  >
                    {loc.phone}
                  </a>
                </li>
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="js-footer-mark-wrap container-edge overflow-hidden pb-2">
        <p
          aria-hidden
          className="js-footer-mark font-display text-[clamp(4rem,17vw,15rem)] leading-[0.8] font-extrabold tracking-[-0.05em] text-ink/[0.07] uppercase select-none dark:text-ink/[0.09]"
        >
          Ember Athletic
        </p>
      </div>

      <div className="border-t border-border">
        <div className="container-edge flex flex-col gap-3 py-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Ember Athletic Club Pvt. Ltd. · CIN U93000MH2016PTC28841</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="transition-colors duration-300 hover:text-brand">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
