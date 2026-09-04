import Link from "next/link";
import { prisma } from "@/lib/db";
import { adminUsersQuerySchema } from "@/lib/validations/admin";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { requireRole } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata = { title: "Users — Rollnexa Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("ADMIN");
  if (!session) redirect("/login");

  const params = await searchParams;
  const query = adminUsersQuerySchema.parse({
    q: first(params.q),
    role: first(params.role),
    status: first(params.status),
    page: first(params.page),
    pageSize: first(params.pageSize),
  });

  const where = {
    ...(query.role !== "ALL" ? { role: query.role } : {}),
    ...(query.status !== "ALL" ? { accountStatus: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" as const } },
            { email: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <div className="space-y-6">
      <header>
        <p className="rn-eyebrow">Accounts</p>
        <h1 className="rn-page-title">User Management</h1>
      </header>

      <form className="rn-panel grid gap-3 sm:grid-cols-2 xl:grid-cols-5" action="/admin/users" method="GET">
        <input name="q" defaultValue={query.q} placeholder="Search name or email" className="h-10 rounded-lg border border-black/10 px-3 text-sm sm:col-span-2" />
        <select name="role" defaultValue={query.role} className="h-10 rounded-lg border border-black/10 px-3 text-sm">
          <option value="ALL">All roles</option>
          <option value="BUYER">Buyer</option>
          <option value="SELLER">Seller</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select name="status" defaultValue={query.status} className="h-10 rounded-lg border border-black/10 px-3 text-sm">
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <button type="submit" className="rn-btn-primary h-10">Apply</button>
      </form>

      {users.length === 0 ? (
        <div className="rn-panel text-center text-sm text-rn-muted">No users found.</div>
      ) : (
        <div className="rn-panel overflow-x-auto">
          <table className="min-w-[920px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-rn-muted">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-black/5">
                  <td className="px-4 py-3 font-medium text-rn-ink">{user.name || "—"}</td>
                  <td className="px-4 py-3 text-rn-muted">{user.email}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{user.accountStatus}</td>
                  <td className="px-4 py-3 text-rn-muted">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <AdminUserActions
                      userId={user.id}
                      role={user.role}
                      accountStatus={user.accountStatus}
                      isSelf={user.id === session.user.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-rn-muted">
        <p>{total.toLocaleString()} users</p>
        <div className="flex gap-2">
          {query.page > 1 ? (
            <Link href={`/admin/users?page=${query.page - 1}`} className="rn-btn-secondary h-9 px-3 text-xs">
              Previous
            </Link>
          ) : null}
          {query.page < totalPages ? (
            <Link href={`/admin/users?page=${query.page + 1}`} className="rn-btn-secondary h-9 px-3 text-xs">
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
