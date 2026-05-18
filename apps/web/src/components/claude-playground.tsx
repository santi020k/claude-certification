"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Check,
  Copy,
  LoaderCircle,
  RotateCcw,
  Send,
  Sparkles,
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

const starterQuestion =
  "Explain how Claude can help a small engineering team review pull requests.";

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: unknown };
    if (typeof payload.detail === "string") {
      return payload.detail;
    }
  } catch {
    return "The API returned an unexpected response.";
  }
  return "The API returned an unexpected response.";
}

export function ClaudePlayground() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const [question, setQuestion] = useState(starterQuestion);
  const [maxTokens, setMaxTokens] = useState(700);
  const [oneSentence, setOneSentence] = useState(false);
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  const canSubmit = question.trim().length >= 3 && !isAsking;

  async function askClaude(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!canSubmit) {
      return;
    }

    setIsAsking(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch(`${apiBaseUrl}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          max_tokens: maxTokens,
          one_sentence: oneSentence,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      setAnswer((await response.json()) as AskResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claude could not answer right now.");
    } finally {
      setIsAsking(false);
    }
  }

  async function runDemo() {
    setIsAsking(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch(`${apiBaseUrl}/api/ask/demo`);
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }
      setAnswer((await response.json()) as AskResponse);
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
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }
      setHealth((await response.json()) as HealthResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The health check failed.");
    } finally {
      setIsChecking(false);
    }
  }

  async function copyAnswer() {
    if (!answer?.answer) {
      return;
    }
    await navigator.clipboard.writeText(answer.answer);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_34%),linear-gradient(180deg,#fafafa_0%,#f4f4f5_100%)] px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-5 rounded-lg border bg-background/90 p-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5">
                <Sparkles className="size-3.5" />
                Claude Certification
              </Badge>
              <Badge variant="outline">FastAPI + Next.js</Badge>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Ask Claude from a production-shaped playground.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Test the backend contract, tune response length, and verify the
                deployed API from one focused interface.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Button
              type="button"
              variant="outline"
              onClick={checkHealth}
              disabled={isChecking}
              className="w-full sm:w-auto"
            >
              {isChecking ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Activity />
              )}
              Check API
            </Button>
            <p className="max-w-xs break-all text-xs text-muted-foreground">
              {apiBaseUrl}
            </p>
          </div>
        </header>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Request failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Prompt</CardTitle>
              <CardDescription>
                Send a question to the FastAPI Claude endpoint.
              </CardDescription>
            </CardHeader>
            <form onSubmit={askClaude}>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Ask Claude something useful..."
                    className="min-h-44 resize-y text-sm leading-6"
                    maxLength={4000}
                  />
                  <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                    <span>Minimum 3 characters</span>
                    <span>{question.length}/4000</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <div className="space-y-2">
                    <Label htmlFor="max-tokens">Max tokens</Label>
                    <Input
                      id="max-tokens"
                      type="number"
                      min={50}
                      max={4000}
                      step={50}
                      value={maxTokens}
                      onChange={(event) =>
                        setMaxTokens(Number(event.target.value))
                      }
                    />
                  </div>
                  <div className="flex h-9 items-center justify-between gap-3 rounded-md border px-3">
                    <Label htmlFor="one-sentence" className="whitespace-nowrap">
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
              <CardFooter className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
                  {isAsking ? <LoaderCircle className="animate-spin" /> : <Send />}
                  Ask Claude
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={runDemo}
                  disabled={isAsking}
                  className="w-full sm:w-auto"
                >
                  <Sparkles />
                  Run demo
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setQuestion(starterQuestion);
                    setMaxTokens(700);
                    setOneSentence(false);
                    setAnswer(null);
                    setError(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  <RotateCcw />
                  Reset
                </Button>
              </CardFooter>
            </form>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="min-h-[29rem] rounded-lg">
              <CardHeader className="border-b">
                <div>
                  <CardTitle>Response</CardTitle>
                  <CardDescription>
                    Claude output and token usage appear here.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4 pt-6">
                {answer ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{answer.model}</Badge>
                      <Badge variant="secondary">
                        {answer.input_tokens} input tokens
                      </Badge>
                      <Badge variant="secondary">
                        {answer.output_tokens} output tokens
                      </Badge>
                    </div>
                    <div className="rounded-md border bg-muted/40 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-7">
                        {answer.answer}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-72 flex-1 items-center justify-center rounded-md border border-dashed bg-muted/25 p-6 text-center">
                    <div className="max-w-sm space-y-2">
                      <Sparkles className="mx-auto size-8 text-muted-foreground" />
                      <p className="text-sm font-medium">No answer yet</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Ask your own question or run the demo to confirm the API
                        is wired correctly.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyAnswer}
                  disabled={!answer?.answer}
                >
                  {copied ? <Check /> : <Copy />}
                  {copied ? "Copied" : "Copy answer"}
                </Button>
              </CardFooter>
            </Card>

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>API Status</CardTitle>
                <CardDescription>
                  Health data from the backend service.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {health ? (
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-md border p-3">
                      <dt className="text-muted-foreground">Environment</dt>
                      <dd className="font-medium">{health.environment}</dd>
                    </div>
                    <div className="rounded-md border p-3">
                      <dt className="text-muted-foreground">API key</dt>
                      <dd className="font-medium">
                        {health.anthropic_api_key_configured
                          ? "Configured"
                          : "Missing"}
                      </dd>
                    </div>
                    <div className="rounded-md border p-3 sm:col-span-2">
                      <dt className="text-muted-foreground">Model</dt>
                      <dd className="break-all font-medium">{health.model}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm leading-6 text-muted-foreground">
                    Run a health check to see environment and model information.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
