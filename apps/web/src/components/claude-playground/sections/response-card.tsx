import { Check, Copy, Sparkles } from 'lucide-react'

import { formatModel } from '../format'
import { MarkdownAnswer } from '../primitives/markdown-answer'
import { SkeletonLine } from '../primitives/skeleton-line'
import { TokenBar } from '../primitives/token-bar'
import { TypingDots } from '../primitives/typing-dots'
import type { AskResponse } from '../types'

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

interface ResponseCardProps {
  answer: AskResponse | null
  answerKey: number
  copied: boolean
  isAsking: boolean
  maxTokens: number
  responseTime: number | null
  onCopyAnswer: () => Promise<void>
}

export function ResponseCard({
  answer,
  answerKey,
  copied,
  isAsking,
  maxTokens,
  responseTime,
  onCopyAnswer
}: ResponseCardProps) {
  return (
    <Card className="
      animate-slide-up-fade card-hover flex min-h-120 flex-col rounded-2xl
      border-white/8 bg-white/2.5 shadow-2xl backdrop-blur-md delay-225
    "
    >
      <CardHeader className="border-b border-white/6 px-7 pt-7 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="
              text-sm font-semibold tracking-wider text-muted-foreground/70
              uppercase
            "
            >
              Response
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-muted-foreground">
              Claude output appears here.
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {answer && responseTime ?
              (
                <Badge
                  variant="outline"
                  className="
                    animate-scale-in border-white/10 font-mono text-[11px]
                    text-muted-foreground/60
                  "
                >
                  {(responseTime / 1000).toFixed(1)}
                  s
                </Badge>
              ) :
              null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void onCopyAnswer()
              }}
              disabled={!answer?.answer}
              className="
                gap-2 border-white/10 bg-white/3 transition-all duration-200
                hover:border-white/20 hover:bg-white/[0.07]
              "
            >
              {copied ?
                <Check className="size-3.5 text-emerald-400" /> :
                (
                  <Copy className="size-3.5" />
                )}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5 px-7 pt-6">
        {isAsking ?
          (
            <div className="
              flex flex-1 flex-col gap-4 rounded-xl border border-dashed
              border-white/8 bg-white/1.5 p-7
            "
            >
              <div className="
                flex items-center gap-3 text-sm text-muted-foreground/60
              "
              >
                <TypingDots />
                <span>Claude is thinking…</span>
              </div>
              <div className="flex flex-1 flex-col gap-3 pt-2">
                <SkeletonLine w="90%" delay={0} />
                <SkeletonLine w="75%" delay={100} />
                <SkeletonLine w="85%" delay={200} />
                <SkeletonLine w="60%" delay={300} />
                <SkeletonLine w="80%" delay={400} />
                <SkeletonLine w="45%" delay={500} />
              </div>
            </div>
          ) :
          answer ?
            (
              <div
                key={answerKey}
                className="animate-answer-reveal flex flex-1 flex-col gap-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="
                    rounded-md border-orange-300/20 bg-orange-200/10 px-2.5 py-1
                    text-xs font-medium text-orange-100
                  "
                  >
                    {formatModel(answer.model)}
                  </Badge>
                </div>

                <div className="
                  flex-1 rounded-xl border border-white/8 bg-black/25 p-6
                "
                >
                  <div className="text-sm">
                    <MarkdownAnswer content={answer.answer} />
                  </div>
                </div>

                <div className="
                  space-y-4 rounded-xl border border-white/6 bg-white/2 p-5
                "
                >
                  <p className="
                    text-[10px] tracking-widest text-muted-foreground/60 font-medium uppercase
                  "
                  >
                    Token usage
                  </p>
                  <TokenBar
                    label="Input tokens"
                    value={answer.input_tokens}
                    max={Math.max(answer.input_tokens * 2, maxTokens * 3)}
                    color="bg-gradient-to-r from-stone-400 to-stone-300"
                    delay={0}
                  />
                  <TokenBar
                    label="Output tokens"
                    value={answer.output_tokens}
                    max={maxTokens}
                    color="bg-gradient-to-r from-[#cc785c] to-[#d98b70]"
                    delay={150}
                  />
                </div>
              </div>
            ) :
            (
              <div className="
                flex flex-1 flex-col items-center justify-center gap-5
                rounded-xl border border-dashed border-white/8 bg-white/1 p-10
                text-center
              "
              >
                <div className="
                  relative flex size-16 items-center justify-center rounded-2xl
                  border border-white/10 bg-white/4
                "
                >
                  <span
                    className="
                      absolute inset-0 animate-ping rounded-2xl border
                      border-orange-500/20
                    "
                    style={{ animationDuration: '2.5s' }}
                  />
                  <Sparkles className="size-7 text-orange-400/50" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground/60">No answer yet</p>
                  <p className="
                    max-w-[240px] text-xs/6 text-muted-foreground/50
                  "
                  >
                    Write a question and hit
                    {' '}
                    <span className="text-orange-400/80">Ask Claude</span>
                    , or run
                    {' '}
                    <span className="text-orange-400/80">Demo</span>
                    {' '}
                    to verify the API is wired.
                  </p>
                </div>
              </div>
            )}
      </CardContent>

      <CardFooter className="border-t border-white/6 px-7 pt-5 pb-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void onCopyAnswer()
          }}
          disabled={!answer?.answer}
          className="
            gap-2 border-white/10 bg-white/3 transition-all duration-200
            hover:border-white/20 hover:bg-white/[0.07]
          "
        >
          {copied ?
            <Check className="size-3.5 text-emerald-400" /> :
            (
              <Copy className="size-3.5" />
            )}
          {copied ? 'Copied!' : 'Copy Markdown'}
        </Button>
      </CardFooter>
    </Card>
  )
}
