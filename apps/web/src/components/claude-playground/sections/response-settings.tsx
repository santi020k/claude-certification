import { Input } from '@repo/ui/components/ui/input'
import { Label } from '@repo/ui/components/ui/label'
import { Switch } from '@repo/ui/components/ui/switch'

interface ResponseSettingsProps {
  maxTokens: number
  oneSentence: boolean
  onMaxTokensChange: (maxTokens: number) => void
  onOneSentenceChange: (oneSentence: boolean) => void
}

export function ResponseSettings({
  maxTokens,
  oneSentence,
  onMaxTokensChange,
  onOneSentenceChange
}: ResponseSettingsProps) {
  return (
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
        <span className="text-[10px] text-muted-foreground/60 font-medium">Claude output</span>
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
  )
}
