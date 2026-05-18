'use client'

import { type SyntheticEvent, useEffect, useId, useMemo, useRef, useState } from 'react'

import Link from 'next/link'

import { ApiStatusIndicator } from '@/components/api-status/indicator'
import {
  getApiBaseUrl,
  parseRetryAfter,
  readChatResponse,
  readErrorMessage,
  readSpecialistsResponse
} from '@/components/claude-playground/api'
import { MarkdownAnswer } from '@/components/claude-playground/primitives/markdown-answer'
import { AmbientBackground } from '@/components/claude-playground/sections/ambient-background'
import type { ChatMessage, ChatResponse, Specialist } from '@/components/claude-playground/types'

import { ArrowLeft, Coins, Loader2, RotateCcw, Send, Thermometer } from 'lucide-react'

import { Button } from '@repo/ui/components/ui/button'
import { Textarea } from '@repo/ui/components/ui/textarea'

// ── Default specialists shown while the API loads ──────────────────────────────

const DEFAULT_SPECIALISTS: Specialist[] = [
  { id: 'general',           name: 'General Assistant', description: 'A helpful, balanced assistant for everyday questions.',             temperature: 0.7 },
  { id: 'customer_support',  name: 'Customer Support',  description: 'Friendly support agent — empathetic, solution-focused, and clear.', temperature: 0.3 },
  { id: 'math_tutor',        name: 'Math Tutor',         description: 'Patient tutor who guides you step-by-step.',                       temperature: 0.1 },
  { id: 'software_developer',name: 'Software Developer', description: 'Senior engineer — concise, production-quality code guidance.',      temperature: 0.2 },
  { id: 'writing_coach',     name: 'Writing Coach',      description: 'Thoughtful coach who helps you write more clearly.',                temperature: 0.6 },
  { id: 'comedian',          name: 'Comedian',            description: 'Witty, punny, and delightfully chaotic — brings the laughs.',      temperature: 1.0 },
  { id: 'storyteller',       name: 'Storyteller',         description: 'Imaginative author who crafts vivid fiction and immersive worlds.', temperature: 0.9 },
]

const DEFAULT_SPECIALIST_ID = 'general'
const DEFAULT_TEMPERATURE = 0.7

// ── Temperature label helper ───────────────────────────────────────────────────

function tempLabel(t: number): string {
  if (t <= 0.15) return 'Precise'
  if (t <= 0.35) return 'Focused'
  if (t <= 0.55) return 'Balanced'
  if (t <= 0.75) return 'Creative'
  if (t <= 0.9)  return 'Imaginative'
  return 'Wild'
}

function tempColour(t: number): string {
  if (t <= 0.25) return 'text-blue-300/80'
  if (t <= 0.5)  return 'text-teal-300/80'
  if (t <= 0.75) return 'text-orange-300/80'
  return 'text-rose-300/80'
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
    temperature,
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
      messages: Array.isArray(parsed.messages) && parsed.messages.length > 0
        ? parsed.messages
        : buildStarterMessages('General Assistant'),
      specialistId: typeof parsed.specialistId === 'string' ? parsed.specialistId : DEFAULT_SPECIALIST_ID,
      temperature: typeof parsed.temperature === 'number' ? parsed.temperature : DEFAULT_TEMPERATURE,
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

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef   = useRef<HTMLDivElement>(null)

  const trimmed = draft.trim()
  const canSend = trimmed.length > 0 && trimmed.length <= 4_000 && !isSending

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
      setTemperature(session.temperature)
      setIsSessionReady(true)
    })
    return () => { window.cancelAnimationFrame(raf) }
  }, [])

  // Fetch specialists from API (replaces defaults once loaded)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${apiBaseUrl}/api/specialists`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load specialists')
        return readSpecialistsResponse(res)
      })
      .then(data => { setSpecialists(data.specialists) })
      .catch(() => { /* keep defaults on failure */ })
    return () => { controller.abort() }
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
        conversationId, lastResponse, maxTokens, messages, specialistId, temperature
      }))
    } catch { /* session storage may be unavailable */ }
  }, [conversationId, isSessionReady, lastResponse, maxTokens, messages, specialistId, temperature])

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
      const res = await fetch(`${apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: trimmed,
          max_tokens: maxTokens,
          specialist: specialistId,
          temperature,
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

  function resetChat(nextSpecialistId?: string, nextTemperature?: number) {
    try { window.sessionStorage.removeItem(chatSessionKey) } catch { /* ok */ }

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

  const currentSpecialist = specialists.find(s => s.id === specialistId)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <AmbientBackground />

      <section className="
        relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4
        py-10 sm:px-6 lg:px-10
      ">
        <header className="animate-fade-in flex flex-col gap-5">
          {/* Nav */}
          <nav className="flex items-center justify-between">
            <Button
              asChild variant="ghost" size="sm"
              className="-ml-3 text-muted-foreground hover:text-foreground"
            >
              <Link href="/">
                <ArrowLeft className="size-4" />
                Home
              </Link>
            </Button>

            <div className="flex items-center gap-3">
              <ApiStatusIndicator />
              <Button type="button" variant="outline" size="sm" onClick={() => { resetChat() }}>
                <RotateCcw className="size-3.5" />
                New chat
              </Button>
            </div>
          </nav>

          {/* Title + controls row */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl/tight font-semibold text-foreground">Chat with Claude</h1>
              <p className="mt-1.5 max-w-2xl text-sm/6 text-muted-foreground">
                Powered by{' '}
                <span className="font-mono text-orange-200/80">POST /api/chat</span>
                {' '}— context lives in the backend, and this tab remembers the thread until New chat.
              </p>
            </div>

            {/* ── Specialist + Temperature controls ─────────────────────────── */}
            <div className="flex flex-shrink-0 flex-col gap-4 sm:items-end">

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
                    h-9 min-w-[210px] rounded-md border border-white/15 bg-black/25 px-3
                    text-sm text-foreground outline-none cursor-pointer
                    hover:border-white/25 transition-colors
                    focus:border-orange-300/40 focus:ring-1 focus:ring-orange-300/20
                  "
                  onChange={e => { handleSpecialistChange(e.target.value) }}
                >
                  {specialists.map(s => (
                    <option key={s.id} value={s.id} className="bg-zinc-900">
                      {s.name}
                    </option>
                  ))}
                </select>
                {currentSpecialist ?
                  <p className="max-w-[210px] text-xs text-muted-foreground/60">
                    {currentSpecialist.description}
                  </p>
                : null}
              </div>

              {/* Temperature slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor={temperatureInputId}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                  >
                    <Thermometer className="size-3" />
                    Temperature
                  </label>
                  <span className={`text-xs font-semibold tabular-nums ${tempColour(temperature)}`}>
                    {temperature.toFixed(2)} · {tempLabel(temperature)}
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
                    h-1.5 w-[210px] cursor-pointer appearance-none rounded-full
                    bg-white/10 accent-orange-400
                  "
                  onChange={e => { setTemperature(Number(e.target.value)) }}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground/40">
                  <span>Precise</span>
                  <span>Wild</span>
                </div>
              </div>

            </div>
          </div>
        </header>

        {error ?
          <div
            className="
              animate-slide-up-fade rounded-lg border border-rose-500/25
              bg-rose-500/8 px-4 py-3 text-sm text-rose-200
            "
            role="alert"
          >
            {error}
          </div>
        : null}

        <div className="
          flex min-h-[52vh] flex-1 flex-col gap-4 overflow-hidden rounded-xl
          border border-white/10 bg-white/[0.035] p-4
        ">
          {/* Message log */}
          <div
            className="flex-1 space-y-4 overflow-y-auto pr-1"
            role="log"
            aria-live="polite"
            aria-label="Chat conversation"
          >
            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}-${message.content.slice(0, 16)}`}
                className={`
                  max-w-[92%] rounded-xl border px-4 py-3
                  ${message.role === 'user'
                    ? 'ml-auto border-orange-200/20 bg-orange-300/10 text-orange-50'
                    : 'border-white/10 bg-black/18 text-foreground'}
                `}
                style={{
                  animation: 'message-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
                  animationDelay: `${Math.min(index * 25, 200)}ms`
                }}
                aria-label={`From ${message.role === 'user' ? 'you' : currentSpecialist?.name ?? 'Claude'}`}
              >
                <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  {message.role === 'user' ? 'You' : (currentSpecialist?.name ?? 'Claude')}
                </div>
                {message.role === 'assistant'
                  ? <MarkdownAnswer content={message.content} />
                  : <p className="text-sm/6 whitespace-pre-wrap">{message.content}</p>}
              </article>
            ))}

            {isSending ?
              <div
                className="
                  inline-flex items-center gap-2 rounded-xl border border-white/10
                  bg-black/18 px-3 py-2 text-sm text-muted-foreground
                "
                role="status"
                style={{ animation: 'message-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both' }}
              >
                <Loader2 className="size-4 animate-spin" />
                {currentSpecialist?.name ?? 'Claude'} is thinking…
              </div>
            : null}

            <div ref={bottomRef} />
          </div>

          {/* Input form */}
          <form
            onSubmit={sendMessage}
            className="grid gap-3 border-t border-white/10 pt-4"
          >
            <label htmlFor={messageInputId} className="sr-only">Message</label>
            <p id={messageHelpId} className="sr-only">
              Press Enter to send. Press Shift and Enter to add a line break.
            </p>
            <Textarea
              id={messageInputId}
              ref={textareaRef}
              value={draft}
              maxLength={4_000}
              placeholder={`Ask ${currentSpecialist?.name ?? 'Claude'} something…`}
              aria-describedby={messageHelpId}
              className="max-h-52 min-h-24 resize-none bg-black/10 text-sm/6"
              onChange={e => { setDraft(e.target.value) }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  e.currentTarget.form?.requestSubmit()
                }
              }}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
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
                    h-8 w-24 rounded-md border border-white/10 bg-black/20 px-2
                    text-sm text-foreground
                  "
                  onChange={e => { setMaxTokens(Number(e.target.value)) }}
                />
              </label>

              <div className="flex items-center gap-3">
                {lastResponse ?
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                    <Coins className="size-3" />
                    {lastResponse.input_tokens} in / {lastResponse.output_tokens} out
                  </p>
                : null}
                <Button type="submit" disabled={!canSend}>
                  {isSending
                    ? <Loader2 className="size-4 animate-spin" />
                    : <Send className="size-4" />}
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
