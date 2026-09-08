import * as React from "react";
import { cn, getInitials } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<Size, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-[15px]",
  xl: "h-16 w-16 text-lg",
};

export function Avatar({
  name,
  src,
  size = "md",
  className,
  showStatus = false,
  status = "online",
}: {
  name: string;
  src?: string;
  size?: Size;
  className?: string;
  showStatus?: boolean;
  status?: "online" | "offline" | "busy";
}) {
  const statusColor =
    status === "online"
      ? "bg-emerald-500"
      : status === "busy"
        ? "bg-amber-500"
        : "bg-slate-300";

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className={cn(
            "rounded-full bg-slate-100 object-cover ring-1 ring-slate-200",
            sizeClasses[size]
          )}
        />
      ) : (
        <span
          aria-label={name}
          role="img"
          className={cn(
            "inline-flex items-center justify-center rounded-full font-semibold",
            "bg-gradient-to-br from-brand-500 to-accent-500 text-white",
            sizeClasses[size]
          )}
        >
          {getInitials(name)}
        </span>
      )}
      {showStatus && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white",
            statusColor
          )}
        />
      )}
    </span>
  );
}
