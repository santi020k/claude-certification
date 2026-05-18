"use client";

import {
  type SyntheticEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import { ApiStatusIndicator } from "@/components/api-status/indicator";
import {
  getApiBaseUrl,
  parseRetryAfter,
  readChatResponse,
  readChatStream,
  readErrorMessage,
  readSpecialistsResponse,
} from "@/components/claude-playground/api";
import { MarkdownAnswer } from "@/components/claude-playground/primitives/markdown-answer";
import { TypingDots } from "@/components/claude-playground/primitives/typing-dots";
import { AmbientBackground } from "@/components/claude-playground/sections/ambient-background";
import type {
  ChatMessage,
  ChatResponse,
  Specialist,
} from "@/components/claude-playground/types";

import {
  ArrowLeft,
  Coins,
  Loader2,
  RotateCcw,
  Send,
  Thermometer,
  UserRound,
  WandSparkles,
} from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";
import { Textarea } from "@repo/ui/components/ui/textarea";

// ── Specialist config (emojis + prompts live here — purely a UI concern) ───────

interface SpecialistUiConfig {
  emoji: string;
  prompts: [string, string, string];
}

const SPECIALIST_UI: Record<string, SpecialistUiConfig | undefined> = {
  general: {
    emoji: "🤖",
    prompts: [
      "What are three things I should know about you?",
      "Help me think through a tricky decision I'm facing.",
      "Explain how the internet actually works, simply.",
    ],
  },
  customer_support: {
    emoji: "🎧",
    prompts: [
      "I received the wrong item in my order — what do I do?",
      "How do I request a refund for a digital purchase?",
      "My account is locked and I can't log in — please help.",
    ],
  },
  math_tutor: {
    emoji: "📐",
    prompts: [
      "I don't understand fractions — can you help?",
      "What's the difference between mean, median, and mode?",
      "I'm stuck on this algebra problem: 2x + 5 = 13.",
    ],
  },
  software_developer: {
    emoji: "💻",
    prompts: [
      "Review this code snippet and tell me what could go wrong.",
      "What's the best way to handle errors in a FastAPI app?",
      "Help me design a clean REST API for a to-do list app.",
    ],
  },
  writing_coach: {
    emoji: "✍️",
    prompts: [
      'Give feedback on this sentence: "The thing was very good."',
      "Help me make this email sound more professional.",
      "I'm writing a short story — give me tips on opening hooks.",
    ],
  },
  comedian: {
    emoji: "😂",
    prompts: [
      "Tell me a joke about programmers.",
      "Roast my habit of reading documentation last.",
      "Make up a funny story about a confused AI assistant.",
    ],
  },
  storyteller: {
    emoji: "📖",
    prompts: [
      "Start a mystery story set on a remote space station.",
      "Write the opening paragraph of a fantasy tale.",
      "Create a compelling villain character for my story.",
    ],
  },
};

// ── Default specialists shown while the API loads ──────────────────────────────

const DEFAULT_SPECIALISTS: Specialist[] = [
  {
    id: "general",
    name: "General Assistant",
    description: "A helpful, balanced assistant for everyday questions.",
    temperature: 0.7,
  },
  {
    id: "customer_support",
    name: "Customer Support",
    description:
      "Friendly support agent — empathetic, solution-focused, and clear.",
    temperature: 0.3,
  },
  {
    id: "math_tutor",
    name: "Math Tutor",
    description: "Patient tutor who guides you step-by-step.",
    temperature: 0.1,
  },
  {
    id: "software_developer",
    name: "Software Developer",
    description: "Senior engineer — concise, production-quality code guidance.",
    temperature: 0.2,
  },
  {
    id: "writing_coach",
    name: "Writing Coach",
    description: "Thoughtful coach who helps you write more clearly.",
    temperature: 0.6,
  },
  {
    id: "comedian",
    name: "Comedian",
    description: "Witty, punny, and delightfully chaotic — brings the laughs.",
    temperature: 1.0,
  },
  {
    id: "storyteller",
    name: "Storyteller",
    description:
      "Imaginative author who crafts vivid fiction and immersive worlds.",
    temperature: 0.9,
  },
];

const DEFAULT_SPECIALIST_ID = "general";
const DEFAULT_TEMPERATURE = 0.7;
const MAX_DRAFT_LENGTH = 4_000;

// ── Temperature helpers ────────────────────────────────────────────────────────

interface TempLevel {
  label: string;
  hint: string;
  colour: string;
}

function tempLevel(t: number): TempLevel {
  if (t <= 0.15)
    return {
      label: "Stick to the facts",
      hint: "Short, precise answers — no surprises.",
      colour: "text-blue-300/80",
    };

  if (t <= 0.35)
    return {
      label: "Clear & focused",
      hint: "Consistent and direct — great for serious topics.",
      colour: "text-teal-300/80",
    };

  if (t <= 0.55)
    return {
      label: "Balanced",
      hint: "A mix of accuracy and a touch of personality.",
      colour: "text-green-300/80",
    };

  if (t <= 0.75)
    return {
      label: "More expressive",
      hint: "Varied phrasing, richer language, more ideas.",
      colour: "text-orange-300/80",
    };

  if (t <= 0.9)
    return {
      label: "Imaginative",
      hint: "Unexpected angles — ideal for creative tasks.",
      colour: "text-purple-300/80",
    };

  return {
    label: "Surprise me! 🎲",
    hint: "Anything can happen — embrace the chaos.",
    colour: "text-rose-300/80",
  };
}

// ── Session persistence ────────────────────────────────────────────────────────

function buildStarterMessages(specialistName: string): ChatMessage[] {
  return [
    {
      role: "assistant",
      content: `Hi! I'm your ${specialistName}. Ask me something, then follow up to see the backend keep the conversation context.`,
    },
  ];
}

const CHAT_SESSIONS_KEY = "certification.chat.sessions.v3";
const ACTIVE_SPECIALIST_KEY = "certification.chat.active_specialist.v3";

interface AgentChatSession {
  conversationId: string | null;
  lastResponse: ChatResponse | null;
  maxTokens: number;
  messages: ChatMessage[];
  streamEnabled: boolean;
  temperature: number;
}

type AgentSessions = Record<string, AgentChatSession | undefined>;

function readAllSessions(): AgentSessions {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(CHAT_SESSIONS_KEY);

    if (!raw) return {};

    return JSON.parse(raw) as AgentSessions;
  } catch {
    return {};
  }
}

function writeAllSessions(sessions: AgentSessions) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
  } catch {}
}

function readActiveSpecialistId(): string {
  if (typeof window === "undefined") return DEFAULT_SPECIALIST_ID;

  try {
    return (
      window.localStorage.getItem(ACTIVE_SPECIALIST_KEY) ??
      DEFAULT_SPECIALIST_ID
    );
  } catch {
    return DEFAULT_SPECIALIST_ID;
  }
}

function writeActiveSpecialistId(id: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(ACTIVE_SPECIALIST_KEY, id);
  } catch {}
}

function isOnlyStarterMessage(messages: ChatMessage[]): boolean {
  return messages.length === 1 && messages[0]?.role === "assistant";
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ChatPage() {
  const messageInputId = useId();
  const messageHelpId = useId();
  const tokenInputId = useId();
  const temperatureInputId = useId();
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  const [specialists, setSpecialists] =
    useState<Specialist[]>(DEFAULT_SPECIALISTS);

  const [specialistId, setSpecialistId] = useState<string>(
    DEFAULT_SPECIALIST_ID,
  );

  const [temperature, setTemperature] = useState<number>(DEFAULT_TEMPERATURE);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(
    buildStarterMessages("General Assistant"),
  );

  const [draft, setDraft] = useState("");
  const [maxTokens, setMaxTokens] = useState(1000);
  const [lastResponse, setLastResponse] = useState<ChatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [streamEnabled, setStreamEnabled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chipRowRef = useRef<HTMLDivElement>(null);
  const trimmed = draft.trim();

  const canSend =
    trimmed.length > 0 && trimmed.length <= MAX_DRAFT_LENGTH && !isSending;

  const draftUsage = Math.min(
    100,
    Math.round((draft.length / MAX_DRAFT_LENGTH) * 100),
  );

  const hasOnlyStarter = isOnlyStarterMessage(messages);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Restore sessions on mount
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      const activeId = readActiveSpecialistId();
      const allSessions = readAllSessions();
      const currentSession = allSessions[activeId];

      setSpecialistId(activeId);

      if (currentSession) {
        setConversationId(currentSession.conversationId);

        setMessages(currentSession.messages);

        setMaxTokens(currentSession.maxTokens);

        setLastResponse(currentSession.lastResponse);

        setStreamEnabled(currentSession.streamEnabled);

        setTemperature(currentSession.temperature);
      } else {
        const spec = DEFAULT_SPECIALISTS.find((s) => s.id === activeId);
        const name = spec?.name ?? "General Assistant";
        const temp = spec?.temperature ?? DEFAULT_TEMPERATURE;

        setConversationId(null);

        setMessages(buildStarterMessages(name));

        setMaxTokens(1000);

        setLastResponse(null);

        setStreamEnabled(false);

        setTemperature(temp);
      }

      setIsSessionReady(true);
    });

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, []);

  // Scroll active chip into view when specialist changes
  useEffect(() => {
    const chip = chipRowRef.current?.querySelector(
      `[data-id="${specialistId}"]`,
    );

    chip?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [specialistId]);

  // Fetch specialists from API
  useEffect(() => {
    const controller = new AbortController();

    fetch(`${apiBaseUrl}/api/specialists`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("");

        return readSpecialistsResponse(res);
      })
      .then((data) => {
        setSpecialists(data.specialists);
      })
      .catch(() => {});

    return () => {
      controller.abort();
    };
  }, [apiBaseUrl]);

  // Persist current specialist's session whenever its state changes
  useEffect(() => {
    if (!isSessionReady) return;

    try {
      const allSessions = readAllSessions();

      allSessions[specialistId] = {
        conversationId,
        lastResponse,
        maxTokens,
        messages,
        streamEnabled,
        temperature,
      };

      writeAllSessions(allSessions);
    } catch {}
  }, [
    conversationId,
    isSessionReady,
    lastResponse,
    maxTokens,
    messages,
    specialistId,
    streamEnabled,
    temperature,
  ]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function sendMessage(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSend) return;

    const optimisticMessage: ChatMessage = { role: "user", content: trimmed };

    setMessages((current) => [...current, optimisticMessage]);

    setDraft("");

    setError(null);

    setIsSending(true);

    try {
      if (streamEnabled) {
        await sendStreamingMessage(optimisticMessage);

        return;
      }

      const res = await fetch(`${apiBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: trimmed,
          max_tokens: maxTokens,
          specialist: specialistId,
          temperature,
        }),
      });

      if (res.status === 429)
        throw new Error(
          `Rate limit reached. Please wait ${parseRetryAfter(res)}s before trying again.`,
        );

      if (!res.ok) throw new Error(await readErrorMessage(res));

      const data = await readChatResponse(res);

      setConversationId(data.conversation_id);

      setMessages(data.messages);

      setLastResponse(data);
    } catch (err) {
      setMessages((current) => current.filter((m) => m !== optimisticMessage));

      setError(
        err instanceof Error
          ? err.message
          : "Claude could not answer right now.",
      );
    } finally {
      setIsSending(false);

      textareaRef.current?.focus();
    }
  }

  async function sendStreamingMessage(optimisticMessage: ChatMessage) {
    const assistantMessage: ChatMessage = { role: "assistant", content: "" };

    setMessages((current) => [...current, assistantMessage]);

    try {
      const res = await fetch(`${apiBaseUrl}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: optimisticMessage.content,
          max_tokens: maxTokens,
          specialist: specialistId,
          temperature,
        }),
      });

      if (res.status === 429)
        throw new Error(
          `Rate limit reached. Please wait ${parseRetryAfter(res)}s before trying again.`,
        );

      if (!res.ok) throw new Error(await readErrorMessage(res));

      let finalResponse: ChatResponse | null = null;

      for await (const event of readChatStream(res)) {
        if (event.type === "text") {
          setMessages((current) =>
            current.map((m) =>
              m === assistantMessage
                ? { ...m, content: `${m.content}${event.text}` }
                : m,
            ),
          );

          continue;
        }

        if (event.type === "error") throw new Error(event.detail);

        finalResponse = event;

        setConversationId(event.conversation_id);

        setMessages(event.messages);

        setLastResponse(event);
      }

      if (!finalResponse)
        throw new Error(
          "Claude ended the stream before sending a final response.",
        );
    } catch (err) {
      setMessages((current) => current.filter((m) => m !== assistantMessage));

      throw err;
    }
  }

  function resetChat() {
    const spec = specialists.find((s) => s.id === specialistId);
    const name = spec?.name ?? "General Assistant";
    const temp = spec?.temperature ?? DEFAULT_TEMPERATURE;

    setConversationId(null);

    setMessages(buildStarterMessages(name));

    setDraft("");

    setLastResponse(null);

    setError(null);

    setTemperature(temp);

    try {
      const allSessions = readAllSessions();

      allSessions[specialistId] = {
        conversationId: null,
        lastResponse: null,
        maxTokens: 1000,
        messages: buildStarterMessages(name),
        streamEnabled,
        temperature: temp,
      };

      writeAllSessions(allSessions);
    } catch {}

    textareaRef.current?.focus();
  }

  function handleSpecialistChange(nextId: string) {
    if (!isSessionReady) return;

    // Save current specialist's state
    const allSessions = readAllSessions();

    allSessions[specialistId] = {
      conversationId,
      lastResponse,
      maxTokens,
      messages,
      streamEnabled,
      temperature,
    };

    writeAllSessions(allSessions);

    setSpecialistId(nextId);

    writeActiveSpecialistId(nextId);

    const nextSession = allSessions[nextId];

    if (nextSession) {
      setConversationId(nextSession.conversationId);

      setMessages(nextSession.messages);

      setMaxTokens(nextSession.maxTokens);

      setLastResponse(nextSession.lastResponse);

      setStreamEnabled(nextSession.streamEnabled);

      setTemperature(nextSession.temperature);
    } else {
      const spec = specialists.find((s) => s.id === nextId);
      const name = spec?.name ?? "General Assistant";
      const temp = spec?.temperature ?? DEFAULT_TEMPERATURE;

      setConversationId(null);

      setMessages(buildStarterMessages(name));

      setMaxTokens(1000);

      setLastResponse(null);

      setStreamEnabled(false);

      setTemperature(temp);
    }

    setDraft("");

    setError(null);
  }

  function applyStarterPrompt(prompt: string) {
    setDraft(prompt);

    textareaRef.current?.focus();
  }

  const currentSpecialist = specialists.find((s) => s.id === specialistId);

  const currentUiConfig = SPECIALIST_UI[specialistId] ?? SPECIALIST_UI.general;

  const starterPrompts = currentUiConfig.prompts;
  const tl = tempLevel(temperature);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <main className="relative flex min-h-screen flex-col">
      <AmbientBackground />

      <section
        className="
        relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4
        py-6
        sm:px-6
        lg:px-10 lg:py-8
      "
      >
        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <nav className="animate-fade-in flex items-center justify-between">
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
          <div
            className="
            flex items-center gap-2
            sm:gap-3
          "
          >
            <ApiStatusIndicator />
          </div>
        </nav>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header
          className="
          animate-fade-in grid gap-5
          lg:grid-cols-[1fr_auto]
        "
        >
          {/* Title + description */}
          <div>
            <h1
              className="
              text-3xl/tight font-semibold text-foreground
              sm:text-4xl
            "
            >
              Chat with Claude
            </h1>
            <p className="mt-1.5 max-w-xl text-sm/6 text-muted-foreground">
              Pick a specialist below, tune the response style, then start a
              conversation. Context is stored on the server — follow-ups just
              work.
            </p>
          </div>

          {/* Response style slider (compact, lives in top-right corner) */}
          <div
            className="
            flex w-full flex-col gap-1.5 rounded-xl border border-white/10
            bg-black/20 p-3 backdrop-blur-sm
            lg:w-56
          "
          >
            <div className="flex items-center justify-between gap-2">
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
              <span
                className={`
                text-xs font-semibold
                ${tl.colour}
              `}
              >
                {tl.label}
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
                bg-white/10 accent-orange-400
              "
              onChange={(e) => {
                setTemperature(Number(e.target.value));
              }}
            />
            <div
              className="
              flex justify-between text-[10px] text-muted-foreground/40
            "
            >
              <span>Factual</span>
              <span>Creative</span>
            </div>
            <p className="text-[11px] text-muted-foreground/50 italic">
              {tl.hint}
            </p>
          </div>
        </header>

        {/* ── Specialist picker ────────────────────────────────────────────── */}
        <div className="animate-slide-up-fade flex flex-col gap-2">
          <div
            ref={chipRowRef}
            className="flex scrollbar-none gap-2 pb-1"
            role="group"
            aria-label="Select a specialist"
          >
            {specialists.map((s) => {
              const isActive = s.id === specialistId;
              const ui = SPECIALIST_UI[s.id];

              return (
                <button
                  key={s.id}
                  data-id={s.id}
                  type="button"
                  onClick={() => {
                    handleSpecialistChange(s.id);
                  }}
                  className={`
                    flex shrink-0 items-center gap-2 rounded-xl border px-3.5
                    py-2.5 text-sm font-medium transition-all duration-200
                    focus-visible:ring-2 focus-visible:ring-orange-300/50
                    focus-visible:outline-none
                    ${
                      isActive
                        ? `
                    -translate-y-0.5 border-orange-300/40 bg-orange-300/12
                    text-orange-100 shadow-lg shadow-orange-950/20
                  `
                        : `
                    border-white/10 bg-white/4 text-muted-foreground
                    hover:-translate-y-0.5 hover:border-white/20
                    hover:bg-white/7 hover:text-foreground
                  `
                    }
                  `}
                  aria-pressed={isActive}
                >
                  <span className="text-base leading-none" aria-hidden="true">
                    {ui?.emoji ?? "🤖"}
                  </span>
                  <span className="whitespace-nowrap">{s.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active specialist description */}
          {currentSpecialist ? (
            <p className="pl-1 text-xs text-muted-foreground/60">
              <span className="font-medium text-muted-foreground/80">
                {currentSpecialist.name}
              </span>{" "}
              — {currentSpecialist.description}
            </p>
          ) : null}
        </div>

        {/* ── Error banner ─────────────────────────────────────────────────── */}
        {error ? (
          <div
            className="
                animate-slide-up-fade rounded-lg border border-rose-500/25
                bg-rose-500/8 px-4 py-3 text-sm text-rose-200
              "
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {/* ── Chat window ──────────────────────────────────────────────────── */}
        <div
          className="
          flex min-h-[56vh] flex-1 flex-col rounded-2xl border border-white/10
          bg-white/3 shadow-2xl shadow-black/25 backdrop-blur-md
        "
        >
          {/* Thread header */}
          <div
            className="
            flex flex-wrap items-center justify-between gap-3 border-b
            border-white/8 bg-black/15 px-4 py-3
          "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                grid size-9 shrink-0 place-items-center rounded-xl border
                border-orange-200/15 bg-orange-300/10 text-lg
              "
              >
                {currentUiConfig?.emoji ?? "🤖"}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {currentSpecialist?.name ?? "Claude"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {messages.length}{" "}
                  {messages.length === 1 ? "message" : "messages"} in this
                  thread
                </p>
              </div>
            </div>

            <div
              className="
              flex items-center gap-2
              sm:gap-3
            "
            >
              {lastResponse ? (
                <p
                  className="
                    inline-flex items-center gap-1.5 rounded-full border
                    border-white/10 bg-black/20 px-3 py-1 text-xs
                    text-muted-foreground/70
                  "
                >
                  <Coins className="size-3" />
                  {lastResponse.input_tokens} in /{lastResponse.output_tokens}{" "}
                  out
                </p>
              ) : null}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="
                  h-8 gap-1.5 border-white/15 bg-white/4 text-xs transition-all
                  hover:-translate-y-0.5 hover:border-orange-200/30
                "
                onClick={() => {
                  resetChat();
                }}
              >
                <RotateCcw className="size-3.5" />
                Reset chat
              </Button>
            </div>
          </div>

          {/* Message log */}
          <div
            className="flex-1 space-y-5 px-4 py-5"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent, black 18px, black calc(100% - 18px), transparent)",
            }}
            role="log"
            aria-live="polite"
            aria-label="Chat conversation"
          >
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}-${message.content.slice(0, 16)}`}
                className={`
                  flex gap-3
                  ${message.role === "user" ? "justify-end" : "justify-start"}
                `}
                style={{
                  animation:
                    "message-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
                  animationDelay: `${Math.min(index * 35, 240)}ms`,
                }}
              >
                {/* Assistant avatar */}
                {message.role === "assistant" ? (
                  <div
                    className="
                      mt-1 grid size-8 shrink-0 place-items-center rounded-full
                      border border-white/10 bg-black/25 text-sm
                    "
                  >
                    {currentUiConfig?.emoji ?? "🤖"}
                  </div>
                ) : null}

                <article
                  className={`
                    group max-w-[88%] rounded-2xl border px-4 py-3
                    transition-shadow duration-300
                    hover:shadow-xl
                    sm:max-w-[75%]
                    ${
                      message.role === "user"
                        ? `
                  border-orange-200/20 bg-orange-300/10 text-orange-50
                  shadow-orange-950/10
                `
                        : "border-white/8 bg-black/20 text-foreground shadow-black/10"
                    }
                  `}
                  aria-label={`From ${message.role === "user" ? "you" : (currentSpecialist?.name ?? "Claude")}`}
                >
                  <p
                    className="
                    mb-2 text-[11px] font-semibold tracking-wide
                    text-muted-foreground/60 uppercase
                  "
                  >
                    {message.role === "user"
                      ? "You"
                      : (currentSpecialist?.name ?? "Claude")}
                  </p>
                  {message.role === "assistant" ? (
                    <MarkdownAnswer
                      content={message.content}
                      isStreaming={
                        isSending ? index === messages.length - 1 : null
                      }
                    />
                  ) : (
                    <p className="text-sm/6 whitespace-pre-wrap">
                      {message.content}
                    </p>
                  )}
                </article>

                {/* User avatar */}
                {message.role === "user" ? (
                  <div
                    className="
                      mt-1 grid size-8 shrink-0 place-items-center rounded-full
                      border border-orange-200/15 bg-orange-300/10
                      text-orange-100
                    "
                  >
                    <UserRound className="size-4" />
                  </div>
                ) : null}
              </div>
            ))}

            {/* Thinking indicator */}
            {isSending && !streamEnabled ? (
              <div
                className="
                    inline-flex items-center gap-3 rounded-2xl border
                    border-white/10 bg-black/20 px-4 py-3 text-sm
                    text-muted-foreground
                  "
                role="status"
                style={{
                  animation:
                    "message-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
                }}
              >
                <Loader2 className="size-4 animate-spin text-orange-200/80" />
                <span>{currentSpecialist?.name ?? "Claude"} is thinking</span>
                <TypingDots />
              </div>
            ) : null}

            {/* Starter prompts — specialist-specific */}
            {hasOnlyStarter ? (
              <div
                className="
                  animate-slide-up-fade grid gap-2 pt-2
                  sm:grid-cols-3
                "
              >
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      applyStarterPrompt(prompt);
                    }}
                    className="
                        min-h-16 rounded-xl border border-white/10 bg-black/12
                        px-3.5 py-3 text-left text-xs/5 text-muted-foreground/70
                        transition-all
                        hover:-translate-y-0.5 hover:border-orange-200/25
                        hover:bg-orange-300/8 hover:text-foreground
                        focus-visible:ring-2 focus-visible:ring-orange-300/40
                        focus-visible:outline-none
                      "
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>

          {/* ── Input form ─────────────────────────────────────────────────── */}
          <form
            onSubmit={sendMessage}
            className="grid gap-3 border-t border-white/8 bg-black/12 p-4"
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
              maxLength={MAX_DRAFT_LENGTH}
              placeholder={`Ask ${currentSpecialist?.name ?? "Claude"} something…`}
              aria-describedby={messageHelpId}
              className="
                max-h-52 min-h-24 resize-none rounded-xl border-white/15
                bg-black/18 p-4 text-sm/6 transition-all
                placeholder:text-muted-foreground/50
                focus-visible:border-orange-200/40 focus-visible:bg-black/25
                focus-visible:ring-orange-300/20
              "
              onChange={(e) => {
                setDraft(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();

                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Left controls */}
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
                    onChange={(e) => {
                      setMaxTokens(Number(e.target.value));
                    }}
                  />
                </label>

                {/* Character usage bar */}
                <div
                  className="
                  flex items-center gap-2 text-xs text-muted-foreground/60
                "
                >
                  <div className="h-1.5 w-16 rounded-full bg-white/10">
                    <div
                      className="
                        h-full rounded-full bg-orange-300/70 transition-all
                        duration-300
                      "
                      style={{ width: `${draftUsage}%` }}
                    />
                  </div>
                  <span className="tabular-nums">
                    {draft.length}/{MAX_DRAFT_LENGTH}
                  </span>
                </div>

                {/* Stream toggle */}
                <label
                  className="
                  flex cursor-pointer items-center gap-2 rounded-lg border
                  border-white/10 bg-black/15 px-2.5 py-1.5 text-xs
                  text-muted-foreground transition-colors
                  hover:border-orange-200/20 hover:text-foreground
                "
                >
                  <input
                    type="checkbox"
                    checked={streamEnabled}
                    disabled={isSending}
                    className="size-3.5 accent-orange-400"
                    onChange={(e) => {
                      setStreamEnabled(e.target.checked);
                    }}
                  />
                  Stream message
                </label>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-3">
                <p
                  className="
                  hidden items-center gap-1.5 text-xs text-muted-foreground/45
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
                    shadow-orange-950/30 transition-all
                    hover:-translate-y-0.5 hover:bg-orange-400
                    disabled:translate-y-0 disabled:opacity-60
                    disabled:shadow-none
                  "
                >
                  {isSending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
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
  );
}
