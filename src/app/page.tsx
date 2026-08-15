import type { Metadata } from "next";

import { MarketingShell } from "@/components/site/marketing-shell";
import { IntroLoader } from "@/components/site/intro-loader";
import { ClassesPreview } from "@/components/landing/classes-preview";
import { ClosingCta } from "@/components/landing/closing-cta";
import { Hero } from "@/components/landing/hero";
import { Manifesto } from "@/components/landing/manifesto";
import { DisciplineMarquee } from "@/components/landing/marquee";
import { Pillars } from "@/components/landing/pillars";
import { PricingPreview } from "@/components/landing/pricing-preview";
import { StatsBand } from "@/components/landing/stats-band";
import { Testimonials } from "@/components/landing/testimonials";
import { TrainersGrid } from "@/components/landing/trainers-grid";
import {
  getClubStats,
  getMonthlyPlans,
  getTestimonials,
  getTimetable,
  getTrainers,
} from "@/components/landing/queries";

export const metadata: Metadata = {
  title: "Ember Athletic Club — Strength, forged warm",
  description:
    "A coaching-led strength and conditioning club in Bandra West and Indiranagar. Small-group classes capped at 8–24, four full-time coaches, memberships from ₹1,990 a month.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [days, trainers, plans, testimonials, stats] = await Promise.all([
    getTimetable({ days: 3 }),
    getTrainers(),
    getMonthlyPlans(),
    getTestimonials(),
    getClubStats(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: "Ember Athletic Club",
    description:
      "Coaching-led strength and conditioning club with small-group classes in Mumbai and Bengaluru.",
    url: "https://emberathletic.club",
    telephone: "+91 22 4890 1120",
    priceRange: "₹₹",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: stats.avgRating,
      bestRating: 5,
      ratingCount: testimonials.length,
    },
    address: [
      {
        "@type": "PostalAddress",
        streetAddress: "3rd floor, Pali Naka",
        addressLocality: "Bandra West, Mumbai",
        postalCode: "400050",
        addressCountry: "IN",
      },
      {
        "@type": "PostalAddress",
        streetAddress: "12th Main, Indiranagar",
        addressLocality: "Bengaluru",
        postalCode: "560038",
        addressCountry: "IN",
      },
    ],
  };

  return (
    <MarketingShell>
      <IntroLoader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Hero
        stats={{
          coaches: stats.coaches,
          classesPerWeek: stats.classesPerWeek,
          rating: stats.avgRating,
        }}
      />
      <DisciplineMarquee />
      <Manifesto />
      <Pillars />
      <ClassesPreview days={days} />
      <TrainersGrid trainers={trainers} />
      <StatsBand stats={stats} />
      <Testimonials items={testimonials} />
      <PricingPreview plans={plans} />
      <ClosingCta />
    </MarketingShell>
  );
}
