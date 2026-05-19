import Link from 'next/link'

import { Activity, ArrowLeft, ChevronRight, LoaderCircle } from 'lucide-react'

import { EXAMPLE_PROMPTS } from '../constants'
import { formatModel } from '../format'
import { StatusDot } from '../primitives/status-dot'
import type { HealthResponse } from '../types'

import { Button } from '@repo/ui/components/ui/button'

interface PlaygroundHeaderProps {
  health: HealthResponse | null
  isChecking: boolean
  onCheckHealth: () => void
  onSelectPrompt: (prompt: string) => void
}

export function PlaygroundHeader({
  health,
  isChecking,
  onCheckHealth,
  onSelectPrompt
}: PlaygroundHeaderProps) {
  return (
    <header className="animate-fade-in flex flex-col gap-5">
      {/* ── Nav row ──────────────────────────────────────────────────────── */}
      <nav className="flex flex-wrap items-center justify-between gap-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="
            -ml-3 text-muted-foreground
            hover:text-foreground
          "
        >
          <Link href="/">
            <ArrowLeft className="size-3.5" />
            Home
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCheckHealth}
            disabled={isChecking}
            className="
              border-white/10 bg-white/5 transition-all duration-200
              hover:border-white/20 hover:bg-white/10
            "
          >
            {isChecking ?
              (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) :
              (
                <Activity className="size-3.5" />
              )}
            Check API
          </Button>

          {health ?
            (
              <div
                className="
                  animate-scale-in flex items-center gap-2 rounded-lg border
                  border-white/10 bg-white/[0.035] px-3 py-2 text-xs
                  text-muted-foreground
                "
              >
                <StatusDot ok={health.status === 'ok'} />
                <span>{health.environment}</span>
                <span className="text-muted-foreground/60">·</span>
                <span className="font-mono">{formatModel(health.model)}</span>
              </div>
            ) :
            null}
        </div>
      </nav>

      {/* ── Page title ───────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl/tight font-semibold text-foreground">
          Prompt Playground
        </h1>
        <p className="mt-1.5 max-w-xl text-sm/6 text-muted-foreground">
          Powered by
          {' '}
          <span className="font-mono text-orange-200/80">POST /api/ask</span>
          {' '}
          —
          tune response length, try one-sentence mode, and verify your backend.
        </p>
      </div>

      {/* ── Example prompt chips ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.slice(0, 2).map(prompt => (
          <button
            key={prompt}
            type="button"
            onClick={() => {
              onSelectPrompt(prompt)
            }}
            className="
              group flex items-center gap-1.5 rounded-full border
              border-white/10 bg-white/[0.035] px-4 py-1.5 text-xs
              text-muted-foreground transition-all duration-200
              hover:border-orange-500/25 hover:bg-orange-500/8
              hover:text-orange-200
            "
          >
            <ChevronRight
              className="
                size-3 shrink-0 text-orange-400/50 transition-transform
                duration-200
                group-hover:translate-x-0.5
              "
            />
            {prompt.length > 40 ? prompt.slice(0, 40) + '…' : prompt}
          </button>
        ))}
      </div>
    </header>
  )
}
