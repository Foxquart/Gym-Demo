"use server";

/**
 * Every mutation the admin portal can make lives here.
 *
 * Three rules, no exceptions:
 *   1. re-check `requireAdmin()` inside the action — the client is never trusted,
 *      even though middleware and the page already gated the route;
 *   2. parse the FormData with zod before it touches Prisma;
 *   3. `revalidatePath()` whatever the change can be seen from.
 */

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";

/* -------------------------------------------------------------------------- */
/*                              Shared action shape                            */
/* -------------------------------------------------------------------------- */

export type ActionState = {
  ok: boolean;
  message: string;
  /** Field name → first error, rendered inline under the input. */
  errors?: Record<string, string>;
  /** Handy for "created X" flows that need to close a dialog. */
  id?: string;
} | null;

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function fail(message: string, errors?: Record<string, string>): ActionState {
  return { ok: false, message, errors };
}

function done(message: string, id?: string): ActionState {
  return { ok: true, message, id };
}

/** Rupees typed by a human → paise stored in the database. */
function rupeesToPaise(rupees: number) {
  return Math.round(rupees * 100);
}

const ADMIN_PATHS = [
  "/admin",
  "/admin/members",
  "/admin/plans",
  "/admin/trainers",
  "/admin/classes",
  "/admin/payments",
  "/admin/leads",
];

function revalidateAdmin(...extra: string[]) {
  for (const path of [...ADMIN_PATHS, ...extra]) revalidatePath(path);
  // The marketing pages read through unstable_cache, so a path revalidation
  // alone would leave them serving stale plans/trainers/classes. Admin writes
  // are rare enough that busting every tag is cheaper than getting the
  // per-action tag mapping subtly wrong.
  for (const tag of Object.values(CACHE_TAGS)) revalidateTag(tag);
}

/* -------------------------------------------------------------------------- */
/*                                   Members                                   */
/* -------------------------------------------------------------------------- */

const roleSchema = z.object({
  userId: z.string().min(1, "Missing member."),
  role: z.enum(["USER", "ADMIN"]),
});

export async function setMemberRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = roleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return fail("That role isn't one we recognise.", fieldErrors(parsed.error));

  if (parsed.data.userId === admin.id && parsed.data.role === "USER") {
    return fail("You can't demote yourself — ask another admin to do it.");
  }

  const user = await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
    select: { name: true, role: true },
  });

  revalidateAdmin(`/admin/members/${parsed.data.userId}`);
  return done(
    parsed.data.role === "ADMIN"
      ? `${user.name} now has the keys to the admin portal.`
      : `${user.name} is back to a member account.`,
  );
}

const extendSchema = z.object({
  subscriptionId: z.string().min(1, "Missing subscription."),
  months: z.coerce.number().int().min(1, "Add at least one month.").max(24, "Twenty-four months is the cap."),
});

export async function extendSubscription(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = extendSchema.safeParse({
    subscriptionId: formData.get("subscriptionId"),
    months: formData.get("months"),
  });
  if (!parsed.success) return fail("Check the months field.", fieldErrors(parsed.error));

  const sub = await prisma.subscription.findUnique({
    where: { id: parsed.data.subscriptionId },
    select: { id: true, userId: true, endsAt: true },
  });
  if (!sub) return fail("That subscription no longer exists.");

  // Extend from today if it has already lapsed, otherwise from its own end date.
  const base = sub.endsAt > new Date() ? new Date(sub.endsAt) : new Date();
  base.setMonth(base.getMonth() + parsed.data.months);

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { endsAt: base, status: "ACTIVE" },
  });

  revalidateAdmin(`/admin/members/${sub.userId}`, "/dashboard");
  return done(
    `Extended by ${parsed.data.months} month${parsed.data.months === 1 ? "" : "s"}. Runs to ${base.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`,
  );
}

const subscriptionIdSchema = z.object({ subscriptionId: z.string().min(1) });

export async function cancelSubscription(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = subscriptionIdSchema.safeParse({ subscriptionId: formData.get("subscriptionId") });
  if (!parsed.success) return fail("Missing subscription.");

  const sub = await prisma.subscription.update({
    where: { id: parsed.data.subscriptionId },
    data: { status: "CANCELLED" },
    select: { userId: true },
  });

  revalidateAdmin(`/admin/members/${sub.userId}`, "/dashboard");
  return done("Subscription cancelled. Floor access ends at the current billing date.");
}

export async function reactivateSubscription(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = subscriptionIdSchema.safeParse({ subscriptionId: formData.get("subscriptionId") });
  if (!parsed.success) return fail("Missing subscription.");

  const existing = await prisma.subscription.findUnique({
    where: { id: parsed.data.subscriptionId },
    select: { endsAt: true, userId: true },
  });
  if (!existing) return fail("That subscription no longer exists.");

  const endsAt = existing.endsAt > new Date() ? existing.endsAt : undefined;
  await prisma.subscription.update({
    where: { id: parsed.data.subscriptionId },
    data: { status: "ACTIVE", ...(endsAt ? {} : { endsAt: monthsFromNow(1) }) },
  });

  revalidateAdmin(`/admin/members/${existing.userId}`, "/dashboard");
  return done("Back on. The member can book classes again.");
}

function monthsFromNow(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}

const deleteMemberSchema = z.object({
  userId: z.string().min(1),
  confirm: z.string(),
});

export async function deleteMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = deleteMemberSchema.safeParse({
    userId: formData.get("userId"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return fail("Missing member.");
  if (parsed.data.confirm !== "DELETE") {
    return fail("Type DELETE to confirm.", { confirm: "Type DELETE exactly, in capitals." });
  }
  if (parsed.data.userId === admin.id) {
    return fail("You can't delete your own account from here.");
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { name: true, role: true },
  });
  if (!user) return fail("That member has already been removed.");

  if (user.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) return fail("That's the last admin. Promote someone else first.");
  }

  // Bookings, check-ins, workouts, payments and subscriptions all cascade.
  await prisma.user.delete({ where: { id: parsed.data.userId } });

  revalidateAdmin();
  return done(`${user.name} and all of their records have been deleted.`);
}

/* -------------------------------------------------------------------------- */
/*                                    Plans                                    */
/* -------------------------------------------------------------------------- */

const slug = z
  .string()
  .trim()
  .min(2, "At least two characters.")
  .max(40, "Keep it under forty characters.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only.");

const planSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Give the plan a name."),
  slug,
  tagline: z.string().trim().min(4, "One line that sells it.").max(120, "Keep it to one line."),
  priceInRupees: z.coerce
    .number({ error: "Enter the monthly price in rupees." })
    .min(1, "Price must be more than zero.")
    .max(1_000_000, "That looks like a typo."),
  interval: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]),
  features: z.string().optional(),
  highlight: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

function parseFeatures(raw: string | undefined) {
  return (raw ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function readPlanForm(formData: FormData) {
  return planSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    tagline: formData.get("tagline"),
    priceInRupees: formData.get("priceInRupees"),
    interval: formData.get("interval"),
    features: formData.get("features") ?? "",
    highlight: formData.get("highlight") === "on",
    active: formData.get("active") === "on",
    sortOrder: formData.get("sortOrder") || 0,
  });
}

export async function savePlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = readPlanForm(formData);
  if (!parsed.success) return fail("Fix the highlighted fields.", fieldErrors(parsed.error));

  const { id, priceInRupees, features, ...rest } = parsed.data;
  const featureList = parseFeatures(features);
  if (featureList.length === 0) {
    return fail("A plan needs at least one line of what's included.", {
      features: "Add at least one feature.",
    });
  }

  const data = {
    ...rest,
    highlight: rest.highlight ?? false,
    active: rest.active ?? false,
    sortOrder: rest.sortOrder ?? 0,
    priceInPaise: rupeesToPaise(priceInRupees),
    features: featureList,
  };

  const clash = await prisma.plan.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (clash && clash.id !== id) {
    return fail("That slug is taken.", { slug: "Another plan already uses this slug." });
  }

  if (id) {
    await prisma.plan.update({ where: { id }, data });
    revalidateAdmin("/", "/checkout");
    return done(`${data.name} updated.`, id);
  }

  const created = await prisma.plan.create({ data });
  revalidateAdmin("/", "/checkout");
  return done(`${data.name} is live on the pricing page.`, created.id);
}

const idSchema = z.object({ id: z.string().min(1) });

export async function togglePlanActive(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return fail("Missing plan.");

  const plan = await prisma.plan.findUnique({ where: { id: parsed.data.id } });
  if (!plan) return fail("That plan no longer exists.");

  await prisma.plan.update({ where: { id: plan.id }, data: { active: !plan.active } });
  revalidateAdmin("/", "/checkout");
  return done(
    plan.active
      ? `${plan.name} hidden. Existing members keep their price.`
      : `${plan.name} is back on the pricing page.`,
  );
}

const moveSchema = z.object({ id: z.string().min(1), direction: z.enum(["up", "down"]) });

export async function movePlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = moveSchema.safeParse({
    id: formData.get("id"),
    direction: formData.get("direction"),
  });
  if (!parsed.success) return fail("Missing plan.");

  const plans = await prisma.plan.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  const index = plans.findIndex((p) => p.id === parsed.data.id);
  if (index === -1) return fail("That plan no longer exists.");

  const target = parsed.data.direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= plans.length) return done("Already at the end of the list.");

  const reordered = [...plans];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

  await prisma.$transaction(
    reordered.map((plan, i) =>
      prisma.plan.update({ where: { id: plan.id }, data: { sortOrder: i + 1 } }),
    ),
  );

  revalidateAdmin("/", "/checkout");
  return done("Order saved.");
}

export async function deletePlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return fail("Missing plan.");

  const plan = await prisma.plan.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      name: true,
      active: true,
      _count: { select: { subscriptions: true, payments: true } },
    },
  });
  if (!plan) return fail("That plan has already been deleted.");

  // Billing history has to survive. Deactivate instead and say so plainly.
  if (plan._count.subscriptions > 0 || plan._count.payments > 0) {
    if (plan.active) {
      await prisma.plan.update({ where: { id: plan.id }, data: { active: false } });
    }
    revalidateAdmin("/", "/checkout");
    return fail(
      `${plan.name} has ${plan._count.subscriptions} subscription${plan._count.subscriptions === 1 ? "" : "s"} and ${plan._count.payments} payment${plan._count.payments === 1 ? "" : "s"} against it, so it can't be deleted — the billing history would go with it. It has been deactivated instead: hidden from pricing, untouched for anyone already on it.`,
    );
  }

  await prisma.plan.delete({ where: { id: plan.id } });
  revalidateAdmin("/", "/checkout");
  return done(`${plan.name} deleted.`);
}

/* -------------------------------------------------------------------------- */
/*                                  Trainers                                   */
/* -------------------------------------------------------------------------- */

const trainerSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Who is it?"),
  slug,
  specialty: z.string().trim().min(3, "What do they coach?"),
  bio: z.string().trim().min(40, "Give them at least a couple of sentences."),
  imageUrl: z.url({ error: "Needs to be a full https:// image URL." }),
  experienceYears: z.coerce.number().int().min(0, "Can't be negative.").max(60, "Sixty years is the cap."),
  rating: z.coerce.number().min(1, "Ratings run 1–5.").max(5, "Ratings run 1–5."),
  active: z.coerce.boolean().optional(),
});

export async function saveTrainer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = trainerSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    specialty: formData.get("specialty"),
    bio: formData.get("bio"),
    imageUrl: formData.get("imageUrl"),
    experienceYears: formData.get("experienceYears"),
    rating: formData.get("rating"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return fail("Fix the highlighted fields.", fieldErrors(parsed.error));

  const { id, ...rest } = parsed.data;
  const data = { ...rest, active: rest.active ?? false };

  const clash = await prisma.trainer.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (clash && clash.id !== id) {
    return fail("That slug is taken.", { slug: "Another coach already uses this slug." });
  }

  if (id) {
    await prisma.trainer.update({ where: { id }, data });
    revalidateAdmin("/");
    return done(`${data.name}'s profile updated.`, id);
  }

  const created = await prisma.trainer.create({ data });
  revalidateAdmin("/");
  return done(`${data.name} added to the coaching team.`, created.id);
}

export async function toggleTrainerActive(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return fail("Missing coach.");

  const trainer = await prisma.trainer.findUnique({ where: { id: parsed.data.id } });
  if (!trainer) return fail("That coach no longer exists.");

  await prisma.trainer.update({ where: { id: trainer.id }, data: { active: !trainer.active } });
  revalidateAdmin("/");
  return done(
    trainer.active
      ? `${trainer.name} is off the floor and hidden from the site.`
      : `${trainer.name} is back on the roster.`,
  );
}

export async function deleteTrainer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return fail("Missing coach.");

  const trainer = await prisma.trainer.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, name: true, _count: { select: { classes: true } } },
  });
  if (!trainer) return fail("That coach has already been removed.");

  if (trainer._count.classes > 0) {
    await prisma.trainer.update({ where: { id: trainer.id }, data: { active: false } });
    revalidateAdmin("/");
    return fail(
      `${trainer.name} still has ${trainer._count.classes} session${trainer._count.classes === 1 ? "" : "s"} on the timetable. Deleting the profile would delete those classes and every booking on them, so they've been deactivated instead. Reassign or remove the sessions first.`,
    );
  }

  await prisma.trainer.delete({ where: { id: trainer.id } });
  revalidateAdmin("/");
  return done(`${trainer.name} removed.`);
}

/* -------------------------------------------------------------------------- */
/*                                   Classes                                   */
/* -------------------------------------------------------------------------- */

const classSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, "Name the session."),
  description: z.string().trim().min(15, "A sentence on what the hour is."),
  trainerId: z.string().min(1, "Pick a coach."),
  startsAt: z
    .string()
    .min(1, "Pick a date and time.")
    .refine((v) => !Number.isNaN(Date.parse(v)), "That date doesn't parse."),
  durationMin: z.coerce.number().int().min(10, "Ten minutes minimum.").max(240, "Four hours is the cap."),
  capacity: z.coerce.number().int().min(1, "At least one spot.").max(200, "Two hundred is the cap."),
  intensity: z.enum(["LOW", "MODERATE", "HIGH", "ELITE"]),
  imageUrl: z.union([z.url("Needs to be a full https:// image URL."), z.literal("")]).optional(),
});

export async function saveClass(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = classSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    trainerId: formData.get("trainerId"),
    startsAt: formData.get("startsAt"),
    durationMin: formData.get("durationMin"),
    capacity: formData.get("capacity"),
    intensity: formData.get("intensity"),
    imageUrl: formData.get("imageUrl") ?? "",
  });
  if (!parsed.success) return fail("Fix the highlighted fields.", fieldErrors(parsed.error));

  const { id, startsAt, imageUrl, ...rest } = parsed.data;
  const data = { ...rest, startsAt: new Date(startsAt), imageUrl: imageUrl ? imageUrl : null };

  if (id) {
    const booked = await prisma.booking.count({
      where: { classSessionId: id, status: "BOOKED" },
    });
    if (booked > data.capacity) {
      return fail(`${booked} people are already booked in. Capacity can't go below that.`, {
        capacity: `At least ${booked} — that's how many are booked.`,
      });
    }
    await prisma.classSession.update({ where: { id }, data });
    revalidateAdmin("/", "/dashboard");
    return done(`${data.title} updated.`, id);
  }

  const created = await prisma.classSession.create({ data });
  revalidateAdmin("/", "/dashboard");
  return done(`${data.title} added to the timetable.`, created.id);
}

export async function deleteClass(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return fail("Missing session.");

  const session = await prisma.classSession.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, title: true, _count: { select: { bookings: true } } },
  });
  if (!session) return fail("That session has already been removed.");

  await prisma.classSession.delete({ where: { id: session.id } });
  revalidateAdmin("/", "/dashboard");
  return done(
    session._count.bookings > 0
      ? `${session.title} cancelled — ${session._count.bookings} booking${session._count.bookings === 1 ? "" : "s"} released. Let those members know.`
      : `${session.title} removed from the timetable.`,
  );
}

const bookingSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["BOOKED", "CANCELLED", "ATTENDED"]),
});

export async function setBookingStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = bookingSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return fail("Missing booking.");

  const booking = await prisma.booking.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
    select: { user: { select: { name: true } } },
  });

  revalidateAdmin("/dashboard");
  const label = { BOOKED: "booked", CANCELLED: "cancelled", ATTENDED: "marked attended" }[
    parsed.data.status
  ];
  return done(`${booking.user.name} ${label}.`);
}

/* -------------------------------------------------------------------------- */
/*                                    Leads                                    */
/* -------------------------------------------------------------------------- */

const leadSchema = z.object({ id: z.string().min(1), handled: z.enum(["true", "false"]) });

export async function setLeadHandled(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = leadSchema.safeParse({
    id: formData.get("id"),
    handled: formData.get("handled"),
  });
  if (!parsed.success) return fail("Missing enquiry.");

  const handled = parsed.data.handled === "true";
  const lead = await prisma.lead.update({
    where: { id: parsed.data.id },
    data: { handled },
    select: { name: true },
  });

  revalidateAdmin();
  return done(handled ? `${lead.name} marked as followed up.` : `${lead.name} back in the queue.`);
}

export async function deleteLead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return fail("Missing enquiry.");

  const lead = await prisma.lead.delete({
    where: { id: parsed.data.id },
    select: { name: true },
  });

  revalidateAdmin();
  return done(`Enquiry from ${lead.name} deleted.`);
}
