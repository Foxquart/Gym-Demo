import type { Metadata } from "next";

import { PageHero } from "@/components/landing/page-hero";
import { PricingExtras } from "@/components/landing/pricing-extras";
import { PricingPreview } from "@/components/landing/pricing-preview";
import { getAllPlans } from "@/components/landing/queries";

export const metadata: Metadata = {
  title: "Membership & pricing",
  description:
    "Ember Athletic Club memberships from ₹1,990 a month. No joining fee, month-to-month, cancel from the app. Annual plans get two months free.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const plans = await getAllPlans();
  const monthly = plans.filter((p) => p.interval === "MONTHLY");
  const annual = plans.filter((p) => p.interval !== "MONTHLY");

  return (
    <>
      <PageHero
        eyebrow="Membership"
        title="One price. Everything that makes the coaching work."
        lead="No joining fee, no locker deposit, no twelve-month lock-in on the monthly plans. Pick the level of coaching you want and change it whenever your training does."
      />

      <PricingPreview
        plans={monthly}
        heading="Three ways in."
        showAllLink={false}
      />

      <PricingExtras annualPlans={annual} />
    </>
  );
}
