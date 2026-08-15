import { Inbox } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge, EmptyState } from "@/components/ui";
import { DataTable, PAGE_SIZE, Pagination, type Column } from "@/components/admin/data-table";
import { FilterSelect, SearchField, Toolbar } from "@/components/admin/toolbar";
import { StatTile } from "@/components/admin/tiles";
import { timeAgo } from "@/components/admin/format";
import { LeadActions } from "@/components/admin/lead-actions";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Enquiries" };

type Search = { q?: string; state?: string; sort?: string; dir?: string; page?: string };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const dir = params.dir === "asc" ? "asc" : "desc";
  const sortKey = params.sort === "name" ? "name" : "createdAt";
  const orderBy = { [sortKey]: dir } as Prisma.LeadOrderByWithRelationInput;

  const where: Prisma.LeadWhereInput = {
    ...(params.state === "open" ? { handled: false } : {}),
    ...(params.state === "done" ? { handled: true } : {}),
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" as const } },
            { email: { contains: params.q, mode: "insensitive" as const } },
            { message: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total, openCount, weekCount] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: [{ handled: "asc" }, orderBy],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.lead.count({ where }),
    prisma.lead.count({ where: { handled: false } }),
    prisma.lead.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const query: Record<string, string | undefined> = {
    q: params.q,
    state: params.state,
    sort: params.sort,
    dir: params.dir,
    page: params.page,
  };

  const oldestOpen = rows.find((row) => !row.handled);

  type Row = (typeof rows)[number];
  const columns: Column<Row>[] = [
    {
      key: "person",
      header: "From",
      sortKey: "name",
      primary: true,
      cell: (row) => (
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{row.name}</span>
            {row.handled ? <Badge tone="success">Handled</Badge> : <Badge tone="amber">Open</Badge>}
          </span>
          <span className="block truncate text-xs text-ink-faint">
            <a href={`mailto:${row.email}`} className="hover:text-brand">
              {row.email}
            </a>
            {row.phone && (
              <>
                {" · "}
                <a href={`tel:${row.phone}`} className="hover:text-brand">
                  {row.phone}
                </a>
              </>
            )}
          </span>
        </span>
      ),
    },
    {
      key: "message",
      header: "Message",
      cell: (row) => (
        <p className="max-w-xl text-sm leading-relaxed text-ink-muted">{row.message}</p>
      ),
    },
    {
      key: "received",
      header: "Received",
      sortKey: "createdAt",
      numeric: true,
      cell: (row) => (
        <span>
          <span className="block text-ink">{timeAgo(row.createdAt)}</span>
          <span className="block text-xs text-ink-faint">{formatDate(row.createdAt)}</span>
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      actions: true,
      width: "14rem",
      cell: (row) => <LeadActions id={row.id} name={row.name} handled={row.handled} />,
    },
  ];

  return (
    <div>
      <section aria-label="Enquiry summary" className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Waiting on a reply"
          value={String(openCount)}
          hint={openCount === 0 ? "Inbox zero" : "Answer within a day and they convert"}
          tone={openCount > 0 ? "warn" : "neutral"}
        />
        <StatTile label="Arrived this week" value={String(weekCount)} hint="From the contact form" />
        <StatTile
          label="Oldest open"
          value={oldestOpen ? timeAgo(oldestOpen.createdAt) : "—"}
          hint={oldestOpen ? oldestOpen.name : "Nothing outstanding"}
        />
      </section>

      <Toolbar>
        <SearchField
          label="Search enquiries"
          placeholder="Name, email or what they asked — press / to focus"
          className="sm:w-80"
        />
        <FilterSelect
          paramName="state"
          label="Filter by state"
          options={[
            { value: "", label: "Everything" },
            { value: "open", label: "Waiting on us" },
            { value: "done", label: "Handled" },
          ]}
        />
        <p className="text-xs text-ink-faint sm:ml-auto">
          Open enquiries sort to the top regardless of the date order.
        </p>
      </Toolbar>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        basePath="/admin/leads"
        query={query}
        sort={sortKey}
        dir={dir}
        caption="Contact form enquiries with sender, message and handled state"
        empty={
          <EmptyState
            icon={<Inbox className="size-7" />}
            title={params.q || params.state ? "Nothing matches" : "No enquiries yet"}
            description={
              params.q || params.state
                ? "Clear the filters to see the whole inbox."
                : "Messages sent from the contact form on the marketing site land here."
            }
          />
        }
      />

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        basePath="/admin/leads"
        query={query}
        unit="enquiries"
      />
    </div>
  );
}
