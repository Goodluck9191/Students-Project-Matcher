import { Badge } from "@/components/ui/Badge";
import type { TeamRequestStatus } from "@/types";

const STATUS_VARIANT: Record<TeamRequestStatus, "warning" | "success" | "error" | "default"> = {
  pending: "warning",
  accepted: "success",
  rejected: "error",
  cancelled: "default",
};

const STATUS_LABEL: Record<TeamRequestStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function RequestStatus({ status }: { status: TeamRequestStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
