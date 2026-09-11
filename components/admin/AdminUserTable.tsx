"use client";

import { Eye } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { formatDate } from "@/lib/utils";
import type { AdminUser } from "@/lib/services/admin";
import type { UserRole } from "@/lib/services/session";

/** Read-only role display. Platform roles can only be changed by the database
 * security model (migration 016 enforces exactly one active admin) — there
 * is intentionally no role-changing control here. */
function RoleBadge({ role }: { role: UserRole }) {
  return <Badge variant={role === "admin" ? "primary" : "outline"}>{role}</Badge>;
}

function StatusBadge({ status }: { status: AdminUser["accountStatus"] }) {
  return <Badge variant={status === "active" ? "success" : "error"}>{status}</Badge>;
}

export function AdminUserTable({
  users,
  onToggleStatus,
}: {
  users: AdminUser[];
  onToggleStatus: (user: AdminUser) => void;
}) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)] md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-4 py-3 font-semibold">Student</th>
              <th scope="col" className="px-4 py-3 font-semibold">Program</th>
              <th scope="col" className="px-4 py-3 font-semibold">Role</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Team</th>
              <th scope="col" className="px-4 py-3 font-semibold">Joined</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="align-top transition-colors hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2.5">
                    <Avatar name={u.name} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-900">{u.name}</span>
                      <span className="block truncate text-xs text-slate-500">{u.email}</span>
                      <span className="mt-1 block w-28" title={`Profile ${u.profileCompletion}%`}>
                        <Progress value={u.profileCompletion} ariaLabel={`${u.name} profile ${u.profileCompletion} percent`} />
                      </span>
                    </span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {u.program} · Y{u.year}
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={u.accountStatus} />
                </td>
                <td className="max-w-40 truncate px-4 py-3 text-slate-600">{u.teamName ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(u.joinedAt)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <span className="inline-flex gap-1.5">
                    <Button href={`/profile/${u.id}`} variant="ghost" size="sm" aria-label={`View ${u.name}'s profile`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onToggleStatus(u)}>
                      {u.accountStatus === "active" ? "Deactivate" : "Activate"}
                    </Button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {users.map((u) => (
          <li key={u.id}>
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-2.5">
                  <Avatar name={u.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{u.name}</p>
                    <p className="truncate text-xs text-slate-500">{u.email}</p>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                  <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                    <dt className="text-[11px] text-slate-500">Program</dt>
                    <dd className="truncate font-medium text-slate-800">{u.program} · Y{u.year}</dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                    <dt className="text-[11px] text-slate-500">Team</dt>
                    <dd className="truncate font-medium text-slate-800">{u.teamName ?? "No team"}</dd>
                  </div>
                </dl>
                <div className="mt-2.5">
                  <Progress value={u.profileCompletion} ariaLabel={`${u.name} profile ${u.profileCompletion} percent`} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={u.accountStatus} />
                  <span className="flex-1" />
                  <Button href={`/profile/${u.id}`} variant="outline" size="sm">View</Button>
                  <Button variant="outline" size="sm" onClick={() => onToggleStatus(u)}>
                    {u.accountStatus === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
