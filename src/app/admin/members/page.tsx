import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, initials } from "@/lib/utils";
import { Badge, EmptyState } from "@/components/ui";
import { DataTable, PAGE_SIZE, Pagination, type Column } from "@/components/admin/data-table";
import { FilterSelect, SearchField, Toolbar } from "@/components/admin/toolbar";
import { SUBSCRIPTION_TONE, timeAgo } from "@/components/admin/format";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Members" };

type Search = {
  q?: string;
  role?: string;
  status?: string;
  sort?: string;
  dir?: string;
  page?: string;
};

const SORTABLE: Record<string, Prisma.UserOrderByWithRelationInput> = {
  name: { name: "asc" },
  email: { email: "asc" },
  createdAt: { createdAt: "asc" },
  role: { role: "asc" },
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const dir = params.dir === "asc" ? "asc" : "desc";
  const sortKey = params.sort && SORTABLE[params.sort] ? params.sort : "createdAt";
  const orderBy = { [sortKey]: dir } as Prisma.UserOrderByWithRelationInput;

  const where: Prisma.UserWhereInput = {
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" as const } },
            { email: { contains: params.q, mode: "insensitive" as const } },
            { phone: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(params.role === "ADMIN" || params.role === "USER" ? { role: params.role } : {}),
    ...(params.status === "NONE"
      ? { subscriptions: { none: {} } }
      : params.status
        ? {
            subscriptions: {
              some: { status: params.status as Prisma.EnumSubscriptionStatusFilter["equals"] },
            },
          }
        : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true, endsAt: true, plan: { select: { name: true } } },
        },
        checkIns: { orderBy: { at: "desc" }, take: 1, select: { at: true } },
        _count: { select: { bookings: true, payments: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const query: Record<string, string | undefined> = {
    q: params.q,
    role: params.role,
    status: params.status,
    sort: params.sort,
    dir: params.dir,
    page: params.page,
  };

  type Row = (typeof rows)[number];

  const columns: Column<Row>[] = [
    {
      key: "member",
      header: "Member",
      sortKey: "name",
      primary: true,
      cell: (row) => (
        <Link
          href={`/admin/members/${row.id}`}
          className="flex items-center gap-3 text-ink hover:text-brand"
        >
          <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-bg-subtle text-[11px] font-semibold text-ink-muted">
            {row.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              initials(row.name)
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium">{row.name}</span>
            <span className="block truncate text-xs text-ink-faint">{row.email}</span>
          </span>
        </Link>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortKey: "role",
      cell: (row) =>
        row.role === "ADMIN" ? <Badge tone="brand">Admin</Badge> : <Badge>Member</Badge>,
    },
    {
      key: "plan",
      header: "Plan",
      cell: (row) => (
        <span className="text-ink-muted">{row.subscriptions[0]?.plan.name ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Membership",
      cell: (row) => {
        const sub = row.subscriptions[0];
        if (!sub) return <span className="text-ink-faint">Never subscribed</span>;
        return (
          <span className="flex items-center gap-2">
            <Badge tone={SUBSCRIPTION_TONE[sub.status]}>{sub.status.toLowerCase()}</Badge>
            <span className="text-xs text-ink-faint">to {formatDate(sub.endsAt)}</span>
          </span>
        );
      },
    },
    {
      key: "activity",
      header: "Last check-in",
      cell: (row) => (
        <span className="text-ink-muted">
          {row.checkIns[0] ? timeAgo(row.checkIns[0].at) : "Not yet"}
        </span>
      ),
    },
    {
      key: "bookings",
      header: "Bookings",
      numeric: true,
      cell: (row) => row._count.bookings,
    },
    {
      key: "joined",
      header: "Joined",
      sortKey: "createdAt",
      numeric: true,
      cell: (row) => <span className="text-ink-muted">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "go",
      header: "Open",
      actions: true,
      width: "3rem",
      cell: (row) => (
        <Link
          href={`/admin/members/${row.id}`}
          aria-label={`Open ${row.name}`}
          className="inline-grid size-11 place-items-center rounded-lg text-ink-faint hover:text-brand"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ),
    },
  ];

  return (
    <div>
      <Toolbar>
        <SearchField
          label="Search members"
          placeholder="Name, email or phone — press / to focus"
          className="sm:w-80"
        />
        <FilterSelect
          paramName="role"
          label="Filter by role"
          options={[
            { value: "", label: "All roles" },
            { value: "USER", label: "Members" },
            { value: "ADMIN", label: "Admins" },
          ]}
        />
        <FilterSelect
          paramName="status"
          label="Filter by membership status"
          options={[
            { value: "", label: "Any membership" },
            { value: "ACTIVE", label: "Active" },
            { value: "PENDING", label: "Pending" },
            { value: "CANCELLED", label: "Cancelled" },
            { value: "EXPIRED", label: "Expired" },
            { value: "NONE", label: "Never subscribed" },
          ]}
        />
        <p className="text-xs text-ink-faint sm:ml-auto">
          {total.toLocaleString("en-IN")} {total === 1 ? "person" : "people"} on the books
        </p>
      </Toolbar>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        basePath="/admin/members"
        query={query}
        sort={sortKey}
        dir={dir}
        caption="Members, with role, plan, membership status and recent activity"
        rowHref={(row) => `/admin/members/${row.id}`}
        empty={
          <EmptyState
            icon={<Users className="size-7" />}
            title="Nobody matches that"
            description="Loosen the filters, or check the spelling of the name you searched for."
          />
        }
      />

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        basePath="/admin/members"
        query={query}
        unit="members"
      />
    </div>
  );
}
