import Image from 'next/image'
import Link from 'next/link'

import { Activity, ArrowLeft, ChevronRight, LoaderCircle } from 'lucide-react'

import { EXAMPLE_PROMPTS } from '../constants'
import { formatModel } from '../format'
import { StatusDot } from '../primitives/status-dot'
import type { HealthResponse } from '../types'

import { Badge } from '@repo/ui/components/ui/badge'
import { Button } from '@repo/ui/components/ui/button'

interface PlaygroundHeaderProps {
  apiBaseUrl: string
  health: HealthResponse | null
  isChecking: boolean
  onCheckHealth: () => void
  onSelectPrompt: (prompt: string) => void
}

export function PlaygroundHeader({
  apiBaseUrl,
  health,
  isChecking,
  onCheckHealth,
  onSelectPrompt
}: PlaygroundHeaderProps) {
  return (
    <header className="
      animate-slide-up-fade flex flex-col gap-7 rounded-2xl border
      border-white/8 bg-white/2.5 p-8 shadow-2xl backdrop-blur-md delay-0
      sm:flex-row sm:items-start sm:justify-between
    "
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="
              group flex items-center gap-2.5 rounded-xl border border-white/8
              bg-white/4 px-3 py-1.5 transition-all duration-200
              hover:border-white/16 hover:bg-white/[0.07]
            "
          >
            <Image
              src="/brand/icon.svg"
              alt="Claude Certification icon"
              width={22}
              height={22}
              className="rounded-sm opacity-90"
            />
            <span className="
              text-xs font-medium text-foreground/70
              group-hover:text-foreground/90
            "
            >
              Claude Certification
            </span>
          </Link>
          <Badge
            variant="outline"
            className="border-white/10 px-3 py-1 text-muted-foreground"
          >
            FastAPI + Next.js
          </Badge>
          <Badge
            variant="outline"
            className="border-white/10 px-3 py-1 text-muted-foreground"
          >
            Anthropic SDK
          </Badge>
        </div>

        <div className="space-y-3">
          <h1 className="
            text-4xl font-bold tracking-tight
            sm:text-5xl
            lg:text-6xl
          "
          >
            <span className="
              bg-linear-to-r from-orange-300 via-amber-200 to-yellow-100
              bg-clip-text text-transparent
            "
            >
              Ask Claude
            </span>
            {' '}
            <span className="text-foreground/90">from a</span>
            <br className="
              hidden
              sm:block
            "
            />
            <span className="text-foreground/90"> production playground.</span>
          </h1>
          <p className="max-w-lg text-base/7 text-muted-foreground">
            Test the backend contract, tune response length, and verify the deployed API —
            all from one focused interface.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {EXAMPLE_PROMPTS.slice(0, 2).map(prompt => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                onSelectPrompt(prompt)
              }}
              className="
                group flex items-center gap-1.5 rounded-full border
                border-white/8 bg-white/4 px-4 py-1.5 text-xs
                text-muted-foreground transition-all duration-200
                hover:border-orange-500/25 hover:bg-orange-500/8
                hover:text-orange-200
              "
            >
              <ChevronRight className="
                size-3 shrink-0 text-orange-400/50 transition-transform
                duration-200
                group-hover:translate-x-0.5
              "
              />
              {prompt.length > 40 ? prompt.slice(0, 40) + '…' : prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="
        flex shrink-0 flex-col items-start gap-3
        sm:items-end
      "
      >
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
        </Button>
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
            <LoaderCircle className="size-3.5 animate-spin" /> :
            <Activity className="size-3.5" />}
          Check API
        </Button>

        {health ?
          (
            <div className="
              animate-scale-in flex items-center gap-2 rounded-lg border
              border-white/8 bg-white/3 px-3 py-2 text-xs text-muted-foreground
            "
            >
              <StatusDot ok={health.status === 'ok'} />
              <span>{health.environment}</span>
              <span className="text-muted-foreground/60">·</span>
              <span className="font-mono">{formatModel(health.model)}</span>
            </div>
          ) :
          null}

        <p className="max-w-[180px] text-xs break-all text-muted-foreground/70">{apiBaseUrl}</p>
      </div>
    </header>
  )
}
