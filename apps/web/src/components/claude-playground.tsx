'use client'

import {
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import { AlertCircle } from 'lucide-react'

import {
  getApiBaseUrl,
  parseRetryAfter,
  readAskResponse,
  readErrorMessage,
  readHealthResponse
} from './claude-playground/api'
import {
  CLIENT_RATE_LIMIT,
  CLIENT_WINDOW_MS,
  STARTER_QUESTION
} from './claude-playground/constants'
import { useClientRateLimit } from './claude-playground/hooks/use-client-rate-limit'
import { AmbientBackground } from './claude-playground/sections/ambient-background'
import { ApiStatusCard } from './claude-playground/sections/api-status-card'
import { PlaygroundFooter } from './claude-playground/sections/playground-footer'
import { PlaygroundHeader } from './claude-playground/sections/playground-header'
import { PromptCard } from './claude-playground/sections/prompt-card'
import { ResponseCard } from './claude-playground/sections/response-card'
import type { AskResponse, HealthResponse } from './claude-playground/types'

import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@repo/ui/components/ui/alert'

export function ClaudePlayground() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), [])
  const [question, setQuestion] = useState(STARTER_QUESTION)
  const [maxTokens, setMaxTokens] = useState(700)
  const [oneSentence, setOneSentence] = useState(false)
  const [answer, setAnswer] = useState<AskResponse | null>(null)
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAsking, setIsAsking] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [answerKey, setAnswerKey] = useState(0)
  const [retryAfter, setRetryAfter] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { isLimited, remaining, cooldownSeconds, recordRequest } =
    useClientRateLimit(CLIENT_RATE_LIMIT, CLIENT_WINDOW_MS)

  const trimmed = question.trim()

  const canSubmit =
    trimmed.length >= 3 &&
    trimmed.length <= 4_000 &&
    !isAsking &&
    !isLimited &&
    retryAfter === null

  useEffect(() => {
    if (retryAfter === null) return

    const id = setTimeout(() => {
      setRetryAfter(seconds => seconds !== null && seconds > 1 ? seconds - 1 : null)
    }, 1_000)

    return () => {
      clearTimeout(id)
    }
  }, [retryAfter])

  const doAsk = useCallback(async () => {
    if (!canSubmit) return

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
        body: JSON.stringify({
          question: q,
          max_tokens: maxTokens,
          one_sentence: false
        })
      })

      if (res.status === 429) {
        const secs = parseRetryAfter(res)

        setRetryAfter(secs)

        setError(
          `Rate limit reached. Please wait ${secs}s before trying again.`
        )

        return
      }

      if (!res.ok) throw new Error(await readErrorMessage(res))

      setAnswer(await readAskResponse(res))

      setAnswerKey(key => key + 1)

      setResponseTime(Date.now() - t0)
    } catch (err) {
      setError(
        err instanceof Error ?
          err.message :
          'Claude could not answer right now.'
      )
    } finally {
      setIsAsking(false)
    }
  }, [apiBaseUrl, canSubmit, maxTokens, oneSentence, recordRequest, trimmed])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === 'Enter' &&
        canSubmit
      ) {
        event.preventDefault()

        void doAsk()
      }
    }

    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [canSubmit, doAsk])

  async function askClaude(event?: SyntheticEvent<HTMLFormElement>) {
    event?.preventDefault()

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

        setError(
          `Rate limit reached. Please wait ${secs}s before trying again.`
        )

        return
      }

      if (!res.ok) throw new Error(await readErrorMessage(res))

      const data = await readAskResponse(res)

      setAnswer(data)

      setQuestion(data.question)

      setAnswerKey(key => key + 1)

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

      setHealth(await readHealthResponse(res))
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

  function selectPrompt(prompt: string) {
    setQuestion(prompt)

    textareaRef.current?.focus()
  }

  return (
    <div
      className="relative flex min-h-screen flex-col bg-background"
    >
      <AmbientBackground />

      <main
        className="
          relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4
          py-10
          sm:px-6
          lg:px-10
        "
      >
        <PlaygroundHeader
          health={health}
          isChecking={isChecking}
          onCheckHealth={checkHealth}
          onSelectPrompt={selectPrompt}
        />

        {error ?
          (
            <Alert
              variant="destructive"
              role="alert"
              className="animate-slide-up-fade border-rose-500/25 bg-rose-500/8"
            >
              <AlertCircle className="size-4" />
              <AlertTitle>Request failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) :
          null}

        <section
          className="
            grid flex-1 gap-6
            lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]
          "
        >
          <PromptCard
            canSubmit={canSubmit}
            cooldownSeconds={cooldownSeconds}
            isAsking={isAsking}
            isLimited={isLimited}
            maxTokens={maxTokens}
            oneSentence={oneSentence}
            question={question}
            remaining={remaining}
            retryAfter={retryAfter}
            textareaRef={textareaRef}
            onAsk={askClaude}
            onDemo={runDemo}
            onMaxTokensChange={setMaxTokens}
            onOneSentenceChange={setOneSentence}
            onQuestionChange={setQuestion}
            onReset={reset}
          />

          <div className="flex flex-col gap-6">
            <ResponseCard
              answer={answer}
              answerKey={answerKey}
              copied={copied}
              isAsking={isAsking}
              maxTokens={maxTokens}
              responseTime={responseTime}
              onCopyAnswer={copyAnswer}
            />
            <ApiStatusCard health={health} />
          </div>
        </section>

        <PlaygroundFooter apiBaseUrl={apiBaseUrl} />
      </main>
    </div>
  )
}
