import { CalendarDays, KeyRound, LogOut, UserRound } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { PageHeader } from "@/components/dashboard/primitives";
import { ProfileForm, PasswordForm } from "@/components/dashboard/profile-forms";
import { LogoutButton } from "@/components/dashboard/user-chip";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();

  const [sessions, firstCheckIn] = await Promise.all([
    prisma.checkIn.count({ where: { userId: user.id } }),
    prisma.checkIn.findFirst({ where: { userId: user.id }, orderBy: { at: "asc" }, select: { at: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Profile"
        title="Your details"
        lede="What the coaches see before a session, and what the front desk uses to reach you. Nothing here is shared outside the club."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-5">
        <div className="flex flex-col gap-4 lg:gap-5">
          <Card>
            <CardHeader className="flex-row items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-brand">
                <UserRound className="size-4" aria-hidden />
              </span>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm
                user={{
                  name: user.name,
                  email: user.email,
                  phone: user.phone,
                  goal: user.goal,
                  avatarUrl: user.avatarUrl,
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-amber/15 text-amber">
                <KeyRound className="size-4" aria-hidden />
              </span>
              <div>
                <CardTitle>Password</CardTitle>
                <p className="mt-1 text-sm text-ink-muted">
                  We check the current one first — that&rsquo;s the whole security model, and it works.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 lg:gap-5">
          <Card className="bg-bg-subtle">
            <CardHeader className="flex-row items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-sage/15 text-sage">
                <CalendarDays className="size-4" aria-hidden />
              </span>
              <CardTitle>Membership record</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-4 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-muted">Member since</dt>
                  <dd className="text-right font-medium text-ink">
                    {formatDate(user.createdAt, "long")}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
                  <dt className="text-ink-muted">Sessions logged</dt>
                  <dd className="text-right font-medium text-ink tabular-nums">{sessions}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
                  <dt className="text-ink-muted">First check-in</dt>
                  <dd className="text-right font-medium text-ink">
                    {firstCheckIn ? formatDate(firstCheckIn.at, "long") : "Not yet"}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
                  <dt className="text-ink-muted">Access level</dt>
                  <dd className="text-right font-medium text-ink">
                    {user.role === "ADMIN" ? "Staff" : "Member"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-danger/12 text-danger">
                <LogOut className="size-4" aria-hidden />
              </span>
              <CardTitle>Sign out</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-[13px] leading-relaxed text-ink-muted">
                Ends this session on this device. Your bookings and history stay exactly where they
                are.
              </p>
              <LogoutButton withLabel className="justify-start border border-border" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
