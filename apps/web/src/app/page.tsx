import Link from 'next/link'

import { ApiStatusIndicator } from '@/components/api-status/indicator'
import { AmbientBackground } from '@/components/claude-playground/sections/ambient-background'

import { ArrowRight, Bot, FlaskConical, MessageSquare, Zap } from 'lucide-react'

import { Button } from '@repo/ui/components/ui/button'

const features = [
  {
    href: '/chat',
    title: 'Multi-turn Chat',
    description:
      'Server-side conversation memory with each follow-up. The backend maintains history via conversation IDs — no state bloat on the client.',
    icon: MessageSquare,
    badge: 'POST /api/chat'
  },
  {
    href: '/playground',
    title: 'Prompt Playground',
    description:
      'Single-turn experiments with token controls, one-sentence mode, and live health checks. The fastest way to iterate on a prompt.',
    icon: FlaskConical,
    badge: 'POST /api/ask'
  }
]

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col">
      <AmbientBackground />

      <section
        className="
          relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4
          py-10
          sm:px-6
          lg:px-10
        "
      >
        {/* ── Nav ──────────────────────────────────────────────────────── */}
        <nav className="animate-fade-in flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div
              className="
                flex size-10 items-center justify-center rounded-md border
                border-white/10 bg-white/6
              "
            >
              <Bot className="size-5 text-orange-100" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Certification</p>
              <p className="text-xs text-muted-foreground">Anthropic SDK workspace</p>
            </div>
          </div>

          {/* Live API status — reads from the global provider */}
          <ApiStatusIndicator showModel />
        </nav>

        {/* ── Hero + Cards grid ─────────────────────────────────────────── */}
        <div
          className="
            grid flex-1 items-center gap-10 py-12
            lg:grid-cols-[0.95fr_1.05fr]
          "
        >
          {/* Hero copy */}
          <div className="max-w-2xl">
            <p
              className="
                animate-hero-word mb-4 inline-flex items-center gap-2 rounded-full
                border border-orange-200/20 bg-orange-300/8 px-3 py-1 text-xs
                font-medium text-orange-200/80
              "
              style={{ animationDelay: '0ms' }}
            >
              <Zap className="size-3" />
              FastAPI · Next.js · Anthropic SDK
            </p>

            <h1
              className="
                animate-hero-word text-4xl/tight font-semibold tracking-normal
                text-foreground
                sm:text-5xl/tight
              "
              style={{ animationDelay: '80ms' }}
            >
              Learn the Claude API by building real features.
            </h1>

            <p
              className="
                animate-hero-word mt-5 max-w-xl text-base/7 text-muted-foreground
              "
              style={{ animationDelay: '160ms' }}
            >
              Each page is a focused, production-shaped exercise — from
              single-turn prompts to multi-turn conversations. Tune your
              prompts, inspect every token, and verify your backend without
              leaving the browser.
            </p>

            <div
              className="animate-hero-word mt-8 flex flex-wrap gap-3"
              style={{ animationDelay: '240ms' }}
            >
              <Button asChild size="lg">
                <Link href="/chat">
                  <MessageSquare className="size-4" />
                  Start chatting
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="p-4">
                <Link href="/playground">
                  <FlaskConical className="size-4" />
                  Open playground
                </Link>
              </Button>
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid gap-4">
            {features.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className="
                  animate-slide-up-fade group flex items-center justify-between
                  gap-4 rounded-xl border border-white/10 bg-white/4 p-5
                  transition-all
                  hover:border-orange-200/30 hover:bg-white/[0.07]
                  hover:shadow-lg hover:shadow-black/20
                "
                style={{ animationDelay: `${160 + i * 80}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="
                      flex size-10 shrink-0 items-center justify-center rounded-lg
                      bg-orange-300/10 text-orange-100 transition-colors
                      group-hover:bg-orange-300/16
                    "
                  >
                    <item.icon className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-foreground">{item.title}</h2>
                      <span
                        className="
                          hidden rounded-sm border border-white/10 bg-white/5 px-1.5
                          py-0.5 font-mono text-[10px] text-muted-foreground/70
                          sm:inline
                        "
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm/6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  className="
                    size-4 shrink-0 text-muted-foreground/40 transition-all
                    group-hover:translate-x-0.5 group-hover:text-orange-200
                  "
                />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
