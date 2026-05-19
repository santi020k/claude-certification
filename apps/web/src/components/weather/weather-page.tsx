'use client'

import { type SyntheticEvent, useId, useState } from 'react'

import Link from 'next/link'

import { ApiStatusIndicator } from '@/components/api-status/indicator'
import {
  getApiBaseUrl,
  parseRetryAfter,
  readErrorMessage,
  readWeatherResponse
} from '@/components/claude-playground/api'
import { MarkdownAnswer } from '@/components/claude-playground/primitives/markdown-answer'
import { AmbientBackground } from '@/components/claude-playground/sections/ambient-background'
import type { WeatherResponse } from '@/components/claude-playground/types'

import {
  ArrowLeft,
  CloudSun,
  Droplets,
  Loader2,
  MapPin,
  Send,
  Thermometer,
  Wind
} from 'lucide-react'

import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Textarea } from '@repo/ui/components/ui/textarea'

const EXAMPLES = [
  'Should I take an umbrella?',
  'Is it good weather for a walk?',
  'What should I wear outside?'
]

export function WeatherPage() {
  const locationId = useId()
  const questionId = useId()
  const [location, setLocation] = useState('Bogotá')
  const [question, setQuestion] = useState('Should I bring a jacket today?')
  const [unit, setUnit] = useState<'celsius' | 'fahrenheit'>('celsius')
  const [result, setResult] = useState<WeatherResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()

    setError(null)

    setIsLoading(true)

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/weather`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          question,
          unit,
          max_tokens: 500
        })
      })

      if (!response.ok) {
        const message = await readErrorMessage(response)

        const retryAfter = response.status === 429 ?
          ` Try again in ${parseRetryAfter(response)} seconds.` :
          ''

        throw new Error(`${message}${retryAfter}`)
      }

      setResult(await readWeatherResponse(response))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  const weather = result?.weather

  return (
    <main className="relative flex min-h-screen flex-col">
      <AmbientBackground />

      <section className="
        relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10
        sm:px-6
        lg:px-10
      "
      >
        <nav className="animate-fade-in flex items-center justify-between py-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Home
            </Link>
          </Button>
          <ApiStatusIndicator showModel />
        </nav>

        <div className="
          grid flex-1 items-start gap-6 py-8
          lg:grid-cols-[0.9fr_1.1fr]
        "
        >
          <form
            onSubmit={handleSubmit}
            className="
              animate-slide-up-fade rounded-xl border border-white/10 bg-white/5
              p-5 shadow-xl shadow-black/20
            "
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="
                flex size-11 items-center justify-center rounded-lg
                bg-sky-400/12 text-sky-200
              "
              >
                <CloudSun className="size-6" />
              </div>
              <div>
                <h1 className="
                  text-2xl font-semibold tracking-normal text-foreground
                "
                >
                  Claude Weather Tool
                </h1>
                <p className="text-sm text-muted-foreground">
                  Claude answers after calling the backend weather function.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2" htmlFor={locationId}>
                <span className="text-sm font-medium text-foreground">
                  Location
                </span>
                <Input
                  id={locationId}
                  value={location}
                  onChange={event => {
                    setLocation(event.target.value)
                  }}
                  placeholder="City or place"
                  required
                />
              </label>

              <label className="grid gap-2" htmlFor={questionId}>
                <span className="text-sm font-medium text-foreground">
                  Question
                </span>
                <Textarea
                  id={questionId}
                  value={question}
                  onChange={event => {
                    setQuestion(event.target.value)
                  }}
                  placeholder="Ask what you need to know about the weather"
                  className="min-h-28 resize-none"
                />
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-medium text-foreground">
                  Units
                </span>
                <div className="
                  grid grid-cols-2 rounded-lg border border-white/10 bg-black/10
                  p-1
                "
                >
                  {(['celsius', 'fahrenheit'] as const).map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setUnit(option)
                      }}
                      className={`
                        rounded-md px-3 py-2 text-sm font-medium transition
                        ${unit === option ?
                      'bg-sky-300/18 text-sky-100' :
                      `
                        text-muted-foreground
                        hover:text-foreground
                      `}
                      `}
                    >
                      {option === 'celsius' ? 'Celsius' : 'Fahrenheit'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map(item => (
                  <Button
                    key={item}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuestion(item)
                    }}
                    className="h-auto px-3 py-2 text-left whitespace-normal"
                  >
                    {item}
                  </Button>
                ))}
              </div>

              {error ?
                (
                  <p className="
                    rounded-lg border border-red-400/20 bg-red-500/10 p-3
                    text-sm text-red-100
                  "
                  >
                    {error}
                  </p>
                ) :
                null}

              <Button type="submit" size="lg" disabled={isLoading}>
                {isLoading ?
                  <Loader2 className="size-4 animate-spin" /> :
                  <Send className="size-4" />}
                Ask Claude
              </Button>
            </div>
          </form>

          <section className="
            animate-slide-up-fade grid gap-4 [animation-delay:120ms]
          "
          >
            <div className="
              rounded-xl border border-white/10 bg-white/5 p-5 shadow-xl
              shadow-black/20
            "
            >
              {weather ?
                (
                  <div className="grid gap-5">
                    <div className="
                      flex flex-wrap items-start justify-between gap-4
                    "
                    >
                      <div>
                        <p className="
                          flex items-center gap-2 text-sm text-muted-foreground
                        "
                        >
                          <MapPin className="size-4" />
                          {weather.location}
                          {weather.country ? `, ${weather.country}` : ''}
                        </p>
                        <p className="
                          mt-2 text-5xl font-semibold text-foreground
                        "
                        >
                          {Math.round(weather.temperature)}
                          {weather.temperature_unit}
                        </p>
                        <p className="mt-1 text-sm text-sky-100">
                          {weather.condition}
                        </p>
                      </div>
                      <div className="
                        rounded-lg border border-white/10 bg-black/10 px-3 py-2
                        text-right text-xs text-muted-foreground
                      "
                      >
                        Tool used
                        <p className="font-mono text-sky-100">
                          {result.tool_name}
                        </p>
                      </div>
                    </div>

                    <div className="
                      grid gap-3
                      sm:grid-cols-3
                    "
                    >
                      <Metric
                        icon={Thermometer}
                        label="Feels like"
                        value={`${Math.round(weather.apparent_temperature)}${weather.temperature_unit}`}
                      />
                      <Metric
                        icon={Droplets}
                        label="Humidity"
                        value={`${weather.humidity}%`}
                      />
                      <Metric
                        icon={Wind}
                        label="Wind"
                        value={`${weather.wind_speed} ${weather.wind_speed_unit}`}
                      />
                    </div>
                  </div>
                ) :
                (
                  <div className="grid min-h-72 place-items-center text-center">
                    <div>
                      <CloudSun className="mx-auto size-12 text-sky-200/70" />
                      <h2 className="mt-4 text-lg font-semibold text-foreground">
                        Ask for current weather
                      </h2>
                      <p className="
                        mx-auto mt-2 max-w-sm text-sm/6 text-muted-foreground
                      "
                      >
                        The backend resolves the location, calls Open-Meteo, then
                        gives Claude the tool result to write the final answer.
                      </p>
                    </div>
                  </div>
                )}
            </div>

            {result ?
              (
                <div className="
                  rounded-xl border border-white/10 bg-white/5 p-5 shadow-xl
                  shadow-black/20
                "
                >
                  <p className="mb-3 text-sm font-medium text-muted-foreground">
                    Claude answer
                  </p>
                  <MarkdownAnswer content={result.answer} />
                  <div className="
                    mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground
                  "
                  >
                    <span>{result.model}</span>
                    <span>
                      {result.input_tokens}
                      {' '}
                      input tokens
                    </span>
                    <span>
                      {result.output_tokens}
                      {' '}
                      output tokens
                    </span>
                  </div>
                </div>
              ) :
              null}
          </section>
        </div>
      </section>
    </main>
  )
}

interface MetricProps {
  icon: typeof Thermometer
  label: string
  value: string
}

function Metric({ icon: Icon, label, value }: MetricProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/10 p-3">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-4 text-sky-200" />
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}
