'use client'

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

import Image from 'next/image'

import {
  Activity,
  AlertCircle,
  Check,
  ChevronRight,
  Copy,
  KeyRound,
  LoaderCircle,
  RotateCcw,
  Send,
  Sparkles,
  Zap
} from 'lucide-react'
import remarkGfm from 'remark-gfm'

import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/ui/alert'
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface AskResponse {
  question: string
  answer: string
  model: string
  input_tokens: number
  output_tokens: number
}

interface HealthResponse {
  status: string
  environment: string
  anthropic_api_key_configured: boolean
  model: string
}

// ── Rate-limit constants ───────────────────────────────────────────────────────
// Mirror the backend limits so the client can self-throttle before even hitting
// the network. When the backend still returns 429 (e.g. multiple tabs), we handle
// that separately via the Retry-After header.
const CLIENT_RATE_LIMIT   = 10   // max requests
const CLIENT_WINDOW_MS    = 60_000 // per 60-second sliding window

// ── Constants ─────────────────────────────────────────────────────────────────

const STARTER_QUESTION =
  'Explain how Claude can help a small engineering team review pull requests.'

const EXAMPLE_PROMPTS = [
  'Explain Python decorators with a practical example.',
  'What are the trade-offs between REST and GraphQL?',
  'Write a short poem about distributed systems.',
  'Summarise the CAP theorem in three bullet points.'
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: unknown }

    if (typeof payload.detail === 'string') return payload.detail
  } catch { /* ignore */ }

  return 'The API returned an unexpected response.'
}

/** Parse the Retry-After header (seconds or HTTP-date) into seconds remaining. */
function parseRetryAfter(response: Response): number {
  const raw = response.headers.get('Retry-After')

  if (!raw) return 60

  const secs = parseInt(raw, 10)

  if (!isNaN(secs)) return Math.max(1, secs)

  const date = Date.parse(raw)

  if (!isNaN(date)) return Math.max(1, Math.ceil((date - Date.now()) / 1000))

  return 60
}

function formatModel(model: string): string {
  const normalized = model
    .replace(/^claude-/, '')
    .replace(/-\d{8}$/, '')
    .replace(/-\d{4}\d*$/, '')
    .replace(/-/g, ' ')
    .replace(/\b(\w)/g, match => match.toUpperCase())
    .replace(/\b4 0\b/g, '4')
    .replace(/\b3 5\b/g, '3.5')
    .replace(/\b3 7\b/g, '3.7')

  return normalized.startsWith('Claude') ? normalized : `Claude ${normalized}`
}

// ── Client-side rate-limit hook ───────────────────────────────────────────────

/**
 * Sliding-window rate limiter that lives entirely in memory (no localStorage).
 * - Keeps the last N request timestamps in a ref.
 * - Returns `isLimited` (boolean), `remaining` (count left), and
 *   `cooldownSeconds` (secs until oldest request expires from the window).
 * - `recordRequest()` must be called right before each API call.
 */
function useClientRateLimit(limit: number, windowMs: number) {
  const timestamps = useRef<number[]>([])
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [remaining, setRemaining]             = useState(limit)

  // Recompute state whenever the window rolls forward
  const recompute = useCallback(() => {
    const now = Date.now()

    timestamps.current = timestamps.current.filter(t => now - t < windowMs)

    const used = timestamps.current.length
    const left = Math.max(0, limit - used)

    setRemaining(left)

    if (left === 0 && timestamps.current.length > 0) {
      const oldest = timestamps.current[0]
      const secs   = Math.ceil((oldest + windowMs - now) / 1000)

      setCooldownSeconds(Math.max(0, secs))
    } else {
      setCooldownSeconds(0)
    }
  }, [limit, windowMs])

  // Tick every second while limited
  useEffect(() => {
    const id = setInterval(recompute, 1_000)

    return () => {
      clearInterval(id)
    }
  }, [recompute])

  const recordRequest = useCallback(() => {
    timestamps.current.push(Date.now())

    recompute()
  }, [recompute])

  const isLimited = remaining === 0

  return { isLimited, remaining, cooldownSeconds, recordRequest }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TokenBar({
  label, value, max, color, delay = 0
}: {
  label: string; value: number; max: number; color: string; delay?: number
}) {
  const [width, setWidth] = useState(0)
  const pct = Math.min(100, (value / max) * 100)

  useEffect(() => {
    const t = setTimeout(() => {
      setWidth(pct)
    }, 80 + delay)

    return () => {
      clearTimeout(t)
    }
  }, [pct, delay])

  return (
    <div className="space-y-1.5">
      <div className="text-muted-foreground flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`
            h-full rounded-full
            ${color}
          `}
          style={{ width: `${width}%`, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="
            inline-block size-1.5 animate-bounce rounded-full bg-orange-400/60
          "
          style={{ animationDelay: `${i * 140}ms`, animationDuration: '0.9s' }}
        />
      ))}
    </span>
  )
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className="relative flex size-2.5 shrink-0">
      {ok ?
        (
          <span className="
            absolute inline-flex size-full animate-ping rounded-full
            bg-emerald-400 opacity-50
          "
          />
        ) :
        null}
      <span className={`
        relative inline-flex size-2.5 rounded-full
        ${ok ?
      'bg-emerald-500' :
      'bg-rose-500'}
      `}
      />
    </span>
  )
}

function SkeletonLine({ w = '100%', delay = 0 }: { w?: string, delay?: number }) {
  return (
    <div
      className="shimmer h-3 rounded-full"
      style={{ width: w, animationDelay: `${delay}ms` }}
    />
  )
}

function MarkdownAnswer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="
            text-foreground mt-2 text-2xl/tight font-semibold
            first:mt-0
          "
          >
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="
            text-foreground mt-7 border-b border-white/8 pb-2 text-xl/tight
            font-semibold
            first:mt-0
          "
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="
            mt-6 text-base/tight font-semibold text-orange-100
            first:mt-0
          "
          >
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="
            text-muted-foreground mt-5 text-sm font-semibold tracking-wide
            uppercase
            first:mt-0
          "
          >
            {children}
          </h4>
        ),
        p: ({ children }) => (
          <p className="
            text-foreground/85 my-3 leading-7
            first:mt-0
            last:mb-0
          "
          >
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="
            text-foreground/85 my-3 space-y-2 pl-5
            marker:text-orange-300/70
          "
          >
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="
            text-foreground/85 my-3 list-decimal space-y-2 pl-5
            marker:text-orange-300/70
          "
          >
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="
            text-muted-foreground my-4 border-l-2 border-orange-300/40 pl-4
          "
          >
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isBlock = typeof className === 'string' && className.includes('language-')

          if (isBlock) {
            return (
              <code className="
                block overflow-x-auto rounded-xl border border-white/8
                bg-[#15110e] p-4 font-mono text-xs/6 text-orange-50/90
              "
              >
                {children}
              </code>
            )
          }

          return (
            <code className="
              rounded-md border border-white/8 bg-white/4 px-1.5 py-0.5
              font-mono text-[0.85em] text-orange-100
            "
            >
              {children}
            </code>
          )
        },
        pre: ({ children }) => <pre className="my-4 overflow-x-auto">{children}</pre>,
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto rounded-xl border border-white/8">
            <table className="w-full border-collapse text-left text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="
            text-foreground border-b border-white/8 bg-white/4 px-3 py-2
            font-semibold
          "
          >
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="
            text-foreground/80 border-b border-white/6 px-3 py-2
            last:border-b-0
          "
          >
            {children}
          </td>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="
              text-orange-200 underline decoration-orange-300/40
              underline-offset-4 transition
              hover:text-orange-100
            "
          >
            {children}
          </a>
        ),
        hr: () => <hr className="my-6 border-white/8" />
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ClaudePlayground() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), [])
  const [question, setQuestion]         = useState(STARTER_QUESTION)
  const [maxTokens, setMaxTokens]       = useState(700)
  const [oneSentence, setOneSentence]   = useState(false)
  const [answer, setAnswer]             = useState<AskResponse | null>(null)
  const [health, setHealth]             = useState<HealthResponse | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const [isAsking, setIsAsking]         = useState(false)
  const [isChecking, setIsChecking]     = useState(false)
  const [copied, setCopied]             = useState(false)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [answerKey, setAnswerKey]       = useState(0)
  const [retryAfter, setRetryAfter]     = useState<number | null>(null) // 429 server-side cooldown (seconds)

  const { isLimited, remaining, cooldownSeconds, recordRequest } =
    useClientRateLimit(CLIENT_RATE_LIMIT, CLIENT_WINDOW_MS)

  // Tick down the server-side Retry-After countdown
  useEffect(() => {
    if (retryAfter === null || retryAfter <= 0) {
      setRetryAfter(null)

      return
    }

    const id = setTimeout(() => {
      setRetryAfter(s => (s !== null && s > 1 ? s - 1 : null))
    }, 1_000)

    return () => {
      clearTimeout(id)
    }
  }, [retryAfter])

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const trimmed     = question.trim()
  const canSubmit   = trimmed.length >= 3 && trimmed.length <= 4_000 && !isAsking && !isLimited && retryAfter === null

  // ── ⌘↵ shortcut ──────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit) {
        e.preventDefault()

        void doAsk()
      }
    }

    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSubmit, question, maxTokens, oneSentence])

  // ── API helpers ───────────────────────────────────────────────────────────

  const doAsk = useCallback(async () => {
    if (!canSubmit) return

    // Client-side guard (belt + suspenders with the hook)
    if (isLimited) {
      setError(`Too many requests — wait ${cooldownSeconds}s before trying again.`)

      return
    }

    recordRequest()

    setIsAsking(true)

    setError(null)

    setRetryAfter(null)

    setCopied(false)

    const t0 = Date.now()

    try {
      const q = oneSentence ? `${trimmed} Answer in one sentence.` : trimmed

      const res = await fetch(`${apiBaseUrl}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, max_tokens: maxTokens, one_sentence: false })
      })

      if (res.status === 429) {
        const secs = parseRetryAfter(res)

        setRetryAfter(secs)

        setError(`Rate limit reached. Please wait ${secs}s before trying again.`)

        return
      }

      if (!res.ok) throw new Error(await readErrorMessage(res))

      setAnswer((await res.json()) as AskResponse)

      setAnswerKey(k => k + 1)

      setResponseTime(Date.now() - t0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claude could not answer right now.')
    } finally {
      setIsAsking(false)
    }
  }, [apiBaseUrl, canSubmit, cooldownSeconds, isLimited, maxTokens, oneSentence, recordRequest, trimmed])

  async function askClaude(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault()

    await doAsk()
  }

  async function runDemo() {
    if (isLimited || retryAfter !== null) {
      setError('Rate limit reached — wait a moment before running the demo.')

      return
    }

    recordRequest()

    setIsAsking(true)

    setError(null)

    setRetryAfter(null)

    setCopied(false)

    const t0 = Date.now()

    try {
      const res = await fetch(`${apiBaseUrl}/api/ask/demo`)

      if (res.status === 429) {
        const secs = parseRetryAfter(res)

        setRetryAfter(secs)

        setError(`Rate limit reached. Please wait ${secs}s before trying again.`)

        return
      }

      if (!res.ok) throw new Error(await readErrorMessage(res))

      const data = (await res.json()) as AskResponse

      setAnswer(data)

      setQuestion(data.question)

      setAnswerKey(k => k + 1)

      setResponseTime(Date.now() - t0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The demo request failed.')
    } finally {
      setIsAsking(false)
    }
  }

  async function checkHealth() {
    setIsChecking(true)

    setError(null)

    try {
      const res = await fetch(`${apiBaseUrl}/api/health`)

      if (!res.ok) throw new Error(await readErrorMessage(res))

      setHealth((await res.json()) as HealthResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed.')
    } finally {
      setIsChecking(false)
    }
  }

  async function copyAnswer() {
    if (!answer?.answer) return

    await navigator.clipboard.writeText(answer.answer)

    setCopied(true)

    window.setTimeout(() => {
      setCopied(false)
    }, 1600)
  }

  function reset() {
    setQuestion(STARTER_QUESTION)

    setMaxTokens(700)

    setOneSentence(false)

    setAnswer(null)

    setError(null)

    setResponseTime(null)

    setRetryAfter(null)

    textareaRef.current?.focus()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="
      bg-background relative flex min-h-screen flex-col overflow-hidden
    "
    >

      {/* ── Animated ambient blobs ──────────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="
          blob-1 absolute -top-48 -left-48 size-[700px] rounded-full
          bg-orange-800/10 blur-[130px]
        "
        />
        <div className="
          blob-2 absolute -right-48 -bottom-64 size-[800px] rounded-full
          bg-stone-300/6 blur-[150px]
        "
        />
        <div className="
          blob-3 absolute top-1/3 left-1/2 size-[500px] -translate-x-1/2
          rounded-full bg-amber-900/8 blur-[110px]
        "
        />
      </div>

      <main className="
        relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4
        py-10
        sm:px-6
        lg:px-10
      "
      >

        {/* ── HEADER ──────────────────────────────────────────────────────────── */}
        <header className="
          animate-slide-up-fade flex flex-col gap-7 rounded-2xl border
          border-white/8 bg-white/2.5 p-8 shadow-2xl backdrop-blur-md delay-0
          sm:flex-row sm:items-start sm:justify-between
        "
        >
          <div className="space-y-5">
            {/* Logo + badges */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Brand logo */}
              <a
                href="https://santi020k.com"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  group flex items-center gap-2.5 rounded-xl border
                  border-white/8 bg-white/4 px-3 py-1.5 transition-all
                  duration-200
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
                  text-foreground/70
                  group-hover:text-foreground/90
                  text-xs font-medium
                "
                >
                  Claude Certification
                </span>
              </a>
              <Badge
                variant="outline"
                className="text-muted-foreground border-white/10 px-3 py-1"
              >
                FastAPI + Next.js
              </Badge>
              <Badge
                variant="outline"
                className="text-muted-foreground border-white/10 px-3 py-1"
              >
                Anthropic SDK
              </Badge>
            </div>

            {/* Gradient headline */}
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
              <p className="text-muted-foreground max-w-lg text-base/7">
                Test the backend contract, tune response length, and verify the deployed API —
                all from one focused interface.
              </p>
            </div>

            {/* Quick-prompt chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {EXAMPLE_PROMPTS.slice(0, 2).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setQuestion(p)

                    textareaRef.current?.focus()
                  }}
                  className="
                    group text-muted-foreground flex items-center gap-1.5
                    rounded-full border border-white/8 bg-white/4 px-4 py-1.5
                    text-xs transition-all duration-200
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
                  {p.length > 40 ? p.slice(0, 40) + '…' : p}
                </button>
              ))}
            </div>
          </div>

          {/* Health */}
          <div className="
            flex shrink-0 flex-col items-start gap-3
            sm:items-end
          "
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={checkHealth}
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
                  animate-scale-in text-muted-foreground flex items-center gap-2
                  rounded-lg border border-white/8 bg-white/3 px-3 py-2 text-xs
                "
                >
                  <StatusDot ok={health.status === 'ok'} />
                  <span>{health.environment}</span>
                  <span className="text-white/15">·</span>
                  <span className="font-mono">{formatModel(health.model)}</span>
                </div>
              ) :
              null}

            <p className="max-w-[180px] text-xs break-all text-white/15">{apiBaseUrl}</p>
          </div>
        </header>

        {/* ── ERROR ───────────────────────────────────────────────────────────── */}
        {error ?
          (
            <Alert
              variant="destructive"
              className="animate-slide-up-fade border-rose-500/25 bg-rose-500/8"
            >
              <AlertCircle className="size-4" />
              <AlertTitle>Request failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) :
          null}

        {/* ── MAIN GRID ───────────────────────────────────────────────────────── */}
        <section className="
          grid flex-1 gap-6
          lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]
        "
        >

          {/* ── PROMPT CARD ─────────────────────────────────────────────────── */}
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

            <form onSubmit={askClaude}>
              <CardContent className="space-y-6 p-7">

                {/* Textarea */}
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
                      onChange={e => {
                        setQuestion(e.target.value)
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

                {/* Example prompts */}
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
                    {EXAMPLE_PROMPTS.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setQuestion(p)

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
                        <span className="leading-5">{p}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Controls row */}
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
                      onChange={e => {
                        setMaxTokens(Number(e.target.value))
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
                      <Switch id="one-sentence" checked={oneSentence} onCheckedChange={setOneSentence} />
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
                      onClick={runDemo}
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
                      onClick={reset}
                      title="Reset"
                      className="
                        shrink-0 transition-all
                        hover:bg-white/6
                      "
                      style={{ transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1), background 0.2s' }}
                      onMouseEnter={e => {
                        (e.currentTarget).style.transform = 'rotate(180deg)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget).style.transform = 'rotate(0deg)'
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
                    {/* Rate-limit status */}
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

          {/* ── RIGHT COLUMN ────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* RESPONSE CARD */}
            <Card className="
              animate-slide-up-fade card-hover flex min-h-120 flex-col
              rounded-2xl border-white/8 bg-white/2.5 shadow-2xl
              backdrop-blur-md delay-225
            "
            >
              <CardHeader className="border-b border-white/6 px-7 pt-7 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="
                      text-muted-foreground/70 text-sm font-semibold
                      tracking-wider uppercase
                    "
                    >
                      Response
                    </CardTitle>
                    <CardDescription className="
                      text-muted-foreground mt-1 text-sm
                    "
                    >
                      Claude output appears here.
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {answer && responseTime ?
                      (
                        <Badge
                          variant="outline"
                          className="
                            animate-scale-in text-muted-foreground/60
                            border-white/10 font-mono text-[11px]
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
                      onClick={copyAnswer}
                      disabled={!answer?.answer}
                      className="
                        gap-2 border-white/10 bg-white/3 transition-all
                        duration-200
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
                {isAsking ? (

                  /* Loading shimmer */
                  <div className="
                    flex flex-1 flex-col gap-4 rounded-xl border border-dashed
                    border-white/8 bg-white/1.5 p-7
                  "
                  >
                    <div className="
                      text-muted-foreground/60 flex items-center gap-3 text-sm
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
                ) : answer ? (

                  /* Answer — re-animates on each new answer via key */
                  <div
                    key={answerKey}
                    className="animate-answer-reveal flex flex-1 flex-col gap-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="
                        rounded-md border-orange-300/20 bg-orange-200/10 px-2.5
                        py-1 text-xs font-medium text-orange-100
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
                        text-[10px] tracking-widest text-white/20 uppercase
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
                ) : (

                  /* Empty state */
                  <div className="
                    flex flex-1 flex-col items-center justify-center gap-5
                    rounded-xl border border-dashed border-white/8 bg-white/1
                    p-10 text-center
                  "
                  >
                    <div className="
                      relative flex size-16 items-center justify-center
                      rounded-2xl border border-white/10 bg-white/4
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
                      <p className="text-foreground/60 text-sm font-medium">No answer yet</p>
                      <p className="
                        text-muted-foreground/50 max-w-[240px] text-xs/6
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
                  onClick={copyAnswer}
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

            {/* API STATUS CARD */}
            <Card className="
              animate-slide-up-fade card-hover rounded-2xl border-white/8
              bg-white/2.5 shadow-2xl backdrop-blur-md delay-300
            "
            >
              <CardHeader className="border-b border-white/6 px-7 pt-6 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="
                      text-muted-foreground/70 text-sm font-semibold
                      tracking-wider uppercase
                    "
                    >
                      API Status
                    </CardTitle>
                    <CardDescription className="
                      text-muted-foreground mt-1 text-sm
                    "
                    >
                      Backend environment info.
                    </CardDescription>
                  </div>
                  {health ? <StatusDot ok={health.status === 'ok'} /> : null}
                </div>
              </CardHeader>

              <CardContent className="px-7 pt-5 pb-7">
                {health ?
                  (
                    <dl className="
                      grid gap-3 text-sm
                      sm:grid-cols-2
                    "
                    >
                      <div className="
                        animate-scale-in rounded-xl border border-white/6
                        bg-white/2 p-4
                      "
                      >
                        <dt className="text-muted-foreground/50 mb-1 text-xs">Environment</dt>
                        <dd className="font-medium">{health.environment}</dd>
                      </div>
                      <div
                        className="
                          animate-scale-in rounded-xl border border-white/6
                          bg-white/2 p-4
                        "
                        style={{ animationDelay: '60ms' }}
                      >
                        <dt className="text-muted-foreground/50 mb-1 text-xs">API key</dt>
                        <dd className={`
                          font-medium
                          ${health.anthropic_api_key_configured ?
                      'text-emerald-400' :
                      'text-rose-400'}
                        `}
                        >
                          {health.anthropic_api_key_configured ? 'Configured ✓' : 'Missing ✗'}
                        </dd>
                      </div>
                      <div
                        className="
                          animate-scale-in rounded-xl border border-white/6
                          bg-white/2 p-4
                          sm:col-span-2
                        "
                        style={{ animationDelay: '120ms' }}
                      >
                        <dt className="text-muted-foreground/50 mb-1 text-xs">Model</dt>
                        <dd className="font-mono font-medium text-orange-300">{formatModel(health.model)}</dd>
                      </div>
                    </dl>
                  ) :
                  (
                    <div className="
                      text-muted-foreground/50 flex items-start gap-3 rounded-xl
                      border border-white/6 bg-white/2 p-5 text-xs
                    "
                    >
                      <KeyRound className="
                        mt-0.5 size-4 shrink-0 text-orange-400/30
                      "
                      />
                      <span>
                        Click
                        {' '}
                        <strong className="text-foreground/40">Check API</strong>
                        {' '}
                        in the header to
                        verify environment and model configuration.
                      </span>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
        <footer className="
          animate-slide-up-fade flex flex-wrap items-center justify-between
          gap-4 border-t border-white/6 pt-6 text-xs delay-375
        "
        >
          {/* Left — author attribution */}
          <div className="flex items-center gap-3">
            <a
              href="https://santi020k.com"
              target="_blank"
              rel="noopener noreferrer"
              className="
                group flex items-center gap-2 transition-all duration-200
              "
            >
              <Image
                src="/brand/santi020k.svg"
                alt="santi020k"
                width={18}
                height={18}
                className="
                  opacity-40 transition-opacity duration-200
                  group-hover:opacity-80
                "
              />
              <span className="
                font-medium text-white/30 transition-colors duration-200
                group-hover:text-white/70
              "
              >
                santi020k.com
              </span>
            </a>
            <span className="text-white/10">·</span>
            <a
              href="https://github.com/santi020k/claude-certification"
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex items-center gap-1.5 text-white/25 transition-colors
                duration-200
                hover:text-white/60
              "
            >
              {/* GitHub mark inline SVG */}
              <svg viewBox="0 0 16 16" className="size-3.5 fill-current" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <span>santi020k/claude-certification</span>
            </a>
          </div>

          {/* Right — docs links */}
          <div className="flex items-center gap-4">
            <a
              href="https://docs.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="
                text-white/25 transition-colors duration-200
                hover:text-white/60
              "
            >
              Anthropic docs
            </a>
            <span className="text-white/10">·</span>
            <a
              href={`${apiBaseUrl}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="
                text-white/25 transition-colors duration-200
                hover:text-white/60
              "
            >
              API docs ↗
            </a>
          </div>
        </footer>
      </main>
    </div>
  )
}
