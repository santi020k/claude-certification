"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Zap,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/ui/alert";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Switch } from "@repo/ui/components/ui/switch";
import { Textarea } from "@repo/ui/components/ui/textarea";

// ── Types ────────────────────────────────────────────────────────────────────

type AskResponse = {
  question: string;
  answer: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
};

type HealthResponse = {
  status: string;
  environment: string;
  anthropic_api_key_configured: boolean;
  model: string;
};

// ── Constants ────────────────────────────────────────────────────────────────

const STARTER_QUESTION =
  "Explain how Claude can help a small engineering team review pull requests.";

const EXAMPLE_PROMPTS = [
  "Explain Python decorators with a practical example.",
  "What are the trade-offs between REST and GraphQL?",
  "Write a short poem about distributed systems.",
  "Summarise the CAP theorem in three bullet points.",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: unknown };
    if (typeof payload.detail === "string") return payload.detail;
  } catch {
    /* ignore */
  }
  return "The API returned an unexpected response.";
}

function formatModel(model: string): string {
  return model.replace("claude-", "").replace(/-/g, " ");
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TokenBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono">{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-end gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block size-1.5 animate-bounce rounded-full bg-primary/70"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className="relative flex size-2.5">
      {ok && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      )}
      <span
        className={`relative inline-flex size-2.5 rounded-full ${ok ? "bg-emerald-500" : "bg-rose-500"}`}
      />
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ClaudePlayground() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  const [question, setQuestion] = useState(STARTER_QUESTION);
  const [maxTokens, setMaxTokens] = useState(700);
  const [oneSentence, setOneSentence] = useState(false);
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSubmit = question.trim().length >= 3 && !isAsking;

  // ── Keyboard shortcut: Cmd/Ctrl+Enter to submit ───────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
        e.preventDefault();
        void askClaude();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSubmit, question, maxTokens, oneSentence]);

  // ── API calls ─────────────────────────────────────────────────────────────

  const askClaude = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (!canSubmit) return;

      setIsAsking(true);
      setError(null);
      setCopied(false);
      const t0 = Date.now();

      try {
        const q = oneSentence ? `${question.trim()} Answer in one sentence.` : question.trim();
        const response = await fetch(`${apiBaseUrl}/api/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, max_tokens: maxTokens, one_sentence: false }),
        });
        if (!response.ok) throw new Error(await readErrorMessage(response));
        setAnswer((await response.json()) as AskResponse);
        setResponseTime(Date.now() - t0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Claude could not answer right now.");
      } finally {
        setIsAsking(false);
      }
    },
    [apiBaseUrl, canSubmit, maxTokens, oneSentence, question],
  );

  async function runDemo() {
    setIsAsking(true);
    setError(null);
    setCopied(false);
    const t0 = Date.now();
    try {
      const response = await fetch(`${apiBaseUrl}/api/ask/demo`);
      if (!response.ok) throw new Error(await readErrorMessage(response));
      const data = (await response.json()) as AskResponse;
      setAnswer(data);
      setQuestion(data.question);
      setResponseTime(Date.now() - t0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The demo request failed.");
    } finally {
      setIsAsking(false);
    }
  }

  async function checkHealth() {
    setIsChecking(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/health`);
      if (!response.ok) throw new Error(await readErrorMessage(response));
      setHealth((await response.json()) as HealthResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Health check failed.");
    } finally {
      setIsChecking(false);
    }
  }

  async function copyAnswer() {
    if (!answer?.answer) return;
    await navigator.clipboard.writeText(answer.answer);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function reset() {
    setQuestion(STARTER_QUESTION);
    setMaxTokens(700);
    setOneSentence(false);
    setAnswer(null);
    setError(null);
    setResponseTime(null);
    textareaRef.current?.focus();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* ── Ambient gradient blobs ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        {/* Top-left teal glow */}
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-teal-500/8 blur-[120px]" />
        {/* Bottom-right orange glow */}
        <div className="absolute -bottom-60 -right-40 h-[700px] w-[700px] rounded-full bg-orange-500/7 blur-[140px]" />
        {/* Centre subtle blue */}
        <div className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-blue-600/5 blur-[100px]" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <header className="flex flex-col gap-6 rounded-2xl border border-white/8 bg-white/[0.03] p-6 shadow-xl backdrop-blur-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/icon.svg"
                alt="Claude Certification logo"
                width={48}
                height={48}
                priority
                className="rounded-xl shadow-lg shadow-teal-950/30"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Claude Certification
                </p>
                <p className="text-xs text-muted-foreground">
                  AI API playground
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1.5 border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/15">
                <Sparkles className="size-3" />
                Claude Certification
              </Badge>
              <Badge variant="outline" className="border-white/10 text-muted-foreground">
                FastAPI + Next.js
              </Badge>
              <Badge variant="outline" className="border-white/10 text-muted-foreground">
                Anthropic SDK
              </Badge>
            </div>

            {/* Headline with gradient */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                <span className="bg-gradient-to-r from-orange-300 via-amber-200 to-yellow-100 bg-clip-text text-transparent">
                  Ask Claude
                </span>{" "}
                <span className="text-foreground/90">from a production playground.</span>
              </h1>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                Test the backend contract, tune response length, and verify the deployed API —
                all from one focused interface.
              </p>
            </div>

            {/* Example prompts */}
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.slice(0, 2).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setQuestion(p); textareaRef.current?.focus(); }}
                  className="flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground transition hover:border-white/15 hover:text-foreground"
                >
                  <ChevronRight className="size-3 shrink-0 text-orange-400/70" />
                  {p.slice(0, 36)}…
                </button>
              ))}
            </div>
          </div>

          {/* Health check */}
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={checkHealth}
              disabled={isChecking}
              className="border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
            >
              {isChecking ? <LoaderCircle className="animate-spin" /> : <Activity className="size-4" />}
              Check API
            </Button>
            {health && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <StatusDot ok={health.status === "ok"} />
                <span>{health.environment}</span>
                <span className="text-white/20">·</span>
                <span className="font-mono">{formatModel(health.model)}</span>
              </div>
            )}
            <p className="max-w-[200px] break-all text-xs text-white/20">
              {apiBaseUrl}
            </p>
          </div>
        </header>

        {/* ── Error banner ─────────────────────────────────────────────────── */}
        {error && (
          <Alert variant="destructive" className="border-rose-500/30 bg-rose-500/10">
            <AlertCircle className="size-4" />
            <AlertTitle>Request failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ── Main grid ────────────────────────────────────────────────────── */}
        <section className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">

          {/* ── Prompt card ─────────────────────────────────────────────── */}
          <Card className="rounded-2xl border-white/8 bg-white/[0.03] shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-white/6 pb-4">
              <CardTitle className="text-base font-semibold">Prompt</CardTitle>
              <CardDescription className="text-xs">
                Send a question to the FastAPI Claude endpoint.
              </CardDescription>
            </CardHeader>

            <form onSubmit={askClaude}>
              <CardContent className="space-y-5 pt-5">
                {/* Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="question" className="text-xs font-medium text-muted-foreground">
                    Question
                  </Label>
                  <Textarea
                    id="question"
                    ref={textareaRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask Claude something useful…"
                    className="min-h-44 resize-y border-white/8 bg-white/[0.04] text-sm leading-7 placeholder:text-white/20 focus-visible:border-orange-500/40 focus-visible:ring-orange-500/20"
                    maxLength={4000}
                  />
                  <div className="flex justify-between gap-3 text-xs text-muted-foreground/60">
                    <span>Min 3 chars</span>
                    <span className={question.length > 3600 ? "text-orange-400" : ""}>
                      {question.length} / 4 000
                    </span>
                  </div>
                </div>

                {/* More example prompts */}
                <div className="space-y-1.5">
                  <p className="text-[11px] uppercase tracking-wider text-white/20">Try an example</p>
                  <div className="flex flex-col gap-1">
                    {EXAMPLE_PROMPTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => { setQuestion(p); textareaRef.current?.focus(); }}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground/70 transition hover:bg-white/[0.04] hover:text-foreground"
                      >
                        <ChevronRight className="size-3 shrink-0 text-orange-400/50" />
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="max-tokens" className="text-xs font-medium text-muted-foreground">
                      Max tokens
                    </Label>
                    <Input
                      id="max-tokens"
                      type="number"
                      min={50}
                      max={4000}
                      step={50}
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(Number(e.target.value))}
                      className="border-white/8 bg-white/[0.04] font-mono text-sm focus-visible:border-orange-500/40 focus-visible:ring-orange-500/20"
                    />
                  </div>
                  <div className="flex h-9 items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.04] px-3">
                    <Label htmlFor="one-sentence" className="whitespace-nowrap text-xs text-muted-foreground">
                      One sentence
                    </Label>
                    <Switch
                      id="one-sentence"
                      checked={oneSentence}
                      onCheckedChange={setOneSentence}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-2 border-t border-white/6 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="flex-1 gap-2 bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400 sm:flex-none"
                  >
                    {isAsking ? <LoaderCircle className="animate-spin" /> : <Send className="size-4" />}
                    Ask Claude
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={runDemo}
                    disabled={isAsking}
                    className="flex-1 border-white/10 bg-white/[0.04] hover:bg-white/[0.08] sm:flex-none"
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
                    className="hover:bg-white/[0.06]"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                </div>
                {/* Keyboard hint */}
                <p className="hidden text-xs text-white/20 sm:block">
                  <kbd className="rounded border border-white/10 px-1 font-mono text-[10px]">⌘</kbd>
                  {" + "}
                  <kbd className="rounded border border-white/10 px-1 font-mono text-[10px]">↵</kbd>
                  {" to submit"}
                </p>
              </CardFooter>
            </form>
          </Card>

          {/* ── Right column ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Response card */}
            <Card className="flex min-h-[28rem] flex-col rounded-2xl border-white/8 bg-white/[0.03] shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-white/6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Response</CardTitle>
                    <CardDescription className="text-xs">Claude output appears here.</CardDescription>
                  </div>
                  {answer && responseTime && (
                    <Badge variant="outline" className="border-white/10 font-mono text-[10px] text-muted-foreground">
                      {(responseTime / 1000).toFixed(1)}s
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-4 pt-5">
                {isAsking ? (
                  /* Loading state */
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Claude is thinking</span>
                      <TypingDots />
                    </div>
                    <p className="text-xs text-white/20">Waiting for response…</p>
                  </div>
                ) : answer ? (
                  <>
                    {/* Model / token badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-orange-500/30 bg-orange-500/10 font-mono text-[10px] text-orange-300">
                        {formatModel(answer.model)}
                      </Badge>
                    </div>

                    {/* Answer text */}
                    <div className="flex-1 rounded-xl border border-white/8 bg-black/20 p-4">
                      <p className="whitespace-pre-wrap font-[var(--font-geist-sans)] text-sm leading-7 text-foreground/90">
                        {answer.answer}
                      </p>
                    </div>

                    {/* Token usage bars */}
                    <div className="space-y-2 rounded-xl border border-white/6 bg-white/[0.02] p-4">
                      <p className="mb-3 text-[10px] uppercase tracking-wider text-white/25">
                        Token usage
                      </p>
                      <TokenBar
                        label="Input"
                        value={answer.input_tokens}
                        max={maxTokens * 4}
                        color="bg-blue-400"
                      />
                      <TokenBar
                        label="Output"
                        value={answer.output_tokens}
                        max={maxTokens}
                        color="bg-orange-400"
                      />
                    </div>
                  </>
                ) : (
                  /* Empty state */
                  <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/8 bg-white/[0.01] p-8 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                      <Sparkles className="size-6 text-orange-400/60" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground/70">No answer yet</p>
                      <p className="max-w-xs text-xs leading-5 text-muted-foreground/60">
                        Write a question on the left and hit{" "}
                        <span className="text-orange-400/80">Ask Claude</span>, or run the{" "}
                        <span className="text-orange-400/80">Demo</span> to verify the API is wired up.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-t border-white/6 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyAnswer}
                  disabled={!answer?.answer}
                  className="border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                >
                  {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied!" : "Copy answer"}
                </Button>
              </CardFooter>
            </Card>

            {/* API Status card */}
            <Card className="rounded-2xl border-white/8 bg-white/[0.03] shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-white/6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">API Status</CardTitle>
                    <CardDescription className="text-xs">
                      Backend environment info.
                    </CardDescription>
                  </div>
                  {health && <StatusDot ok={health.status === "ok"} />}
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                {health ? (
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    {[
                      { label: "Environment", value: health.environment },
                      {
                        label: "API key",
                        value: health.anthropic_api_key_configured ? "Configured ✓" : "Missing ✗",
                        ok: health.anthropic_api_key_configured,
                      },
                      { label: "Model", value: formatModel(health.model), mono: true, span: true },
                    ].map(({ label, value, ok, mono, span }) => (
                      <div
                        key={label}
                        className={`rounded-xl border border-white/6 bg-white/[0.02] p-3 ${span ? "sm:col-span-2" : ""}`}
                      >
                        <dt className="mb-0.5 text-xs text-muted-foreground/60">{label}</dt>
                        <dd
                          className={`font-medium ${
                            ok === false
                              ? "text-rose-400"
                              : ok === true
                              ? "text-emerald-400"
                              : mono
                              ? "font-mono text-orange-300"
                              : ""
                          }`}
                        >
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="flex flex-col items-start gap-3">
                    <div className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/[0.02] p-4 text-xs text-muted-foreground/60">
                      <KeyRound className="size-4 text-orange-400/40" />
                      Click <strong className="text-foreground/50">Check API</strong> in the header to verify
                      environment and model info.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/6 pt-5 text-xs text-white/20">
          <div className="flex items-center gap-2">
            <span className="font-mono">claude-certification</span>
            <span>·</span>
            <span>FastAPI + Next.js + Anthropic SDK</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://docs.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-white/50"
            >
              Anthropic docs
            </a>
            <span>·</span>
            <a
              href={`${apiBaseUrl}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-white/50"
            >
              API docs
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
