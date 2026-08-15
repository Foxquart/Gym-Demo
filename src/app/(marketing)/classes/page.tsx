import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button";
import { PageHero } from "@/components/landing/page-hero";
import { TimetableFull } from "@/components/landing/timetable-full";
import { getTimetable } from "@/components/landing/queries";

export const metadata: Metadata = {
  title: "Classes & timetable",
  description:
    "Every small-group session at Ember Athletic Club — barbell foundations, engine work, Olympic lifting, mobility and recovery. Capped between 8 and 24 people.",
  alternates: { canonical: "/classes" },
};

export default async function ClassesPage() {
  const days = await getTimetable({ days: 7, take: 200 });

  return (
    <>
      <PageHero
        eyebrow="Timetable"
        title="Ten coached hours a week. Never more than twenty-four people."
        lead="Every session is written by the coach running it and capped at a number they can actually watch. Members book from the app the moment the week opens; visitors are welcome to sit in on one before joining."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/pricing" size="lg">
            Join and start booking
          </ButtonLink>
          <ButtonLink href="/contact" size="lg" variant="outline">
            Come and watch a class
          </ButtonLink>
        </div>
      </PageHero>

      <TimetableFull days={days} />
    </>
  );
}
