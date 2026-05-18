import Link from 'next/link'

import { AmbientBackground } from '@/components/claude-playground/sections/ambient-background'

import { ArrowRight, Bot, FlaskConical, MessageSquare } from 'lucide-react'

import { Button } from '@repo/ui/components/ui/button'

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <AmbientBackground />

      <section className="
        relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10
        sm:px-6
        lg:px-10
      "
      >
        <nav className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="
              flex size-10 items-center justify-center rounded-md border
              border-white/10 bg-white/6
            "
            >
              <Bot className="size-5 text-orange-100" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Certification</p>
              <p className="text-xs text-muted-foreground">FastAPI + Next.js exercises</p>
            </div>
          </div>
        </nav>

        <div className="
          grid flex-1 items-center gap-10 py-12
          lg:grid-cols-[0.95fr_1.05fr]
        "
        >
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-medium text-orange-100/80">
              Anthropic Claude SDK practice workspace
            </p>
            <h1 className="
              text-4xl/tight font-semibold tracking-normal text-foreground
              sm:text-5xl/tight
            "
            >
              Build each AI exercise as a focused page.
            </h1>
            <p className="mt-5 max-w-xl text-base/7 text-muted-foreground">
              Use the playground for single prompts, open the chat page for
              multi-turn conversations, and keep future examples organized
              without crowding the first screen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/chat">
                  <MessageSquare className="size-4" />
                  Open chat
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/exercises/claude">
                  <FlaskConical className="size-4" />
                  Prompt exercise
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              {
                href: '/chat',
                title: 'Chat',
                description: 'A conversation endpoint that keeps Claude context on the backend.',
                icon: MessageSquare
              },
              {
                href: '/exercises/claude',
                title: 'Prompt playground',
                description: 'The original ask/demo exercise with token limits and health checks.',
                icon: FlaskConical
              }
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="
                  group flex items-center justify-between gap-4 rounded-lg
                  border border-white/10 bg-white/4 p-5 transition
                  hover:border-orange-200/30 hover:bg-white/[0.07]
                "
              >
                <div className="flex items-start gap-4">
                  <div className="
                    flex size-10 items-center justify-center rounded-md
                    bg-orange-300/10 text-orange-100
                  "
                  >
                    <item.icon className="size-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{item.title}</h2>
                    <p className="mt-1 text-sm/6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ArrowRight className="
                  size-4 text-muted-foreground transition
                  group-hover:translate-x-0.5 group-hover:text-orange-100
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
