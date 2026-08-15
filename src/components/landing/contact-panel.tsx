"use client";

import { Clock, MapPin, Phone, Train } from "lucide-react";

import { useReveal } from "@/hooks/use-reveal";
import { LOCATIONS } from "@/components/site/nav-data";
import { LeadForm } from "./lead-form";

const DIRECTIONS: Record<string, string> = {
  "Ember Bandra": "Six minutes on foot from Bandra station, west side. Paid parking under the building.",
  "Ember Indiranagar": "Two minutes from Indiranagar metro, 12th Main exit. Street parking after 9am.",
};

export function ContactPanel() {
  const root = useReveal<HTMLDivElement>({ start: "top 90%", stagger: 0.08 });

  return (
    <div ref={root} className="container-edge grid gap-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-7">
        <div className="js-reveal rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-md)] sm:p-8">
          <h2 className="font-display text-xl leading-none font-extrabold tracking-[-0.03em] text-ink">
            Send us a note
          </h2>
          <p className="mt-2 mb-7 text-sm text-ink-muted">
            A coach reads every message. Replies land within one working day, usually the same
            afternoon.
          </p>
          <LeadForm />
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:col-span-5">
        {LOCATIONS.map((loc) => (
          <section
            key={loc.name}
            aria-label={loc.name}
            className="js-reveal rounded-[var(--radius-card)] border border-border bg-bg-subtle p-6 sm:p-7"
          >
            <h2 className="font-display text-lg leading-none font-extrabold tracking-[-0.03em] text-ink">
              {loc.name}
            </h2>
            <ul className="mt-5 flex flex-col gap-4 text-sm text-ink-muted">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <span className="leading-relaxed">{loc.address}</span>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <span className="leading-relaxed">{loc.hours}</span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <a
                  href={`tel:${loc.phone.replace(/\s/g, "")}`}
                  className="transition-colors duration-300 hover:text-brand"
                >
                  {loc.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <Train className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <span className="leading-relaxed">{DIRECTIONS[loc.name]}</span>
              </li>
            </ul>
          </section>
        ))}

        <p className="js-reveal text-sm leading-relaxed text-ink-faint">
          Prefer to just turn up? Come between 10am and 4pm on a weekday — that is when the floor is
          quiet and somebody can walk you round properly.
        </p>
      </div>
    </div>
  );
}
