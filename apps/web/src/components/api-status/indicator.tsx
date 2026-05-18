"use client";

import { formatModel } from "@/components/claude-playground/format";

import type { ApiStatusState } from "./context";
import { useApiStatus } from "./context";

const config: Record<
  ApiStatusState,
  { dot: string; pulse: boolean; label: string }
> = {
  idle: { dot: "bg-muted-foreground/30", pulse: false, label: "API" },
  checking: { dot: "bg-amber-400/80", pulse: true, label: "Checking…" },
  online: { dot: "bg-emerald-400", pulse: false, label: "Online" },
  offline: { dot: "bg-rose-400", pulse: false, label: "Offline" },
};

interface ApiStatusIndicatorProps {
  /** Show the active model name next to the status label */
  showModel?: boolean;
}

export function ApiStatusIndicator({
  showModel = false,
}: ApiStatusIndicatorProps) {
  const { health, status } = useApiStatus();
  const { dot, pulse, label } = config[status];

  const modelTag = showModel && health ? ` · ${formatModel(health.model)}` : "";

  return (
    <div
      title={
        status === "online"
          ? `Backend online — ${formatModel(health?.model ?? "")}`
          : status === "offline"
            ? "Backend is unreachable"
            : "Checking backend…"
      }
      className="
        flex items-center gap-2 rounded-full border border-white/10 bg-white/4
        px-3 py-1.5 transition-colors
      "
    >
      {/* Pulsing dot */}
      <span className="relative flex size-2 shrink-0">
        {pulse && (
          <span
            className={`
              absolute inline-flex size-full animate-ping rounded-full opacity-75
              ${dot}
            `}
          />
        )}
        <span className={`relative inline-flex size-2 rounded-full ${dot}`} />
      </span>

      <span className="text-xs font-medium text-muted-foreground">
        {label}
        {modelTag}
      </span>
    </div>
  );
}
