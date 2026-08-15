import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DAY = 86_400_000;

function at(daysFromNow: number, hour: number, minute = 0) {
  const d = new Date(Date.now() + daysFromNow * DAY);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Stable stock photography (Unsplash) so the seed works without local assets. */
const photo = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

async function main() {
  console.log("→ Clearing existing data");
  await prisma.booking.deleteMany();
  await prisma.workoutLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.trainer.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  console.log("→ Plans");
  const plans = await Promise.all(
    [
      {
        slug: "kindle",
        name: "Kindle",
        tagline: "For the first ninety days.",
        priceInPaise: 199_000,
        interval: "MONTHLY" as const,
        features: [
          "Full floor access, 5am–11pm",
          "4 small-group classes / month",
          "Movement screen + starting plan",
          "Ember app with lift tracking",
        ],
        sortOrder: 1,
      },
      {
        slug: "forge",
        name: "Forge",
        tagline: "The one most members stay on.",
        priceInPaise: 399_000,
        interval: "MONTHLY" as const,
        features: [
          "Everything in Kindle",
          "Unlimited small-group classes",
          "Monthly 1:1 coaching review",
          "Recovery suite: sauna, cold plunge",
          "Nutrition blueprint, refreshed quarterly",
        ],
        highlight: true,
        sortOrder: 2,
      },
      {
        slug: "blaze",
        name: "Blaze",
        tagline: "Coaching that follows you out the door.",
        priceInPaise: 899_000,
        interval: "MONTHLY" as const,
        features: [
          "Everything in Forge",
          "8 private sessions / month",
          "Dedicated head coach on WhatsApp",
          "InBody scan + bloodwork twice a year",
          "Guest passes, four per month",
        ],
        sortOrder: 3,
      },
      {
        slug: "forge-annual",
        name: "Forge Annual",
        tagline: "Twelve months, two on the house.",
        priceInPaise: 3_990_000,
        interval: "YEARLY" as const,
        features: [
          "Everything in Forge",
          "Two months free vs. monthly",
          "Locked price for life",
          "Ember kit bag + training tee",
        ],
        sortOrder: 4,
      },
      {
        slug: "live-test",
        name: "₹1 Live Test",
        tagline: "One rupee, to prove the money actually moves.",
        priceInPaise: 100,
        interval: "MONTHLY" as const,
        features: [
          "Charges exactly ₹1 — Razorpay's live minimum",
          "Reachable only at /checkout/live-test",
          "Never shown on pricing or marketing pages",
          "Refund it from the Razorpay dashboard afterwards",
        ],
        internal: true,
        sortOrder: 99,
      },
    ].map((p) => prisma.plan.create({ data: p })),
  );
  const planBySlug = Object.fromEntries(plans.map((p) => [p.slug, p]));

  console.log("→ Users");
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@ember.club",
      passwordHash,
      name: "Maya Rathore",
      role: "ADMIN",
      phone: "+91 98200 11223",
      avatarUrl: photo("1544005313-94ddf0286df2", 200),
    },
  });

  const member = await prisma.user.create({
    data: {
      email: "member@ember.club",
      passwordHash,
      name: "Arjun Nair",
      role: "USER",
      phone: "+91 98111 44556",
      goal: "Pull a double-bodyweight deadlift by December",
      avatarUrl: photo("1500648767791-00dcc994a43e", 200),
    },
  });

  const extraMembers = await Promise.all(
    [
      ["priya@ember.club", "Priya Menon", "Run a sub-2h half marathon"],
      ["dev@ember.club", "Dev Sharma", "Add 6kg of lean mass"],
      ["sana@ember.club", "Sana Qureshi", "Get back to lifting after injury"],
      ["rohit@ember.club", "Rohit Verma", "Fix desk posture, build a base"],
      ["neha@ember.club", "Neha Kapoor", "First strict pull-up"],
      ["kabir@ember.club", "Kabir Anand", "Stay ready for football season"],
    ].map(([email, name, goal], i) =>
      prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          goal,
          createdAt: new Date(Date.now() - (i + 2) * 12 * DAY),
        },
      }),
    ),
  );

  console.log("→ Trainers");
  const trainers = await Promise.all(
    [
      {
        slug: "vikram-shetty",
        name: "Vikram Shetty",
        specialty: "Strength & Powerlifting",
        bio: "Twelve years under the bar and eleven coaching it. Vikram has taken more members through their first 100kg squat than anyone on the floor. He is unhurried, exacting, and allergic to ego lifting.",
        imageUrl: photo("1583454110551-21f2fa2afe61"),
        experienceYears: 11,
        rating: 4.9,
      },
      {
        slug: "ananya-desai",
        name: "Ananya Desai",
        specialty: "Conditioning & Endurance",
        bio: "Ex-national swimmer turned engine builder. Ananya writes the interval work that makes the last round of a class feel survivable, and the next month feel easy.",
        imageUrl: photo("1594381898411-846e7d193883"),
        experienceYears: 8,
        rating: 4.8,
      },
      {
        slug: "imran-qadri",
        name: "Imran Qadri",
        specialty: "Mobility & Rehab",
        bio: "Physiotherapist first, coach second. If something clicks, pinches or refuses to load, Imran is the one who finds out why before you touch a barbell again.",
        imageUrl: photo("1567013127542-490d757e51fc"),
        experienceYears: 9,
        rating: 5.0,
      },
      {
        slug: "leela-mathew",
        name: "Leela Mathew",
        specialty: "Olympic Lifting",
        bio: "Snatch technician with a coach's patience. Leela breaks the lift into pieces small enough that anyone can hold one, then puts it back together.",
        imageUrl: photo("1541694458248-5aa2101c77df"),
        experienceYears: 7,
        rating: 4.9,
      },
    ].map((t) => prisma.trainer.create({ data: t })),
  );

  console.log("→ Classes");
  const classSpecs: Array<{
    title: string;
    description: string;
    trainer: number;
    day: number;
    hour: number;
    minute?: number;
    durationMin: number;
    capacity: number;
    intensity: "LOW" | "MODERATE" | "HIGH" | "ELITE";
    imageUrl: string;
  }> = [
    {
      title: "Barbell Foundations",
      description: "Squat, press, hinge. Loaded slowly, coached closely, capped at twelve.",
      trainer: 0,
      day: 0,
      hour: 7,
      durationMin: 60,
      capacity: 12,
      intensity: "MODERATE",
      imageUrl: photo("1534438327276-14e5300c3a48"),
    },
    {
      title: "Engine Room",
      description: "Twenty-eight minutes of intervals on rower, bike and floor. No barbell, no mercy.",
      trainer: 1,
      day: 0,
      hour: 18,
      minute: 30,
      durationMin: 45,
      capacity: 20,
      intensity: "HIGH",
      imageUrl: photo("1517836357463-d25dfeac3438"),
    },
    {
      title: "Restore & Range",
      description: "Loaded stretching, breathwork and joint prep. The session that keeps the others possible.",
      trainer: 2,
      day: 1,
      hour: 8,
      durationMin: 50,
      capacity: 16,
      intensity: "LOW",
      imageUrl: photo("1518611012118-696072aa579a"),
    },
    {
      title: "Snatch Lab",
      description: "Technical Olympic lifting in small groups. Video review at the end of every session.",
      trainer: 3,
      day: 1,
      hour: 19,
      durationMin: 75,
      capacity: 8,
      intensity: "ELITE",
      imageUrl: photo("1526506118085-60ce8714f8c5"),
    },
    {
      title: "Strength Circuit",
      description: "Three stations, four rounds, full body. The most-booked hour on the timetable.",
      trainer: 0,
      day: 2,
      hour: 6,
      minute: 30,
      durationMin: 60,
      capacity: 18,
      intensity: "MODERATE",
      imageUrl: photo("1571019613454-1cb2f99b2d8b"),
    },
    {
      title: "Hill Repeats",
      description: "Treadmill and sled work built for runners who want to stop breaking down.",
      trainer: 1,
      day: 2,
      hour: 18,
      durationMin: 45,
      capacity: 14,
      intensity: "HIGH",
      imageUrl: photo("1461896836934-ffe607ba8211"),
    },
    {
      title: "Deadlift Clinic",
      description: "One lift, ninety minutes, every cue you'll ever need. Runs the first week of each month.",
      trainer: 0,
      day: 3,
      hour: 19,
      durationMin: 90,
      capacity: 10,
      intensity: "HIGH",
      imageUrl: photo("1517963879433-6ad2b056d712"),
    },
    {
      title: "Sunrise Flow",
      description: "Mobility-led strength at first light. Coffee is on us afterwards.",
      trainer: 2,
      day: 4,
      hour: 6,
      durationMin: 45,
      capacity: 20,
      intensity: "LOW",
      imageUrl: photo("1544367567-0f2fcb009e0b"),
    },
    {
      title: "Saturday Grind",
      description: "The long one. Partner work, heavy carries, and a floor that smells like chalk.",
      trainer: 3,
      day: 5,
      hour: 9,
      durationMin: 75,
      capacity: 24,
      intensity: "ELITE",
      imageUrl: photo("1550345332-09e3ac987658"),
    },
    {
      title: "Recovery Sunday",
      description: "Sauna protocol, cold plunge and guided decompression. Ends the week properly.",
      trainer: 2,
      day: 6,
      hour: 10,
      durationMin: 60,
      capacity: 16,
      intensity: "LOW",
      imageUrl: photo("1571019614242-c5c5dee9f50b"),
    },
  ];

  // Two weeks of timetable so the dashboard always has something upcoming.
  const classes = [];
  for (const week of [0, 1]) {
    for (const spec of classSpecs) {
      classes.push(
        await prisma.classSession.create({
          data: {
            title: spec.title,
            description: spec.description,
            trainerId: trainers[spec.trainer].id,
            startsAt: at(spec.day + week * 7 + 1, spec.hour, spec.minute ?? 0),
            durationMin: spec.durationMin,
            capacity: spec.capacity,
            intensity: spec.intensity,
            imageUrl: spec.imageUrl,
          },
        }),
      );
    }
  }

  console.log("→ Subscriptions & payments");
  const allMembers = [member, ...extraMembers];
  const memberPlans = ["forge", "kindle", "blaze", "forge", "kindle", "forge-annual", "forge"];

  for (const [i, u] of allMembers.entries()) {
    const plan = planBySlug[memberPlans[i] ?? "forge"];
    const months = plan.interval === "YEARLY" ? 12 : plan.interval === "QUARTERLY" ? 3 : 1;
    const startsAt = new Date(Date.now() - (i * 9 + 3) * DAY);
    const endsAt = new Date(startsAt);
    endsAt.setMonth(endsAt.getMonth() + months);

    const subscription = await prisma.subscription.create({
      data: {
        userId: u.id,
        planId: plan.id,
        status: i === 5 ? "EXPIRED" : "ACTIVE",
        startsAt,
        endsAt: i === 5 ? new Date(Date.now() - 4 * DAY) : endsAt,
      },
    });

    // Billing history: one paid invoice per cycle since joining.
    for (let cycle = 0; cycle < (i === 0 ? 4 : 2); cycle++) {
      const created = new Date(startsAt.getTime() - cycle * 30 * DAY);
      await prisma.payment.create({
        data: {
          userId: u.id,
          planId: plan.id,
          subscriptionId: subscription.id,
          amountInPaise: plan.priceInPaise,
          status: "PAID",
          razorpayOrderId: `order_seed_${u.id.slice(-6)}_${cycle}`,
          razorpayPaymentId: `pay_seed_${u.id.slice(-6)}_${cycle}`,
          method: ["upi", "card", "netbanking"][cycle % 3],
          createdAt: created,
          updatedAt: created,
        },
      });
    }
  }

  // One failed attempt so the admin payments table isn't uniformly green.
  await prisma.payment.create({
    data: {
      userId: extraMembers[2].id,
      planId: planBySlug.blaze.id,
      amountInPaise: planBySlug.blaze.priceInPaise,
      status: "FAILED",
      razorpayOrderId: "order_seed_failed_01",
      failureReason: "Card declined by issuing bank",
      method: "card",
      createdAt: new Date(Date.now() - 2 * DAY),
    },
  });

  console.log("→ Bookings, check-ins, workout logs");
  const upcoming = classes.filter((c) => c.startsAt > new Date()).slice(0, 24);
  for (const [i, u] of allMembers.entries()) {
    for (const c of upcoming.filter((_, idx) => idx % allMembers.length === i).slice(0, 3)) {
      await prisma.booking.create({ data: { userId: u.id, classSessionId: c.id } });
    }
  }

  const workoutTypes = ["Strength", "Conditioning", "Olympic", "Mobility", "Class"];
  for (const u of allMembers) {
    for (let d = 0; d < 60; d++) {
      // A believable ~4-day-a-week pattern rather than uniform noise.
      if (d % 7 === 3 || d % 7 === 6) continue;
      if ((d * 7 + u.id.charCodeAt(3)) % 5 === 0) continue;
      const date = new Date(Date.now() - d * DAY);
      await prisma.checkIn.create({ data: { userId: u.id, at: date } });
      await prisma.workoutLog.create({
        data: {
          userId: u.id,
          date,
          type: workoutTypes[(d + u.id.charCodeAt(2)) % workoutTypes.length],
          durationMin: 45 + ((d * 13) % 40),
          calories: 320 + ((d * 37) % 300),
          volumeKg: 2400 + ((d * 211) % 3600),
        },
      });
    }
  }

  console.log("→ Testimonials & leads");
  await prisma.testimonial.createMany({
    data: [
      {
        name: "Kavya Iyer",
        role: "Member since 2023",
        quote:
          "I'd been a gym member for nine years and had never been coached for a single minute. Six weeks at Ember and I finally understood what my back was supposed to be doing.",
        imageUrl: photo("1487412720507-e7ab37603c6f", 200),
      },
      {
        name: "Farhan Sheikh",
        role: "Deadlifted 200kg at 41",
        quote:
          "They didn't sell me a transformation. They gave me a plan for Tuesday, then a plan for the Tuesday after that. Two years later the numbers speak for themselves.",
        imageUrl: photo("1519085360753-af0119f7cbe7", 200),
      },
      {
        name: "Ritika Bose",
        role: "Returned after ACL surgery",
        quote:
          "Imran rebuilt my knee's confidence before he rebuilt its strength. No other gym would even let me squat. Here it was step one of twelve.",
        imageUrl: photo("1573496359142-b8d87734a5a2", 200),
      },
      {
        name: "Aditya Rao",
        role: "Corporate membership",
        quote:
          "The 6:30am circuit is the only meeting I never move. Best hour of my working day, and it isn't close.",
        imageUrl: photo("1507003211169-0a1dd7228f2d", 200),
      },
    ],
  });

  await prisma.lead.createMany({
    data: [
      {
        name: "Simran Gill",
        email: "simran.gill@example.com",
        phone: "+91 99870 22114",
        message: "Interested in the Forge plan. Do you run a trial week for new members?",
      },
      {
        name: "Tanmay Joshi",
        email: "tanmay.j@example.com",
        message: "Corporate enquiry — 24 employees, looking at annual memberships.",
        handled: true,
      },
      {
        name: "Zoya Khan",
        email: "zoya@example.com",
        phone: "+91 90040 55321",
        message: "Is the Snatch Lab suitable for someone who has never used a barbell?",
      },
    ],
  });

  const counts = {
    users: await prisma.user.count(),
    plans: await prisma.plan.count(),
    trainers: await prisma.trainer.count(),
    classes: await prisma.classSession.count(),
    bookings: await prisma.booking.count(),
    payments: await prisma.payment.count(),
  };
  console.log("✔ Seed complete", counts);
  console.log("  admin  → admin@ember.club  / password123");
  console.log("  member → member@ember.club / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
