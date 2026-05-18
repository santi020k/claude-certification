import type { RefObject } from 'react'

import { Label } from '@repo/ui/components/ui/label'
import { Textarea } from '@repo/ui/components/ui/textarea'

interface PromptQuestionFieldProps {
  canSubmit: boolean
  oneSentence: boolean
  question: string
  textareaRef: RefObject<HTMLTextAreaElement | null>
  onQuestionChange: (question: string) => void
}

export function PromptQuestionField({
  canSubmit,
  oneSentence,
  question,
  textareaRef,
  onQuestionChange
}: PromptQuestionFieldProps) {
  return (
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
            placeholder:text-muted-foreground/40
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
  )
}
