import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button";
import { PageHero } from "@/components/landing/page-hero";
import { TrainersDetail } from "@/components/landing/trainers-detail";
import { getClubStats, getTrainers } from "@/components/landing/queries";

export const metadata: Metadata = {
  title: "Coaches",
  description:
    "Meet the four full-time coaches at Ember Athletic Club — powerlifting, conditioning, mobility and rehab, and Olympic lifting.",
  alternates: { canonical: "/trainers" },
};

export default async function TrainersPage() {
  const [trainers, stats] = await Promise.all([getTrainers(), getClubStats()]);

  return (
    <>
      <PageHero
        eyebrow="Coaching staff"
        title="Four coaches. Thirty-five years between them."
        lead={`Nobody here is a floor supervisor with a clipboard. All ${stats.coaches} coaches write programmes, run classes and take private sessions — and they all still train in the room they coach in.`}
      >
        <ButtonLink href="/contact" size="lg">
          Ask for an introduction
        </ButtonLink>
      </PageHero>

      <TrainersDetail trainers={trainers} />
    </>
  );
}
