import { Suspense } from "react";
import { Dumbbell, Star } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, EmptyState } from "@/components/ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatTile } from "@/components/admin/tiles";
import {
  NewTrainerButton,
  TrainerRowActions,
  type TrainerRecord,
} from "@/components/admin/trainer-manager";

export const metadata = { title: "Coaches" };

export default async function TrainersPage() {
  await requireAdmin();

  const trainers = await prisma.trainer.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: { _count: { select: { classes: true } } },
  });

  const upcoming = await prisma.classSession.groupBy({
    by: ["trainerId"],
    where: { startsAt: { gte: new Date() } },
    _count: { _all: true },
  });
  const upcomingByTrainer = new Map(upcoming.map((row) => [row.trainerId, row._count._all]));

  const rows: (TrainerRecord & { upcomingCount: number })[] = trainers.map((trainer) => ({
    id: trainer.id,
    slug: trainer.slug,
    name: trainer.name,
    specialty: trainer.specialty,
    bio: trainer.bio,
    imageUrl: trainer.imageUrl,
    experienceYears: trainer.experienceYears,
    rating: trainer.rating,
    active: trainer.active,
    classCount: trainer._count.classes,
    upcomingCount: upcomingByTrainer.get(trainer.id) ?? 0,
  }));

  const activeCount = rows.filter((t) => t.active).length;
  const avgRating = rows.length
    ? (rows.reduce((sum, t) => sum + t.rating, 0) / rows.length).toFixed(1)
    : "—";
  const totalYears = rows.reduce((sum, t) => sum + t.experienceYears, 0);

  type Row = (typeof rows)[number];
  const columns: Column<Row>[] = [
    {
      key: "coach",
      header: "Coach",
      primary: true,
      cell: (row) => (
        <span className="flex items-center gap-3">
          <span className="size-11 shrink-0 overflow-hidden rounded-xl bg-bg-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={row.imageUrl} alt="" className="size-full object-cover" loading="lazy" />
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-ink">{row.name}</span>
              {!row.active && <Badge>Off roster</Badge>}
            </span>
            <span className="block truncate text-xs text-ink-faint">{row.specialty}</span>
          </span>
        </span>
      ),
    },
    {
      key: "bio",
      header: "Bio",
      hideOnMobile: true,
      cell: (row) => (
        <p className="line-clamp-2 max-w-md text-xs leading-relaxed text-ink-muted">{row.bio}</p>
      ),
    },
    {
      key: "experience",
      header: "Years",
      numeric: true,
      cell: (row) => row.experienceYears,
    },
    {
      key: "rating",
      header: "Rating",
      numeric: true,
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-ink">
          <Star className="size-3.5 fill-amber text-amber" aria-hidden />
          {row.rating.toFixed(1)}
        </span>
      ),
    },
    {
      key: "classes",
      header: "Sessions",
      numeric: true,
      cell: (row) => (
        <span>
          <span className="block font-medium text-ink">{row.upcomingCount}</span>
          <span className="block text-xs text-ink-faint">{row.classCount} all time</span>
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      actions: true,
      width: "13rem",
      cell: (row) => <TrainerRowActions trainer={row} />,
    },
  ];

  return (
    <div className="space-y-5">
      <section aria-label="Coaching team summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="On the roster" value={String(activeCount)} hint={`${rows.length} profiles in total`} />
        <StatTile label="Average rating" value={String(avgRating)} hint="Out of five, from members" />
        <StatTile label="Combined experience" value={`${totalYears} yrs`} hint="Across the whole team" />
        <StatTile
          label="Sessions this fortnight"
          value={String(rows.reduce((sum, t) => sum + t.upcomingCount, 0))}
          hint="Upcoming on the timetable"
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-ink-muted">
          Coaches are the reason people stay. Keep the bios specific — what they fix, not how
          passionate they are.
        </p>
        <Suspense fallback={null}>
          <NewTrainerButton />
        </Suspense>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        caption="Coaching team with specialty, experience, rating and session load"
        empty={
          <EmptyState
            icon={<Dumbbell className="size-7" />}
            title="No coaches on the books"
            description="Classes need a coach attached, so add at least one before building the timetable."
          />
        }
      />
    </div>
  );
}
