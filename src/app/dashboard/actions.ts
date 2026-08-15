"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

/** Every booking mutation answers the same way so the client can just toast it. */
export type ActionResult = { ok: boolean; message: string };

function revalidateMemberArea() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/bookings");
}

function whenLabel(startsAt: Date) {
  return `${formatDate(startsAt)} at ${formatDate(startsAt, "time")}`;
}

/* -------------------------------------------------------------------------- */
/*  Book                                                                      */
/* -------------------------------------------------------------------------- */

export async function bookClass(classSessionId: string): Promise<ActionResult> {
  const user = await requireUser();

  const session = await prisma.classSession.findUnique({
    where: { id: classSessionId },
    select: { id: true, title: true, startsAt: true, capacity: true },
  });
  if (!session) {
    return { ok: false, message: "That session is no longer on the timetable." };
  }
  if (session.startsAt.getTime() <= Date.now()) {
    return { ok: false, message: "That one has already started. Pick a later slot." };
  }

  const [existing, taken] = await Promise.all([
    prisma.booking.findUnique({
      where: { userId_classSessionId: { userId: user.id, classSessionId } },
      select: { status: true },
    }),
    prisma.booking.count({ where: { classSessionId, status: "BOOKED" } }),
  ]);

  if (existing?.status === "BOOKED") {
    return { ok: false, message: "You're already on the list for this one." };
  }
  if (taken >= session.capacity) {
    return {
      ok: false,
      message: `${session.title} is full — all ${session.capacity} spots are gone.`,
    };
  }

  try {
    // Upsert covers the member who cancelled earlier and changed their mind;
    // the @@unique([userId, classSessionId]) index settles any race.
    await prisma.booking.upsert({
      where: { userId_classSessionId: { userId: user.id, classSessionId } },
      create: { userId: user.id, classSessionId, status: "BOOKED" },
      update: { status: "BOOKED" },
    });
  } catch {
    return { ok: false, message: "Couldn't hold that spot. Try again in a moment." };
  }

  revalidateMemberArea();
  return { ok: true, message: `Booked — ${session.title}, ${whenLabel(session.startsAt)}.` };
}

/* -------------------------------------------------------------------------- */
/*  Cancel                                                                    */
/* -------------------------------------------------------------------------- */

async function cancel(where: { id: string } | { userId_classSessionId: { userId: string; classSessionId: string } }) {
  const booking = await prisma.booking.findUnique({
    where,
    select: {
      id: true,
      userId: true,
      status: true,
      classSession: { select: { title: true, startsAt: true } },
    },
  });

  if (!booking) return { ok: false, message: "We couldn't find that booking." };
  if (booking.status === "CANCELLED") {
    return { ok: false, message: "That booking was already cancelled." };
  }
  if (booking.classSession.startsAt.getTime() <= Date.now()) {
    return { ok: false, message: "That session has been and gone — nothing left to cancel." };
  }

  await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });
  revalidateMemberArea();

  return {
    ok: true,
    message: `Cancelled — ${booking.classSession.title}. The spot is back in the pool.`,
  };
}

/** Cancel from the bookings list, where we know the booking id. */
export async function cancelBooking(bookingId: string): Promise<ActionResult> {
  const user = await requireUser();
  const owned = await prisma.booking.findFirst({
    where: { id: bookingId, userId: user.id },
    select: { id: true },
  });
  if (!owned) return { ok: false, message: "We couldn't find that booking." };
  return cancel({ id: bookingId });
}

/** Cancel from the timetable, where we only know the class. */
export async function cancelClassBooking(classSessionId: string): Promise<ActionResult> {
  const user = await requireUser();
  return cancel({ userId_classSessionId: { userId: user.id, classSessionId } });
}
