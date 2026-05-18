'use client'

import { type SyntheticEvent, useEffect, useId, useMemo, useRef, useState } from 'react'

import Link from 'next/link'

import { ApiStatusIndicator } from '@/components/api-status/indicator'
import {
  getApiBaseUrl,
  parseRetryAfter,
  readChatResponse,
  readChatStream,
  readErrorMessage,
  readSpecialistsResponse
} from '@/components/claude-playground/api'
import { MarkdownAnswer } from '@/components/claude-playground/primitives/markdown-answer'
import { TypingDots } from '@/components/claude-playground/primitives/typing-dots'
import { AmbientBackground } from '@/components/claude-playground/sections/ambient-background'
import type { ChatMessage, ChatResponse, Specialist } from '@/components/claude-playground/types'

import {
  ArrowLeft,
  Bot,
  Coins,
  Loader2,
  MessageSquareText,
  RotateCcw,
  Send,
  Sparkles,
  Thermometer,
  UserRound,
  WandSparkles
} from 'lucide-react'

import { Button } from '@repo/ui/components/ui/button'
import { Textarea } from '@repo/ui/components/ui/textarea'

// ── Default specialists shown while the API loads ──────────────────────────────

const DEFAULT_SPECIALISTS: Specialist[] = [
  { id: 'general',           name: 'General Assistant', description: 'A helpful, balanced assistant for everyday questions.',             temperature: 0.7 },
  { id: 'customer_support',  name: 'Customer Support',  description: 'Friendly support agent — empathetic, solution-focused, and clear.', temperature: 0.3 },
  { id: 'math_tutor',        name: 'Math Tutor',         description: 'Patient tutor who guides you step-by-step.',                       temperature: 0.1 },
  { id: 'software_developer', name: 'Software Developer', description: 'Senior engineer — concise, production-quality code guidance.',      temperature: 0.2 },
  { id: 'writing_coach',     name: 'Writing Coach',      description: 'Thoughtful coach who helps you write more clearly.',                temperature: 0.6 },
  { id: 'comedian',          name: 'Comedian',            description: 'Witty, punny, and delightfully chaotic — brings the laughs.',      temperature: 1.0 },
  { id: 'storyteller',       name: 'Storyteller',         description: 'Imaginative author who crafts vivid fiction and immersive worlds.', temperature: 0.9 }
]

const DEFAULT_SPECIALIST_ID = 'general'
const DEFAULT_TEMPERATURE = 0.7
const MAX_DRAFT_LENGTH = 4_000

const STARTER_PROMPTS = [
  'Give me a 5-minute learning plan for FastAPI.',
  'Review this API design and suggest improvements.',
  'Explain streaming responses like I am new to backend work.'
]

// ── Temperature label helper ───────────────────────────────────────────────────

interface TempLevel {
  label: string
  hint: string
  colour: string
}

function tempLevel(t: number): TempLevel {
  if (t <= 0.15) return { label: 'Stick to the facts',  hint: 'Short, precise answers — no surprises.',           colour: 'text-blue-300/80'   }

  if (t <= 0.35) return { label: 'Clear & focused',     hint: 'Consistent and direct — great for serious topics.', colour: 'text-teal-300/80'   }

  if (t <= 0.55) return { label: 'Balanced',            hint: 'A mix of accuracy and a touch of personality.',     colour: 'text-green-300/80'  }

  if (t <= 0.75) return { label: 'More expressive',     hint: 'Varied phrasing, richer language, more ideas.',     colour: 'text-orange-300/80' }

  if (t <= 0.9)  return { label: 'Imaginative',         hint: 'Unexpected angles — ideal for creative tasks.',     colour: 'text-purple-300/80' }

  return           { label: 'Surprise me! 🎲',         hint: 'Anything can happen — embrace the chaos.',          colour: 'text-rose-300/80'   }
}

// ── Session persistence ────────────────────────────────────────────────────────

function buildStarterMessages(specialistName: string): ChatMessage[] {
  return [
    {
      role: 'assistant',
      content: `Hi! I'm your ${specialistName}. Ask me something, then follow up to see the backend keep the conversation context.`
    }
  ]
}

const chatSessionKey = 'certification.chat.session'

interface ChatSession {
  conversationId: string | null
  lastResponse: ChatResponse | null
  maxTokens: number
  messages: ChatMessage[]
  specialistId: string
  streamEnabled: boolean
  temperature: number
}

function getDefaultChatSession(
  specialistId = DEFAULT_SPECIALIST_ID,
  specialistName = 'General Assistant',
  temperature = DEFAULT_TEMPERATURE
): ChatSession {
  return {
    conversationId: null,
    lastResponse: null,
    maxTokens: 1000,
    messages: buildStarterMessages(specialistName),
    specialistId,
    streamEnabled: false,
    temperature
  }
}

function readChatSession(): ChatSession {
  if (typeof window === 'undefined') return getDefaultChatSession()

  try {
    const raw = window.sessionStorage.getItem(chatSessionKey)

    if (!raw) return getDefaultChatSession()

    const parsed = JSON.parse(raw) as Partial<ChatSession>

    return {
      conversationId: typeof parsed.conversationId === 'string' ? parsed.conversationId : null,
      lastResponse: parsed.lastResponse ?? null,
      maxTokens: typeof parsed.maxTokens === 'number' ? parsed.maxTokens : 1000,
      messages: Array.isArray(parsed.messages) && parsed.messages.length > 0 ?
        parsed.messages :
        buildStarterMessages('General Assistant'),
      specialistId: typeof parsed.specialistId === 'string' ? parsed.specialistId : DEFAULT_SPECIALIST_ID,
      streamEnabled: typeof parsed.streamEnabled === 'boolean' ? parsed.streamEnabled : false,
      temperature: typeof parsed.temperature === 'number' ? parsed.temperature : DEFAULT_TEMPERATURE
    }
  } catch {
    return getDefaultChatSession()
  }
}

function isOnlyStarterMessage(messages: ChatMessage[]): boolean {
  return messages.length === 1 && messages[0]?.role === 'assistant'
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ChatPage() {
  const messageInputId      = useId()
  const messageHelpId       = useId()
  const tokenInputId        = useId()
  const specialistSelectId  = useId()
  const temperatureInputId  = useId()
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), [])
  // Specialist state
  const [specialists,   setSpecialists]  = useState<Specialist[]>(DEFAULT_SPECIALISTS)
  const [specialistId,  setSpecialistId] = useState<string>(DEFAULT_SPECIALIST_ID)
  const [temperature,   setTemperature]  = useState<number>(DEFAULT_TEMPERATURE)
  // Conversation state
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages,       setMessages]       = useState<ChatMessage[]>(buildStarterMessages('General Assistant'))
  const [draft,          setDraft]          = useState('')
  const [maxTokens,      setMaxTokens]      = useState(1000)
  const [lastResponse,   setLastResponse]   = useState<ChatResponse | null>(null)
  const [error,          setError]          = useState<string | null>(null)
  const [isSending,      setIsSending]      = useState(false)
  const [isSessionReady, setIsSessionReady] = useState(false)
  const [streamEnabled,  setStreamEnabled]  = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const trimmed = draft.trim()
  const canSend = trimmed.length > 0 && trimmed.length <= MAX_DRAFT_LENGTH && !isSending
  const draftUsage = Math.min(100, Math.round((draft.length / MAX_DRAFT_LENGTH) * 100))
  const hasOnlyStarter = isOnlyStarterMessage(messages)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  // Restore session on mount
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      const session = readChatSession()

      setConversationId(session.conversationId)

      setMessages(session.messages)

      setMaxTokens(session.maxTokens)

      setLastResponse(session.lastResponse)

      setSpecialistId(session.specialistId)

      setStreamEnabled(session.streamEnabled)

      setTemperature(session.temperature)

      setIsSessionReady(true)
    })

    return () => {
      window.cancelAnimationFrame(raf)
    }
  }, [])

  // Fetch specialists from API (replaces defaults once loaded)
  useEffect(() => {
    const controller = new AbortController()

    fetch(`${apiBaseUrl}/api/specialists`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load specialists')

        return readSpecialistsResponse(res)
      })
      .then(data => {
        setSpecialists(data.specialists)
      })
      .catch(() => { /* keep defaults on failure */ })

    return () => {
      controller.abort()
    }
  }, [apiBaseUrl])

  // Persist session on state change
  useEffect(() => {
    if (!isSessionReady) return

    try {
      if (!conversationId && !lastResponse && isOnlyStarterMessage(messages)) {
        window.sessionStorage.removeItem(chatSessionKey)

        return
      }

      window.sessionStorage.setItem(chatSessionKey, JSON.stringify({
        conversationId, lastResponse, maxTokens, messages, specialistId, streamEnabled, temperature
      }))
    } catch { /* session storage may be unavailable */ }
  }, [
    conversationId,
    isSessionReady,
    lastResponse,
    maxTokens,
    messages,
    specialistId,
    streamEnabled,
    temperature
  ])

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function sendMessage(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSend) return

    const optimisticMessage: ChatMessage = { role: 'user', content: trimmed }

    setMessages(current => [...current, optimisticMessage])

    setDraft('')

    setError(null)

    setIsSending(true)

    try {
      if (streamEnabled) {
        await sendStreamingMessage(optimisticMessage)

        return
      }

      const res = await fetch(`${apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: trimmed,
          max_tokens: maxTokens,
          specialist: specialistId,
          temperature
        })
      })

      if (res.status === 429) {
        const secs = parseRetryAfter(res)

        throw new Error(`Rate limit reached. Please wait ${secs}s before trying again.`)
      }

      if (!res.ok) throw new Error(await readErrorMessage(res))

      const data = await readChatResponse(res)

      setConversationId(data.conversation_id)

      setMessages(data.messages)

      setLastResponse(data)
    } catch (err) {
      setMessages(current => current.filter(m => m !== optimisticMessage))

      setError(err instanceof Error ? err.message : 'Claude could not answer right now.')
    } finally {
      setIsSending(false)

      textareaRef.current?.focus()
    }
  }

  async function sendStreamingMessage(optimisticMessage: ChatMessage) {
    const assistantMessage: ChatMessage = { role: 'assistant', content: '' }

    setMessages(current => [...current, assistantMessage])

    try {
      const res = await fetch(`${apiBaseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: optimisticMessage.content,
          max_tokens: maxTokens,
          specialist: specialistId,
          temperature
        })
      })

      if (res.status === 429) {
        const secs = parseRetryAfter(res)

        throw new Error(`Rate limit reached. Please wait ${secs}s before trying again.`)
      }

      if (!res.ok) throw new Error(await readErrorMessage(res))

      let finalResponse: ChatResponse | null = null

      for await (const streamEvent of readChatStream(res)) {
        if (streamEvent.type === 'text') {
          setMessages(current => current.map(message => (
            message === assistantMessage ?
              { ...message, content: `${message.content}${streamEvent.text}` } :
              message
          )))

          continue
        }

        if (streamEvent.type === 'error') {
          throw new Error(streamEvent.detail)
        }

        finalResponse = streamEvent

        setConversationId(streamEvent.conversation_id)

        setMessages(streamEvent.messages)

        setLastResponse(streamEvent)
      }

      if (!finalResponse) {
        throw new Error('Claude ended the stream before sending a final response.')
      }
    } catch (err) {
      setMessages(current => current.filter(message => message !== assistantMessage))

      throw err
    }
  }

  function resetChat(nextSpecialistId?: string, nextTemperature?: number) {
    try {
      window.sessionStorage.removeItem(chatSessionKey)
    } catch { /* ok */ }

    const id    = nextSpecialistId ?? specialistId
    const found = specialists.find(s => s.id === id)
    const name  = found?.name ?? 'General Assistant'

    setConversationId(null)

    setMessages(buildStarterMessages(name))

    setDraft('')

    setLastResponse(null)

    setError(null)

    if (nextTemperature !== undefined) setTemperature(nextTemperature)

    textareaRef.current?.focus()
  }

  function handleSpecialistChange(nextId: string) {
    setSpecialistId(nextId)

    const found = specialists.find(s => s.id === nextId)
    const preset = found?.temperature ?? DEFAULT_TEMPERATURE

    resetChat(nextId, preset)
  }

  function applyStarterPrompt(prompt: string) {
    setDraft(prompt)

    textareaRef.current?.focus()
  }

  const currentSpecialist = specialists.find(s => s.id === specialistId)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <AmbientBackground />

      <section className="
        relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4
        py-6
        sm:px-6
        lg:px-10 lg:py-8
      "
      >
        <header className="animate-fade-in flex flex-col gap-5">
          {/* Nav */}
          <nav className="flex items-center justify-between">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="
                -ml-3 text-muted-foreground
                hover:text-foreground
              "
            >
              <Link href="/">
                <ArrowLeft className="size-4" />
                Home
              </Link>
            </Button>

            <div className="
              flex items-center gap-2
              sm:gap-3
            "
            >
              <ApiStatusIndicator />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="
                  border-white/15 bg-white/4 transition-transform
                  hover:-translate-y-0.5 hover:border-orange-200/30
                "
                onClick={() => {
                  resetChat()
                }}
              >
                <RotateCcw className="size-3.5" />
                New chat
              </Button>
            </div>
          </nav>

          {/* Title + controls row */}
          <div className="
            flex flex-col gap-5
            lg:flex-row lg:items-start lg:justify-between
          "
          >
            <div className="max-w-2xl">
              <div className="
                mb-3 inline-flex items-center gap-2 rounded-full border
                border-orange-200/15 bg-orange-300/8 px-3 py-1 text-xs
                font-medium text-orange-100/80
              "
              >
                <Sparkles className="size-3.5" />
                Persistent specialist chat
              </div>
              <h1 className="
                text-3xl/tight font-semibold text-foreground
                sm:text-4xl
              "
              >
                Chat with Claude
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm/6 text-muted-foreground">
                Powered by
                {' '}
                <span className="font-mono text-orange-200/80">POST /api/chat</span>
                {' '}
                — context lives in the backend, and this tab remembers the thread until New chat.
              </p>
            </div>

            {/* ── Specialist + Temperature controls ─────────────────────────── */}
            <div className="
              animate-slide-up-fade grid gap-3 rounded-xl border border-white/10
              bg-black/20 p-3 shadow-2xl shadow-black/10 backdrop-blur-sm
              sm:grid-cols-2
              lg:w-[470px]
            "
            >

              {/* Specialist selector */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={specialistSelectId}
                  className="text-xs font-medium text-muted-foreground"
                >
                  Specialist
                </label>
                <select
                  id={specialistSelectId}
                  value={specialistId}
                  className="
                    h-9 w-full cursor-pointer rounded-md border border-white/15
                    bg-black/25 px-3 text-sm text-foreground transition-colors
                    outline-none
                    hover:border-orange-200/30
                    focus:border-orange-300/40 focus:ring-1
                    focus:ring-orange-300/20
                  "
                  onChange={e => {
                    handleSpecialistChange(e.target.value)
                  }}
                >
                  {specialists.map(s => (
                    <option key={s.id} value={s.id} className="bg-zinc-900">
                      {s.name}
                    </option>
                  ))}
                </select>
                {currentSpecialist ?
                  (
                    <p className="text-xs text-muted-foreground/60">
                      {currentSpecialist.description}
                    </p>
                  ) :
                  null}
              </div>

              {/* Response style slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor={temperatureInputId}
                    className="
                      flex items-center gap-1.5 text-xs font-medium
                      text-muted-foreground
                    "
                  >
                    <Thermometer className="size-3" />
                    Response style
                  </label>
                  <span className={`
                    text-xs font-semibold
                    ${tempLevel(temperature).colour}
                  `}
                  >
                    {tempLevel(temperature).label}
                  </span>
                </div>
                <input
                  id={temperatureInputId}
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  className="
                    h-1.5 w-full cursor-pointer appearance-none rounded-full
                    bg-white/10 accent-orange-400 transition-opacity
                    hover:opacity-90
                  "
                  onChange={e => {
                    setTemperature(Number(e.target.value))
                  }}
                />
                <div className="
                  flex justify-between text-[10px] text-muted-foreground/40
                "
                >
                  <span>Factual</span>
                  <span>Creative</span>
                </div>
                <p className="text-[11px] text-muted-foreground/50 italic">
                  {tempLevel(temperature).hint}
                </p>
              </div>

            </div>
          </div>
        </header>

        {error ?
          (
            <div
              className="
                animate-slide-up-fade rounded-lg border border-rose-500/25
                bg-rose-500/8 px-4 py-3 text-sm text-rose-200
              "
              role="alert"
            >
              {error}
            </div>
          ) :
          null}

        <div className="
          animate-scale-in flex min-h-[62vh] flex-1 flex-col overflow-hidden
          rounded-xl border border-white/10 bg-white/[0.035] shadow-2xl
          shadow-black/20 backdrop-blur-md
        "
        >
          <div className="
            flex flex-wrap items-center justify-between gap-3 border-b
            border-white/10 bg-black/15 px-4 py-3
          "
          >
            <div className="flex items-center gap-3">
              <div className="
                grid size-9 place-items-center rounded-lg border
                border-orange-200/15 bg-orange-300/10 text-orange-100
              "
              >
                <MessageSquareText className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {currentSpecialist?.name ?? 'Claude'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {messages.length}
                  {' '}
                  {messages.length === 1 ? 'message' : 'messages'}
                  {' '}
                  in this thread
                </p>
              </div>
            </div>

            {lastResponse ?
              (
                <p className="
                  inline-flex items-center gap-1.5 rounded-full border
                  border-white/10 bg-black/20 px-3 py-1 text-xs
                  text-muted-foreground/80
                "
                >
                  <Coins className="size-3" />
                  {lastResponse.input_tokens}
                  {' '}
                  in /
                  {lastResponse.output_tokens}
                  {' '}
                  out
                </p>
              ) :
              null}
          </div>

          {/* Message log */}
          <div
            className="
              flex-1 scrollbar-gutter-stable space-y-5 overflow-y-auto
              mask-[linear-gradient(to_bottom,transparent,black_18px,black_calc(100%-18px),transparent)]
              px-4 py-5
            "
            role="log"
            aria-live="polite"
            aria-label="Chat conversation"
          >
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}-${message.content.slice(0, 16)}`}
                className={`
                  flex gap-3
                  ${message.role === 'user' ?
                'justify-end' :
                'justify-start'}
                `}
                style={{
                  animation: 'message-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
                  animationDelay: `${Math.min(index * 35, 240)}ms`
                }}
              >
                {message.role === 'assistant' ?
                  (
                    <div className="
                      mt-1 grid size-8 shrink-0 place-items-center rounded-full
                      border border-white/10 bg-black/25 text-orange-100
                    "
                    >
                      <Bot className="size-4" />
                    </div>
                  ) :
                  null}

                <article
                  className={`
                    group relative max-w-[92%] rounded-2xl border px-4 py-3
                    transition-all duration-300
                    hover:-translate-y-0.5 hover:shadow-xl
                    sm:max-w-[78%]
                    ${message.role === 'user' ?
                `
                  border-orange-200/20 bg-orange-300/12 text-orange-50
                  shadow-orange-950/10
                ` :
                'border-white/10 bg-black/20 text-foreground shadow-black/10'}
                  `}
                  aria-label={`From ${message.role === 'user' ? 'you' : currentSpecialist?.name ?? 'Claude'}`}
                >
                  <div className="
                    mb-2 flex items-center justify-between gap-3 text-xs
                    font-medium text-muted-foreground uppercase
                  "
                  >
                    <span>{message.role === 'user' ? 'You' : (currentSpecialist?.name ?? 'Claude')}</span>
                    <span className="
                      h-px flex-1 bg-white/8 opacity-0 transition-opacity
                      group-hover:opacity-100
                    "
                    />
                  </div>
                  {message.role === 'assistant' ?
                    <MarkdownAnswer content={message.content} /> :
                    <p className="text-sm/6 whitespace-pre-wrap">{message.content}</p>}
                </article>

                {message.role === 'user' ?
                  (
                    <div className="
                      mt-1 grid size-8 shrink-0 place-items-center rounded-full
                      border border-orange-200/15 bg-orange-300/10
                      text-orange-100
                    "
                    >
                      <UserRound className="size-4" />
                    </div>
                  ) :
                  null}
              </div>
            ))}

            {isSending && !streamEnabled ?
              (
                <div
                  className="
                    inline-flex items-center gap-3 rounded-2xl border
                    border-white/10 bg-black/20 px-4 py-3 text-sm
                    text-muted-foreground shadow-xl shadow-black/10
                  "
                  role="status"
                  style={{
                    animation: `
                      message-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both,
                      thinking-pulse 1.7s ease-in-out infinite 0.35s
                    `
                  }}
                >
                  <Loader2 className="size-4 animate-spin text-orange-200/80" />
                  <span>
                    {currentSpecialist?.name ?? 'Claude'}
                    {' '}
                    is thinking
                  </span>
                  <TypingDots />
                </div>
              ) :
              null}

            {hasOnlyStarter ?
              (
                <div className="
                  animate-slide-up-fade grid gap-2 pt-1
                  sm:grid-cols-3
                "
                >
                  {STARTER_PROMPTS.map(prompt => (
                    <button
                      key={prompt}
                      type="button"
                      className="
                        min-h-16 rounded-lg border border-white/10 bg-black/12
                        px-3 py-2 text-left text-xs/5 text-muted-foreground
                        transition-all
                        hover:-translate-y-0.5 hover:border-orange-200/25
                        hover:bg-orange-300/8 hover:text-foreground
                        focus-visible:ring-2 focus-visible:ring-orange-300/40
                        focus-visible:outline-none
                      "
                      onClick={() => {
                        applyStarterPrompt(prompt)
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              ) :
              null}

            <div ref={bottomRef} />
          </div>

          {/* Input form */}
          <form
            onSubmit={sendMessage}
            className="grid gap-3 border-t border-white/10 bg-black/12 p-4"
          >
            <label htmlFor={messageInputId} className="sr-only">Message</label>
            <p id={messageHelpId} className="sr-only">
              Press Enter to send. Press Shift and Enter to add a line break.
            </p>
            <Textarea
              id={messageInputId}
              ref={textareaRef}
              value={draft}
              maxLength={MAX_DRAFT_LENGTH}
              placeholder={`Ask ${currentSpecialist?.name ?? 'Claude'} something…`}
              aria-describedby={messageHelpId}
              className="
                max-h-52 min-h-24 resize-none rounded-xl border-white/15
                bg-black/18 p-4 pr-12 text-sm/6 transition-all
                placeholder:text-muted-foreground/55
                focus-visible:border-orange-200/40 focus-visible:bg-black/25
                focus-visible:ring-orange-300/25
              "
              onChange={e => {
                setDraft(e.target.value)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()

                  e.currentTarget.form?.requestSubmit()
                }
              }}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <label
                  className="
                    flex items-center gap-2 text-xs text-muted-foreground
                    focus-within:text-foreground
                  "
                  htmlFor={tokenInputId}
                >
                  Max tokens
                  <input
                    id={tokenInputId}
                    type="number"
                    min={50}
                    max={4000}
                    value={maxTokens}
                    className="
                      h-8 w-24 rounded-md border border-white/10 bg-black/20
                      px-2 text-sm text-foreground transition-colors
                      hover:border-white/20
                      focus:border-orange-200/35 focus:outline-none
                    "
                    onChange={e => {
                      setMaxTokens(Number(e.target.value))
                    }}
                  />
                </label>

                <div className="
                  flex min-w-36 items-center gap-2 text-xs
                  text-muted-foreground/60
                "
                >
                  <div className="
                    h-1.5 w-16 overflow-hidden rounded-full bg-white/10
                  "
                  >
                    <div
                      className="
                        h-full rounded-full bg-orange-300/70 transition-all
                        duration-300
                      "
                      style={{ width: `${draftUsage}%` }}
                    />
                  </div>
                  <span>
                    {draft.length}
                    /
                    {MAX_DRAFT_LENGTH}
                  </span>
                </div>

                <label className="
                  flex cursor-pointer items-center gap-2 rounded-md border
                  border-white/10 bg-black/15 px-2.5 py-1.5 text-xs
                  text-muted-foreground transition-colors
                  hover:border-orange-200/25 hover:text-foreground
                "
                >
                  <input
                    type="checkbox"
                    checked={streamEnabled}
                    disabled={isSending}
                    className="size-3.5 accent-orange-400"
                    onChange={event => {
                      setStreamEnabled(event.target.checked)
                    }}
                  />
                  Stream message
                </label>
              </div>

              <div className="flex items-center gap-3">
                <p className="
                  hidden items-center gap-1.5 text-xs text-muted-foreground/50
                  sm:flex
                "
                >
                  <WandSparkles className="size-3" />
                  Enter sends, Shift+Enter breaks
                </p>
                <Button
                  type="submit"
                  disabled={!canSend}
                  className="
                    min-w-24 bg-orange-500 text-white shadow-lg
                    shadow-orange-950/25 transition-all
                    hover:-translate-y-0.5 hover:bg-orange-400
                    disabled:translate-y-0 disabled:shadow-none
                  "
                >
                  {isSending ?
                    <Loader2 className="size-4 animate-spin" /> :
                    <Send className="size-4" />}
                  Send
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
