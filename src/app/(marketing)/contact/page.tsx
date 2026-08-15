import type { Metadata } from "next";

import { ContactPanel } from "@/components/landing/contact-panel";
import { PageHero } from "@/components/landing/page-hero";

export const metadata: Metadata = {
  title: "Visit & contact",
  description:
    "Book a free week at Ember Athletic Club. Two rooms — Pali Naka in Bandra West and 12th Main in Indiranagar. Doors open at 5am.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Visit"
        title="Come in, look around, lift something."
        lead="The fastest way to find out whether Ember suits you is to stand in the room while a class is running. Book a free week below, or call the desk and we will find you a slot this week."
      />

      <ContactPanel />
    </>
  );
}
