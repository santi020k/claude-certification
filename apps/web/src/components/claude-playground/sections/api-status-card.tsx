import { KeyRound } from "lucide-react";

import { formatModel } from "../format";
import { StatusDot } from "../primitives/status-dot";
import type { HealthResponse } from "../types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";

export function ApiStatusCard({ health }: { health: HealthResponse | null }) {
  return (
    <Card
      className="
      animate-slide-up-fade card-hover rounded-2xl border-white/8 bg-white/2.5
      shadow-2xl backdrop-blur-md delay-300
    "
    >
      <CardHeader className="border-b border-white/6 px-7 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle
              className="
              text-sm font-semibold tracking-wider text-muted-foreground/70
              uppercase
            "
            >
              API Status
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-muted-foreground">
              Backend environment info.
            </CardDescription>
          </div>
          {health ? <StatusDot ok={health.status === "ok"} /> : null}
        </div>
      </CardHeader>

      <CardContent className="px-7 pt-5 pb-7">
        {health ? (
          <dl
            className="
              grid gap-3 text-sm
              sm:grid-cols-2
            "
          >
            <div
              className="
                animate-scale-in rounded-xl border border-white/6 bg-white/2 p-4
              "
            >
              <dt className="mb-1 text-xs text-muted-foreground/50">
                Environment
              </dt>
              <dd className="font-medium">{health.environment}</dd>
            </div>
            <div
              className="
                  animate-scale-in rounded-xl border border-white/6 bg-white/2
                  p-4
                "
              style={{ animationDelay: "60ms" }}
            >
              <dt className="mb-1 text-xs text-muted-foreground/50">API key</dt>
              <dd
                className={`
                  font-medium
                  ${
                    health.anthropic_api_key_configured
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }
                `}
              >
                {health.anthropic_api_key_configured
                  ? "Configured ✓"
                  : "Missing ✗"}
              </dd>
            </div>
            <div
              className="
                  animate-scale-in rounded-xl border border-white/6 bg-white/2
                  p-4
                  sm:col-span-2
                "
              style={{ animationDelay: "120ms" }}
            >
              <dt className="mb-1 text-xs text-muted-foreground/50">Model</dt>
              <dd className="font-mono font-medium text-orange-300">
                {formatModel(health.model)}
              </dd>
            </div>
          </dl>
        ) : (
          <div
            className="
              flex items-start gap-3 rounded-xl border border-white/6 bg-white/2
              p-5 text-xs text-muted-foreground/50
            "
          >
            <KeyRound className="mt-0.5 size-4 shrink-0 text-orange-400/30" />
            <span>
              Click <strong className="text-foreground/40">Check API</strong> in
              the header to verify environment and model configuration.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
