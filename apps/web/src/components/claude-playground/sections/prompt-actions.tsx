import { LoaderCircle, RotateCcw, Send, Zap } from 'lucide-react'

import { Button } from '@repo/ui/components/ui/button'

import { CLIENT_RATE_LIMIT } from '../constants'

interface PromptActionsProps {
  canSubmit: boolean
  cooldownSeconds: number
  isAsking: boolean
  isLimited: boolean
  remaining: number
  retryAfter: number | null
  onDemo: () => Promise<void>
  onReset: () => void
}

export function PromptActions({
  canSubmit,
  cooldownSeconds,
  isAsking,
  isLimited,
  remaining,
  retryAfter,
  onDemo,
  onReset
}: PromptActionsProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full gap-2.5">
        <Button
          type="submit"
          disabled={!canSubmit}
          className="
            group flex-1 gap-2 bg-[#cc785c] text-[#1f1a16] shadow-lg
            shadow-orange-950/20 transition-all duration-200
            hover:scale-[1.01] hover:bg-[#d98b70]
            disabled:opacity-50
            sm:flex-none
          "
        >
          {isAsking ?
            <LoaderCircle className="size-4 animate-spin" /> :
            (
              <Send className="
                size-4 transition-transform duration-200
                group-hover:translate-x-0.5
              "
              />
            )}
          Ask Claude
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void onDemo()
          }}
          disabled={isAsking || isLimited || retryAfter !== null}
          className="
            flex-1 gap-2 border-white/10 bg-white/4 transition-all
            duration-200
            hover:border-white/20 hover:bg-white/8
            disabled:opacity-50
            sm:flex-none
          "
        >
          <Zap className="size-4" />
          Demo
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onReset}
          title="Reset"
          className="
            shrink-0 transition-all
            hover:bg-white/6
          "
          style={{ transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1), background 0.2s' }}
          onMouseEnter={event => {
            event.currentTarget.style.transform = 'rotate(180deg)'
          }}
          onMouseLeave={event => {
            event.currentTarget.style.transform = 'rotate(0deg)'
          }}
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <div className="
        flex items-center justify-between gap-3 text-xs
        text-muted-foreground/50
      "
      >
        <RateLimitStatus
          cooldownSeconds={cooldownSeconds}
          isLimited={isLimited}
          remaining={remaining}
          retryAfter={retryAfter}
        />
        <span className="
          hidden shrink-0 items-center gap-1
          sm:flex
        "
        >
          <kbd className="
            rounded-sm border border-white/10 px-1.5 py-0.5
            font-mono text-[10px]
          "
          >
            ⌘
          </kbd>
          +
          <kbd className="
            rounded-sm border border-white/10 px-1.5 py-0.5
            font-mono text-[10px]
          "
          >
            ↵
          </kbd>
        </span>
      </div>
    </div>
  )
}

function RateLimitStatus({
  cooldownSeconds,
  isLimited,
  remaining,
  retryAfter
}: Pick<PromptActionsProps, 'cooldownSeconds' | 'isLimited' | 'remaining' | 'retryAfter'>) {
  if (retryAfter !== null) {
    return (
      <span className="
        flex items-center gap-1.5 font-mono text-rose-400/80
      "
      >
        <span className="
          inline-block size-1.5 animate-pulse rounded-full
          bg-rose-400
        "
        />
        Rate limited — retry in
        {' '}
        {retryAfter}
        s
      </span>
    )
  }

  if (isLimited) {
    return (
      <span className="
        flex items-center gap-1.5 font-mono
        text-amber-400/80
      "
      >
        <span className="
          inline-block size-1.5 animate-pulse rounded-full
          bg-amber-400
        "
        />
        Slow down — retry in
        {' '}
        {cooldownSeconds}
        s
      </span>
    )
  }

  return (
    <span className="
      flex items-center gap-1.5 text-muted-foreground/60
    "
    >
      <span className="font-mono tabular-nums">
        {remaining}
        /
        {CLIENT_RATE_LIMIT}
      </span>
      <span>req/min remaining</span>
    </span>
  )
}
