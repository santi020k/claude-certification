'use client'

import { type SyntheticEvent, useMemo, useRef, useState } from 'react'

import Link from 'next/link'

import {
  getApiBaseUrl,
  parseRetryAfter,
  readChatResponse,
  readErrorMessage
} from '@/components/claude-playground/api'
import { MarkdownAnswer } from '@/components/claude-playground/primitives/markdown-answer'
import { AmbientBackground } from '@/components/claude-playground/sections/ambient-background'
import type { ChatMessage, ChatResponse } from '@/components/claude-playground/types'

import { ArrowLeft, Loader2, RotateCcw, Send } from 'lucide-react'

import { Button } from '@repo/ui/components/ui/button'
import { Textarea } from '@repo/ui/components/ui/textarea'

const starterMessages: ChatMessage[] = [
  {
    role: 'assistant',
    content: 'Hi. Ask me something, then send a follow-up so you can see the backend keep the conversation context.'
  }
]

export function ChatPage() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), [])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages)
  const [draft, setDraft] = useState('')
  const [maxTokens, setMaxTokens] = useState(1000)
  const [lastResponse, setLastResponse] = useState<ChatResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const trimmed = draft.trim()
  const canSend = trimmed.length > 0 && trimmed.length <= 4_000 && !isSending

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
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-3 -ml-3">
              <Link href="/">
                <ArrowLeft className="size-4" />
                Home
              </Link>
            </Button>
            <h1 className="text-3xl/tight font-semibold text-foreground">Chat with Claude</h1>
            <p className="mt-2 max-w-2xl text-sm/6 text-muted-foreground">
              This page uses
              {' '}
              <span className="font-mono text-orange-100">POST /api/chat</span>
              {' '}
              and sends the returned conversation id with each follow-up.
            </p>
          </div>

          <Button type="button" variant="outline" onClick={resetChat}>
            <RotateCcw className="size-4" />
            New chat
          </Button>
        </header>

        {error ?
          (
            <div className="
              rounded-lg border border-rose-500/25 bg-rose-500/8 px-4 py-3
              text-sm text-rose-100
            "
            >
              {error}
            </div>
          ) :
          null}

        <div className="
          flex min-h-[52vh] flex-1 flex-col gap-4 overflow-hidden rounded-lg
          border border-white/10 bg-white/[0.035] p-4
        "
        >
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}-${message.content.slice(0, 16)}`}
                className={`
                  max-w-[92%] rounded-lg border px-4 py-3
                  ${message.role === 'user' ?
                'ml-auto border-orange-200/20 bg-orange-300/10 text-orange-50' :
                'border-white/10 bg-black/18 text-foreground'}
                `}
              >
                <div className="
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
                <div className="
                  inline-flex items-center gap-2 rounded-md border
                  border-white/10 bg-black/18 px-3 py-2 text-sm
                  text-muted-foreground
                "
                >
                  <Loader2 className="size-4 animate-spin" />
                  Claude is thinking
                </div>
              ) :
              null}
          </div>

          <form
            onSubmit={sendMessage}
            className="grid gap-3 border-t border-white/10 pt-4"
          >
            <Textarea
              ref={textareaRef}
              value={draft}
              maxLength={4_000}
              placeholder="Ask a question, then follow up..."
              className="max-h-52 min-h-24 resize-none bg-black/10 text-sm/6"
              onChange={event => {
                setDraft(event.target.value)
              }}
              onKeyDown={event => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.currentTarget.form?.requestSubmit()
                }
              }}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="
                flex items-center gap-2 text-xs text-muted-foreground
              "
              >
                Max tokens
                <input
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
                    <p className="text-xs text-muted-foreground">
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
