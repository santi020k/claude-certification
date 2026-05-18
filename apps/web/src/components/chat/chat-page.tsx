'use client'

import { type SyntheticEvent, useEffect, useId, useMemo, useRef, useState } from 'react'

import Link from 'next/link'

import { ApiStatusIndicator } from '@/components/api-status/indicator'
import {
  getApiBaseUrl,
  parseRetryAfter,
  readChatResponse,
  readErrorMessage
} from '@/components/claude-playground/api'
import { MarkdownAnswer } from '@/components/claude-playground/primitives/markdown-answer'
import { AmbientBackground } from '@/components/claude-playground/sections/ambient-background'
import type { ChatMessage, ChatResponse } from '@/components/claude-playground/types'

import { ArrowLeft, Coins, Loader2, RotateCcw, Send } from 'lucide-react'

import { Button } from '@repo/ui/components/ui/button'
import { Textarea } from '@repo/ui/components/ui/textarea'

const starterMessages: ChatMessage[] = [
  {
    role: 'assistant',
    content: 'Hi. Ask me something, then send a follow-up so you can see the backend keep the conversation context.'
  }
]

const chatSessionKey = 'certification.chat.session'

interface ChatSession {
  conversationId: string | null
  lastResponse: ChatResponse | null
  maxTokens: number
  messages: ChatMessage[]
}

function getDefaultChatSession(): ChatSession {
  return {
    conversationId: null,
    lastResponse: null,
    maxTokens: 1000,
    messages: starterMessages
  }
}

function readChatSession(): ChatSession {
  if (typeof window === 'undefined') {
    return getDefaultChatSession()
  }

  try {
    const raw = window.sessionStorage.getItem(chatSessionKey)

    if (!raw) {
      return getDefaultChatSession()
    }

    const parsed = JSON.parse(raw) as Partial<ChatSession>

    return {
      conversationId: typeof parsed.conversationId === 'string' ? parsed.conversationId : null,
      lastResponse: parsed.lastResponse ?? null,
      maxTokens: typeof parsed.maxTokens === 'number' ? parsed.maxTokens : 1000,
      messages: Array.isArray(parsed.messages) && parsed.messages.length > 0 ?
        parsed.messages :
        starterMessages
    }
  } catch {
    return getDefaultChatSession()
  }
}

function isStarterChat(messages: ChatMessage[]): boolean {
  return messages.length === starterMessages.length &&
    messages.every((message, index) => message.role === starterMessages[index]?.role &&
      message.content === starterMessages[index]?.content)
}

export function ChatPage() {
  const messageInputId = useId()
  const messageHelpId = useId()
  const tokenInputId = useId()
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), [])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages)
  const [draft, setDraft] = useState('')
  const [maxTokens, setMaxTokens] = useState(1000)
  const [lastResponse, setLastResponse] = useState<ChatResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isSessionReady, setIsSessionReady] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const trimmed = draft.trim()
  const canSend = trimmed.length > 0 && trimmed.length <= 4_000 && !isSending

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      const session = readChatSession()

      setConversationId(session.conversationId)

      setMessages(session.messages)

      setMaxTokens(session.maxTokens)

      setLastResponse(session.lastResponse)

      setIsSessionReady(true)
    })

    return () => {
      window.cancelAnimationFrame(animationFrame)
    }
  }, [])

  useEffect(() => {
    if (!isSessionReady) return

    try {
      if (!conversationId && !lastResponse && isStarterChat(messages)) {
        window.sessionStorage.removeItem(chatSessionKey)

        return
      }

      window.sessionStorage.setItem(
        chatSessionKey, JSON.stringify({
          conversationId,
          lastResponse,
          maxTokens,
          messages
        })
      )
    } catch { /* Browser session storage may be unavailable. */ }
  }, [conversationId, isSessionReady, lastResponse, maxTokens, messages])

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
          max_tokens: maxTokens
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
      setMessages(current => current.filter(message => message !== optimisticMessage))

      setError(err instanceof Error ? err.message : 'Claude could not answer right now.')
    } finally {
      setIsSending(false)

      textareaRef.current?.focus()
    }
  }

  function resetChat() {
    try {
      window.sessionStorage.removeItem(chatSessionKey)
    } catch { /* Browser session storage may be unavailable. */ }

    setConversationId(null)

    setMessages(starterMessages)

    setDraft('')

    setLastResponse(null)

    setError(null)

    textareaRef.current?.focus()
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <AmbientBackground />

      <section className="
        relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4
        py-8
        sm:px-6
        lg:px-10
      "
      >
        <header className="
          animate-fade-in flex flex-wrap items-start justify-between gap-4
        "
        >
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-3 -ml-3">
              <Link href="/">
                <ArrowLeft className="size-4" />
                Home
              </Link>
            </Button>
            <h1 className="text-3xl/tight font-semibold text-foreground">Chat with Claude</h1>
            <p className="mt-1.5 max-w-2xl text-sm/6 text-muted-foreground">
              Powered by
              {' '}
              <span className="font-mono text-orange-200/80">POST /api/chat</span>
              {' '}
              — context lives in the backend, and this tab remembers the thread until New chat.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ApiStatusIndicator />
            <Button type="button" variant="outline" size="sm" onClick={resetChat}>
              <RotateCcw className="size-3.5" />
              New chat
            </Button>
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

        <div
          className="
            flex min-h-[52vh] flex-1 flex-col gap-4 overflow-hidden rounded-xl
            border border-white/10 bg-white/[0.035] p-4
          "
        >
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
                  ${message.role === 'user' ?
                'ml-auto border-orange-200/20 bg-orange-300/10 text-orange-50' :
                'border-white/10 bg-black/18 text-foreground'}
                `}
                style={{
                  animation: 'message-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
                  animationDelay: `${Math.min(index * 25, 200)}ms`
                }}
                aria-label={`From ${message.role === 'user' ? 'you' : 'Claude'}`}
              >
                <div
                  className="
                    mb-2 text-xs font-medium text-muted-foreground uppercase
                  "
                >
                  {message.role === 'user' ? 'You' : 'Claude'}
                </div>
                {message.role === 'assistant' ?
                  <MarkdownAnswer content={message.content} /> :
                  <p className="text-sm/6 whitespace-pre-wrap">{message.content}</p>}
              </article>
            ))}
            {isSending ?
              (
                <div
                  className="
                    inline-flex items-center gap-2 rounded-xl border
                    border-white/10 bg-black/18 px-3 py-2 text-sm
                    text-muted-foreground
                  "
                  role="status"
                  style={{ animation: 'message-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both' }}
                >
                  <Loader2 className="size-4 animate-spin" />
                  Claude is thinking…
                </div>
              ) :
              null}

            {/* Auto-scroll anchor */}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={sendMessage}
            className="grid gap-3 border-t border-white/10 pt-4"
          >
            <label htmlFor={messageInputId} className="sr-only">
              Message
            </label>
            <p id={messageHelpId} className="sr-only">
              Press Enter to send. Press Shift and Enter to add a line break.
            </p>
            <Textarea
              id={messageInputId}
              ref={textareaRef}
              value={draft}
              maxLength={4_000}
              placeholder="Ask something, then follow up…"
              aria-describedby={messageHelpId}
              className="max-h-52 min-h-24 resize-none bg-black/10 text-sm/6"
              onChange={event => {
                setDraft(event.target.value)
              }}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()

                  event.currentTarget.form?.requestSubmit()
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
                  onChange={event => {
                    setMaxTokens(Number(event.target.value))
                  }}
                />
              </label>

              <div className="flex items-center gap-3">
                {lastResponse ?
                  (
                    <p className="
                      flex items-center gap-1.5 text-xs text-muted-foreground/70
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
                <Button type="submit" disabled={!canSend}>
                  {isSending ?
                    <Loader2 className="size-4 animate-spin" /> :
                    (
                      <Send className="size-4" />
                    )}
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
