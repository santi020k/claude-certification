import type { FormEvent, RefObject } from 'react'

import { ChevronRight, LoaderCircle, RotateCcw, Send, Zap } from 'lucide-react'

import { Badge } from '@repo/ui/components/ui/badge'
import { Button } from '@repo/ui/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@repo/ui/components/ui/card'
import { Input } from '@repo/ui/components/ui/input'
import { Label } from '@repo/ui/components/ui/label'
import { Switch } from '@repo/ui/components/ui/switch'
import { Textarea } from '@repo/ui/components/ui/textarea'

import { CLIENT_RATE_LIMIT, EXAMPLE_PROMPTS } from '../constants'

interface PromptCardProps {
  canSubmit: boolean
  cooldownSeconds: number
  isAsking: boolean
  isLimited: boolean
  maxTokens: number
  oneSentence: boolean
  question: string
  remaining: number
  retryAfter: number | null
  textareaRef: RefObject<HTMLTextAreaElement | null>
  onAsk: (event?: FormEvent<HTMLFormElement>) => Promise<void>
  onDemo: () => Promise<void>
  onQuestionChange: (question: string) => void
  onReset: () => void
  onMaxTokensChange: (maxTokens: number) => void
  onOneSentenceChange: (oneSentence: boolean) => void
}

export function PromptCard({
  canSubmit,
  cooldownSeconds,
  isAsking,
  isLimited,
  maxTokens,
  oneSentence,
  question,
  remaining,
  retryAfter,
  textareaRef,
  onAsk,
  onDemo,
  onQuestionChange,
  onReset,
  onMaxTokensChange,
  onOneSentenceChange
}: PromptCardProps) {
  return (
    <Card className="
      animate-slide-up-fade card-hover overflow-hidden rounded-2xl
      border-white/8 bg-[#211d19]/80 shadow-2xl shadow-black/30
      backdrop-blur-md delay-150
    "
    >
      <CardHeader className="
        border-b border-white/6 bg-white/2.5 px-7 pt-7 pb-5
      "
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="
              text-muted-foreground/70 text-sm font-semibold
              tracking-wider uppercase
            "
            >
              Prompt
            </CardTitle>
            <CardDescription className="
              text-muted-foreground mt-1 text-sm
            "
            >
              Shape the request Claude will answer.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="
              border-orange-300/15 bg-orange-200/8 text-[10px]
              tracking-wider text-orange-100/70 uppercase
            "
          >
            Live
          </Badge>
        </div>
      </CardHeader>

      <form onSubmit={onAsk}>
        <CardContent className="space-y-6 p-7">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label
                htmlFor="question"
                className="
                  text-muted-foreground/60 text-xs font-medium
                  tracking-wider uppercase
                "
              >
                Question
              </Label>
              <span className={`
                rounded-full border px-2 py-0.5 font-mono text-[10px]
                transition-colors duration-200
                ${question.length > 3600 ?
      'border-orange-300/25 bg-orange-200/10 text-orange-100' :
      'text-muted-foreground/50 border-white/8 bg-white/2.5'
    }
              `}
              >
                {question.length.toLocaleString()}
                {' '}
                / 4 000
              </span>
            </div>
            <div className="
              input-focus overflow-hidden rounded-xl border border-white/8
              bg-[#29241f] transition-all duration-200
              focus-within:border-orange-300/30
            "
            >
              <Textarea
                id="question"
                ref={textareaRef}
                value={question}
                onChange={event => {
                  onQuestionChange(event.target.value)
                }}
                placeholder="Ask Claude something useful…"
                className="
                  min-h-48 resize-y border-0 bg-transparent p-4 text-sm/7
                  placeholder:text-white/15
                  focus-visible:ring-0
                "
                maxLength={4000}
              />
              <div className="
                text-muted-foreground/45 flex items-center justify-between
                border-t border-white/6 bg-black/10 px-4 py-2 text-xs
              "
              >
                <span>{canSubmit ? 'Ready to ask' : 'Min 3 chars'}</span>
                <span className="font-mono">{oneSentence ? 'brief mode' : 'full answer'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="
                text-[10px] tracking-widest text-white/20 uppercase
              "
              >
                Try an example
              </p>
              <span className="text-[10px] text-white/15">
                {EXAMPLE_PROMPTS.length}
                {' '}
                presets
              </span>
            </div>
            <div className="grid gap-2">
              {EXAMPLE_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    onQuestionChange(prompt)
                    textareaRef.current?.focus()
                  }}
                  className="
                    group text-muted-foreground/65
                    hover:text-foreground/85
                    flex items-center gap-3 rounded-xl border
                    border-white/6 bg-white/2.5 px-4 py-3 text-left
                    text-xs transition-all duration-150
                    hover:border-orange-300/20 hover:bg-orange-200/8
                  "
                >
                  <span className="
                    flex size-5 shrink-0 items-center justify-center
                    rounded-full bg-orange-200/8 text-orange-200/60
                    transition-colors
                    group-hover:bg-orange-200/15
                    group-hover:text-orange-100
                  "
                  >
                    <ChevronRight className="
                      size-3 transition-transform duration-200
                      group-hover:translate-x-0.5
                    "
                    />
                  </span>
                  <span className="leading-5">{prompt}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="
            rounded-xl border border-white/6 bg-white/2.5 p-4
          "
          >
            <div className="mb-3 flex items-center justify-between">
              <Label
                htmlFor="max-tokens"
                className="
                  text-muted-foreground/60 text-xs font-medium
                  tracking-wider uppercase
                "
              >
                Response settings
              </Label>
              <span className="text-[10px] text-white/20">Claude output</span>
            </div>
            <div className="
              grid gap-3
              sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center
            "
            >
              <Input
                id="max-tokens"
                type="number"
                min={50}
                max={4000}
                step={50}
                value={maxTokens}
                onChange={event => {
                  onMaxTokensChange(Number(event.target.value))
                }}
                className="
                  h-10 border-white/8 bg-black/10 font-mono text-sm
                  transition-all duration-200
                  focus-visible:border-orange-300/40 focus-visible:ring-2
                  focus-visible:ring-orange-300/15
                "
              />
              <div className="
                flex h-10 items-center justify-between gap-3 rounded-lg
                border border-white/8 bg-black/10 px-4
              "
              >
                <Label
                  htmlFor="one-sentence"
                  className="
                    text-muted-foreground text-xs whitespace-nowrap
                  "
                >
                  One sentence
                </Label>
                <Switch id="one-sentence" checked={oneSentence} onCheckedChange={onOneSentenceChange} />
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="
          border-t border-white/6 bg-black/10 px-7 pt-5 pb-6
        "
        >
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
              text-white/18
            "
            >
              {retryAfter !== null ?
                (
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
                ) :
                isLimited ?
                  (
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
                  ) :
                  (
                    <span className="
                      flex items-center gap-1.5 text-white/20
                    "
                    >
                      <span className="font-mono tabular-nums">
                        {remaining}
                        /
                        {CLIENT_RATE_LIMIT}
                      </span>
                      <span>req/min remaining</span>
                    </span>
                  )}
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
        </CardFooter>
      </form>
    </Card>
  )
}
