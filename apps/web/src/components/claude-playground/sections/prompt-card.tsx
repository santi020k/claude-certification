import type { FormEvent, RefObject } from 'react'

import { Badge } from '@repo/ui/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@repo/ui/components/ui/card'

import { ExamplePromptList } from './example-prompt-list'
import { PromptActions } from './prompt-actions'
import { PromptQuestionField } from './prompt-question-field'
import { ResponseSettings } from './response-settings'

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
          <PromptQuestionField
            canSubmit={canSubmit}
            oneSentence={oneSentence}
            question={question}
            textareaRef={textareaRef}
            onQuestionChange={onQuestionChange}
          />

          <ExamplePromptList
            textareaRef={textareaRef}
            onQuestionChange={onQuestionChange}
          />

          <ResponseSettings
            maxTokens={maxTokens}
            oneSentence={oneSentence}
            onMaxTokensChange={onMaxTokensChange}
            onOneSentenceChange={onOneSentenceChange}
          />
        </CardContent>

        <CardFooter className="
          border-t border-white/6 bg-black/10 px-7 pt-5 pb-6
        "
        >
          <PromptActions
            canSubmit={canSubmit}
            cooldownSeconds={cooldownSeconds}
            isAsking={isAsking}
            isLimited={isLimited}
            remaining={remaining}
            retryAfter={retryAfter}
            onDemo={onDemo}
            onReset={onReset}
          />
        </CardFooter>
      </form>
    </Card>
  )
}
