"use client";

import * as React from "react";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import {
  NotificationFilters,
  type NotificationFilter,
} from "@/components/notifications/NotificationFilters";
import {
  getNotifications,
  markAllAsRead,
} from "@/lib/services/notifications";
import { getSessionIdentity } from "@/lib/services/session";
import type { AppNotification } from "@/types";

/** Notification center — event-driven, actionable, read-state aware. */
export default function NotificationsPage() {
  const { success, error } = useToast();
  const [items, setItems] = React.useState<AppNotification[] | null>(null);
  const [myId, setMyId] = React.useState("me");
  const [failed, setFailed] = React.useState(false);
  const [filter, setFilter] = React.useState<NotificationFilter>("all");
  const [marking, setMarking] = React.useState(false);

  const load = React.useCallback(() => {
    getSessionIdentity()
      .then((identity) => {
        setMyId(identity.id);
        return getNotifications(identity.id);
      })
      .then(setItems)
      .catch(() => setFailed(true));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const unread = (items ?? []).filter((n) => !n.isRead).length;
  const visible = (items ?? []).filter((n) => (filter === "unread" ? !n.isRead : true));

  async function handleMarkAll() {
    setMarking(true);
    try {
      const count = await markAllAsRead(myId);
      setItems((prev) => (prev ?? []).map((n) => ({ ...n, isRead: true })));
      success(count > 0 ? "All caught up" : "Nothing to mark", count > 0 ? `${count} notification${count === 1 ? "" : "s"} marked as read.` : "You have no unread notifications.");
    } catch {
      error("Couldn't update notifications", "Please try again.");
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        subtitle="Invitations, team updates, and matches."
        actions={
          <Button variant="outline" size="sm" loading={marking} disabled={unread === 0} onClick={handleMarkAll}>
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </Button>
        }
      />

      <div className="mt-5">
        <NotificationFilters value={filter} onChange={setFilter} unreadCount={unread} />
      </div>

      <div className="mt-4">
        {failed ? (
          <ErrorState
            title="Couldn't load notifications"
            description="Something went wrong. Please try again."
            onRetry={() => {
              setFailed(false);
              load();
            }}
          />
        ) : !items ? (
          <Card>
            <CardContent className="space-y-3 py-5" role="status" aria-label="Loading notifications">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : visible.length === 0 ? (
          <EmptyState
            title={filter === "unread" ? "No unread notifications" : "You're all caught up!"}
            description="New team invitations and updates will appear here."
            actionLabel="Browse Projects"
            actionHref="/projects"
          />
        ) : (
          <Card>
            <CardContent className="py-2">
              <ul className="divide-y divide-slate-100">
                {visible.map((n) => (
                  <li key={n.id}>
                    <NotificationItem
                      notification={n}
                      onRead={(id) =>
                        setItems((prev) =>
                          (prev ?? []).map((x) => (x.id === id ? { ...x, isRead: true } : x))
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
