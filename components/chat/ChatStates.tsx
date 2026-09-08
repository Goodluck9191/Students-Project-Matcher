import { MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";

export function ChatEmptyState() {
  return (
    <div className="flex h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <MessageCircle className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="mt-4 font-semibold text-slate-900">Start the conversation</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          Use this chat to coordinate your project, discuss meetings, share
          ideas, and keep your team updated.
        </p>
      </div>
    </div>
  );
}

export function ChatLoadingState() {
  return (
    <div className="space-y-4 px-1 py-2" role="status" aria-label="Loading messages">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`flex gap-2 ${i % 2 === 1 ? "flex-row-reverse" : ""}`}>
          {i % 2 === 0 && <Skeleton className="h-8 w-8 shrink-0 rounded-full" />}
          <div className={`flex-1 space-y-1.5 ${i % 2 === 1 ? "flex flex-col items-end" : ""}`}>
            <Skeleton className={i % 2 === 1 ? "h-12 w-2/3 rounded-2xl" : "h-14 w-3/4 rounded-2xl"} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatAccessDenied({ teamTitle }: { teamTitle?: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <EmptyState
        title="You are not a member of this team"
        description={
          teamTitle
            ? `Only members of ${teamTitle} can access this chat.`
            : "Only team members can access this chat."
        }
        actionLabel="Back to Team"
        actionHref="/teams"
      />
    </div>
  );
}

export function ChatMembersLoading() {
  return (
    <div className="space-y-2" role="status" aria-label="Loading members">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2.5 px-2 py-2">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatHeaderLoading() {
  return (
    <div className="border-b border-slate-200/80 bg-white px-4 py-3 sm:px-6" role="status" aria-label="Loading chat">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-48 max-w-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}
