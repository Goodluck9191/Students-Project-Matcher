"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { AdminUserTable } from "@/components/admin/AdminUserTable";
import {
  AdminUserFilters,
  EMPTY_ADMIN_USER_FILTERS,
  type AdminUserFilterValues,
} from "@/components/admin/AdminUserFilters";
import { AdminLoadingState } from "@/components/admin/AdminStates";
import { AdminEmptyState } from "@/components/admin/AdminPanels";
import {
  adminSetUserStatus,
  filterAdminUsers,
  getAdminUsers,
  type AdminUser,
} from "@/lib/services/admin";
import { getCurrentRole } from "@/lib/services/session";
import { Card, CardContent } from "@/components/ui/Card";

export default function AdminUsersPage() {
  const { success, error } = useToast();
  const [users, setUsers] = React.useState<AdminUser[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [filters, setFilters] = React.useState<AdminUserFilterValues>(EMPTY_ADMIN_USER_FILTERS);
  const [confirm, setConfirm] = React.useState<AdminUser | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    getAdminUsers().then(setUsers).catch(() => setFailed(true));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const visible = React.useMemo(
    () => (users ? filterAdminUsers(users, {
      query: filters.query,
      role: filters.role,
      accountStatus: filters.accountStatus,
      teamStatus: filters.teamStatus,
      program: filters.program,
    }) : []),
    [users, filters]
  );

  async function handleToggleStatus() {
    if (!confirm) return;
    setBusy(true);
    const next = confirm.accountStatus === "active" ? "inactive" : "active";
    const res = await adminSetUserStatus(confirm.id, next, getCurrentRole());
    setBusy(false);
    if (!res.ok) {
      error("Action failed", res.error === "FORBIDDEN" ? "Admin role required." : "User not found.");
      return;
    }
    setConfirm(null);
    success(next === "active" ? "User account activated." : "User account deactivated.", confirm.name);
    load();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        subtitle={`${users?.length ?? "…"} registered students · account access.`}
      />

      <Card>
        <CardContent className="py-5">
          <AdminUserFilters filters={filters} onChange={setFilters} />
        </CardContent>
      </Card>

      {failed ? (
        <ErrorState title="Couldn't load users" description="Something went wrong. Please try again." onRetry={() => { setFailed(false); load(); }} />
      ) : !users ? (
        <AdminLoadingState rows={2} />
      ) : visible.length === 0 ? (
        <AdminEmptyState title="No users found" description="Try changing your search or filters." />
      ) : (
        <>
          <p className="text-[13px] text-slate-500" aria-live="polite">
            Showing {visible.length} of {users.length} users
          </p>
          <AdminUserTable
            users={visible}
            onToggleStatus={setConfirm}
          />
        </>
      )}

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={`${confirm?.accountStatus === "active" ? "Deactivate" : "Activate"} ${confirm?.name ?? "user"}?`}
        description={
          confirm?.accountStatus === "active"
            ? "Are you sure you want to deactivate this account? They will lose access until reactivated."
            : "This account will regain full access."
        }
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant={confirm?.accountStatus === "active" ? "danger" : "primary"} loading={busy} onClick={handleToggleStatus}>
              {confirm?.accountStatus === "active" ? "Deactivate" : "Activate"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Team memberships are preserved either way.</p>
      </Modal>
    </div>
  );
}
