import type { RefObject } from "react";

import { ChevronRight } from "lucide-react";

import { EXAMPLE_PROMPTS } from "../constants";

interface ExamplePromptListProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onQuestionChange: (question: string) => void;
}

export function ExamplePromptList({
  textareaRef,
  onQuestionChange,
}: ExamplePromptListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p
          className="
            text-[10px] font-medium tracking-widest text-muted-foreground/60
            uppercase
          "
        >
          Try an example
        </p>
        <span className="text-[10px] text-muted-foreground/50">
          {EXAMPLE_PROMPTS.length} presets
        </span>
      </div>
      <div className="grid gap-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => {
              onQuestionChange(prompt);

              textareaRef.current?.focus();
            }}
            className="
              group flex items-center gap-3 rounded-xl border border-white/6
              bg-white/2.5 px-4 py-3 text-left text-xs text-muted-foreground/65
              transition-all duration-150
              hover:border-orange-300/20 hover:bg-orange-200/8
              hover:text-foreground/85
            "
          >
            <span
              className="
                flex size-5 shrink-0 items-center justify-center rounded-full
                bg-orange-200/8 text-orange-200/60 transition-colors
                group-hover:bg-orange-200/15 group-hover:text-orange-100
              "
            >
              <ChevronRight
                className="
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
  );
}
