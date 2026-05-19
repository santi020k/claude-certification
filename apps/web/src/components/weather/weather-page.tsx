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
import type { WeatherResponse } from '@/components/claude-playground/types'

import {
  ArrowLeft,
  CloudSun,
  Droplets,
  Loader2,
  MapPin,
  Send,
  Thermometer,
  Wind,
  Zap
} from 'lucide-react'

import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Textarea } from '@repo/ui/components/ui/textarea'

// ─── Constants ──────────────────────────────────────────────────────────────

const EXAMPLES = [
  'Should I take an umbrella?',
  'Is it good weather for a walk?',
  'What should I wear outside?'
]

// ─── Weather categorisation ──────────────────────────────────────────────────

type WeatherCategory =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'storm'
  | 'fog'

function getWeatherCategory(condition: string): WeatherCategory {
  const c = condition.toLowerCase()
  if (c.includes('thunder') || c.includes('storm')) return 'storm'
  if (
    c.includes('snow') ||
    c.includes('sleet') ||
    c.includes('blizzard') ||
    c.includes('hail') ||
    c.includes('freezing')
  )
    return 'snow'
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower'))
    return 'rain'
  if (c.includes('fog') || c.includes('mist') || c.includes('haze'))
    return 'fog'
  if (c.includes('overcast')) return 'cloudy'
  if (
    c.includes('cloud') ||
    c.includes('partly') ||
    c.includes('broken')
  )
    return 'partly-cloudy'
  return 'clear'
}

// ─── Per-category theming ────────────────────────────────────────────────────

const WEATHER_THEME: Record<
  WeatherCategory,
  {
    blob1: string
    blob2: string
    blob3: string
    icon: string
    temp: string
    badge: string
    border: string
  }
> = {
  clear: {
    blob1: 'bg-amber-400/22',
    blob2: 'bg-orange-300/14',
    blob3: 'bg-yellow-200/10',
    icon: 'text-amber-300',
    temp: 'text-amber-100',
    badge: 'bg-amber-400/15 text-amber-200 border-amber-400/25',
    border: 'border-amber-400/15'
  },
  'partly-cloudy': {
    blob1: 'bg-sky-400/18',
    blob2: 'bg-amber-400/10',
    blob3: 'bg-blue-300/8',
    icon: 'text-sky-200',
    temp: 'text-sky-100',
    badge: 'bg-sky-400/15 text-sky-200 border-sky-400/25',
    border: 'border-sky-400/15'
  },
  cloudy: {
    blob1: 'bg-slate-400/18',
    blob2: 'bg-blue-400/10',
    blob3: 'bg-gray-400/8',
    icon: 'text-slate-300',
    temp: 'text-slate-100',
    badge: 'bg-slate-400/15 text-slate-200 border-slate-400/25',
    border: 'border-slate-400/15'
  },
  rain: {
    blob1: 'bg-blue-500/20',
    blob2: 'bg-indigo-500/14',
    blob3: 'bg-cyan-400/10',
    icon: 'text-blue-300',
    temp: 'text-blue-100',
    badge: 'bg-blue-500/15 text-blue-200 border-blue-400/25',
    border: 'border-blue-400/15'
  },
  snow: {
    blob1: 'bg-blue-200/20',
    blob2: 'bg-slate-300/14',
    blob3: 'bg-indigo-200/10',
    icon: 'text-blue-100',
    temp: 'text-white',
    badge: 'bg-blue-200/15 text-blue-100 border-blue-300/25',
    border: 'border-blue-300/15'
  },
  storm: {
    blob1: 'bg-purple-600/22',
    blob2: 'bg-blue-700/16',
    blob3: 'bg-slate-500/12',
    icon: 'text-purple-300',
    temp: 'text-purple-100',
    badge: 'bg-purple-500/15 text-purple-200 border-purple-400/25',
    border: 'border-purple-400/15'
  },
  fog: {
    blob1: 'bg-gray-400/20',
    blob2: 'bg-slate-300/14',
    blob3: 'bg-stone-300/10',
    icon: 'text-gray-300',
    temp: 'text-gray-100',
    badge: 'bg-gray-400/15 text-gray-200 border-gray-400/25',
    border: 'border-gray-400/15'
  }
}

// ─── Animated SVG weather icons ──────────────────────────────────────────────

function AnimatedWeatherIcon({
  category,
  size = 64,
  className = ''
}: {
  category: WeatherCategory
  size?: number
  className?: string
}) {
  const cx = size / 2
  const cy = size / 2

  if (category === 'clear') {
    const r = size * 0.19
    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className={`weather-icon-clear ${className}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx={cx} cy={cy} r={r} fill="currentColor" />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 45 * Math.PI) / 180
          const inner = r + size * 0.055
          const outer = r + size * 0.13
          return (
            <line
              key={i}
              x1={cx + inner * Math.cos(angle)}
              y1={cy + inner * Math.sin(angle)}
              x2={cx + outer * Math.cos(angle)}
              y2={cy + outer * Math.sin(angle)}
              stroke="currentColor"
              strokeWidth={size * 0.042}
              strokeLinecap="round"
            />
          )
        })}
      </svg>
    )
  }

  if (category === 'partly-cloudy') {
    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
      >
        <g className="weather-sun-group">
          <circle cx={size * 0.35} cy={size * 0.32} r={size * 0.145} fill="#fbbf24" />
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i * 60 * Math.PI) / 180
            const inner = size * 0.175
            const outer = size * 0.225
            return (
              <line
                key={i}
                x1={size * 0.35 + inner * Math.cos(angle)}
                y1={size * 0.32 + inner * Math.sin(angle)}
                x2={size * 0.35 + outer * Math.cos(angle)}
                y2={size * 0.32 + outer * Math.sin(angle)}
                stroke="#fbbf24"
                strokeWidth={size * 0.038}
                strokeLinecap="round"
              />
            )
          })}
        </g>
        <g fill="currentColor" className="weather-cloud-group">
          <ellipse cx={size * 0.58} cy={size * 0.63} rx={size * 0.22} ry={size * 0.135} />
          <ellipse cx={size * 0.4}  cy={size * 0.66} rx={size * 0.155} ry={size * 0.11} />
          <ellipse cx={size * 0.72} cy={size * 0.66} rx={size * 0.14}  ry={size * 0.1} />
          <ellipse cx={size * 0.56} cy={size * 0.52} rx={size * 0.145} ry={size * 0.13} />
        </g>
      </svg>
    )
  }

  if (category === 'cloudy') {
    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="currentColor" opacity={0.35} className="weather-cloud-back">
          <ellipse cx={size * 0.62} cy={size * 0.42} rx={size * 0.22} ry={size * 0.135} />
          <ellipse cx={size * 0.75} cy={size * 0.44} rx={size * 0.145} ry={size * 0.11} />
          <ellipse cx={size * 0.60} cy={size * 0.32} rx={size * 0.135} ry={size * 0.12} />
        </g>
        <g fill="currentColor" className="weather-cloud-front">
          <ellipse cx={size * 0.46} cy={size * 0.58} rx={size * 0.245} ry={size * 0.155} />
          <ellipse cx={size * 0.27} cy={size * 0.61} rx={size * 0.165} ry={size * 0.125} />
          <ellipse cx={size * 0.65} cy={size * 0.61} rx={size * 0.185} ry={size * 0.12} />
          <ellipse cx={size * 0.44} cy={size * 0.47} rx={size * 0.165} ry={size * 0.145} />
        </g>
      </svg>
    )
  }

  if (category === 'rain') {
    const drops = [size * 0.27, size * 0.39, size * 0.51, size * 0.64]
    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="currentColor">
          <ellipse cx={size * 0.48} cy={size * 0.35} rx={size * 0.24} ry={size * 0.15} />
          <ellipse cx={size * 0.28} cy={size * 0.38} rx={size * 0.165} ry={size * 0.12} />
          <ellipse cx={size * 0.68} cy={size * 0.38} rx={size * 0.16}  ry={size * 0.12} />
          <ellipse cx={size * 0.46} cy={size * 0.24} rx={size * 0.155} ry={size * 0.14} />
        </g>
        {drops.map((x, i) => (
          <line
            key={i}
            x1={x}
            y1={size * 0.57}
            x2={x - size * 0.05}
            y2={size * 0.76}
            stroke="currentColor"
            strokeWidth={size * 0.034}
            strokeLinecap="round"
            style={{
              animation: `rain-drop 1.3s ease-in ${i * 0.22}s infinite`,
              opacity: 0.85
            }}
          />
        ))}
      </svg>
    )
  }

  if (category === 'snow') {
    const flakes = [size * 0.24, size * 0.36, size * 0.48, size * 0.6, size * 0.72]
    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="currentColor">
          <ellipse cx={size * 0.48} cy={size * 0.35} rx={size * 0.24} ry={size * 0.15} />
          <ellipse cx={size * 0.28} cy={size * 0.38} rx={size * 0.165} ry={size * 0.12} />
          <ellipse cx={size * 0.68} cy={size * 0.38} rx={size * 0.16}  ry={size * 0.12} />
          <ellipse cx={size * 0.46} cy={size * 0.24} rx={size * 0.155} ry={size * 0.14} />
        </g>
        {flakes.map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={size * (0.63 + (i % 2) * 0.1)}
            r={size * 0.042}
            fill="currentColor"
            style={{
              animation: `snow-fall 2.2s ease-in ${i * 0.28}s infinite`,
              opacity: 0.9
            }}
          />
        ))}
      </svg>
    )
  }

  if (category === 'storm') {
    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="currentColor">
          <ellipse cx={size * 0.48} cy={size * 0.28} rx={size * 0.27} ry={size * 0.16} />
          <ellipse cx={size * 0.26} cy={size * 0.31} rx={size * 0.185} ry={size * 0.135} />
          <ellipse cx={size * 0.71} cy={size * 0.31} rx={size * 0.185} ry={size * 0.135} />
          <ellipse cx={size * 0.46} cy={size * 0.17} rx={size * 0.165} ry={size * 0.145} />
        </g>
        <polyline
          points={`${size * 0.54},${size * 0.48} ${size * 0.41},${size * 0.64} ${size * 0.5},${size * 0.64} ${size * 0.37},${size * 0.83}`}
          stroke="#fbbf24"
          strokeWidth={size * 0.048}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="weather-lightning"
        />
        {[size * 0.23, size * 0.73].map((x, i) => (
          <line
            key={i}
            x1={x}
            y1={size * 0.5}
            x2={x - size * 0.04}
            y2={size * 0.66}
            stroke="currentColor"
            strokeWidth={size * 0.032}
            strokeLinecap="round"
            style={{
              animation: `rain-drop 1.1s ease-in ${i * 0.35}s infinite`,
              opacity: 0.5
            }}
          />
        ))}
      </svg>
    )
  }

  // fog
  const fogLines = [size * 0.28, size * 0.38, size * 0.48, size * 0.58, size * 0.68]
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={`weather-icon-fog ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {fogLines.map((y, i) => (
        <line
          key={i}
          x1={i % 2 === 0 ? size * 0.14 : size * 0.22}
          y1={y}
          x2={i % 2 === 0 ? size * 0.86 : size * 0.78}
          y2={y}
          stroke="currentColor"
          strokeWidth={size * 0.056}
          strokeLinecap="round"
          style={{
            opacity: 0.9 - i * 0.12,
            animationDelay: `${i * 0.5}s`
          }}
        />
      ))}
    </svg>
  )
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`rounded shimmer ${className}`} />
}

function WeatherSkeleton() {
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-16 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex flex-col items-end gap-3">
          <Skeleton className="size-[72px] rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="rounded-lg border border-white/10 bg-black/10 p-3"
          >
            <Skeleton className="mb-3 h-3 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

const FLOW_STEPS = [
  { icon: MapPin,   label: 'Location' },
  { icon: CloudSun, label: 'Open-Meteo' },
  { icon: Zap,      label: 'Claude' }
]

function WeatherEmptyState() {
  return (
    <div className="grid min-h-72 place-items-center text-center">
      <div className="space-y-6">
        <div className="mx-auto size-16 text-sky-200/55">
          <AnimatedWeatherIcon category="partly-cloudy" size={64} className="size-full" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Ask for current weather
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-sm/6 text-muted-foreground">
            The backend resolves the location, calls Open-Meteo, then gives
            Claude the tool result to write the final answer.
          </p>
        </div>

        {/* 3-step flow diagram */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          {FLOW_STEPS.map(({ icon: Icon, label }, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1.5">
                <div className="
                  flex size-9 items-center justify-center rounded-lg
                  border border-white/10 bg-white/5
                ">
                  <Icon className="size-4 text-sky-200/65" />
                </div>
                <span>{label}</span>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <span className="mb-4 text-white/20">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Metric card ─────────────────────────────────────────────────────────────

interface MetricProps {
  icon: typeof Thermometer
  label: string
  value: string
  delay?: string
  accent?: string
}

function Metric({
  icon: Icon,
  label,
  value,
  delay = 'delay-0',
  accent = 'text-sky-200'
}: MetricProps) {
  return (
    <div
      className={`animate-slide-up-fade rounded-lg border border-white/10 bg-black/10 p-3 card-hover ${delay}`}
    >
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`size-4 ${accent}`} />
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

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
    setResult(null)
    setIsLoading(true)

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/weather`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, question, unit, max_tokens: 500 })
      })

      if (!response.ok) {
        const message = await readErrorMessage(response)
        const retryAfter =
          response.status === 429
            ? ` Try again in ${parseRetryAfter(response)} seconds.`
            : ''
        throw new Error(`${message}${retryAfter}`)
      }

      setResult(await readWeatherResponse(response))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  const weather  = result?.weather
  const category = weather ? getWeatherCategory(weather.condition) : null
  const theme    = category ? WEATHER_THEME[category] : null

  return (
    <main className="relative flex min-h-screen flex-col">
      {/* ── Dynamic weather-aware ambient background ──────────────────── */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div
          className={`
            blob-1 absolute -top-48 -left-48 size-[700px] rounded-full
            blur-[130px] transition-colors duration-[2000ms]
            ${theme?.blob1 ?? 'bg-orange-800/10'}
          `}
        />
        <div
          className={`
            blob-2 absolute -right-48 -bottom-64 size-[800px] rounded-full
            blur-[150px] transition-colors duration-[2000ms]
            ${theme?.blob2 ?? 'bg-stone-300/6'}
          `}
        />
        <div
          className={`
            blob-3 absolute top-1/3 left-1/2 size-[500px] -translate-x-1/2
            rounded-full blur-[110px] transition-colors duration-[2000ms]
            ${theme?.blob3 ?? 'bg-amber-900/8'}
          `}
        />
      </div>

      <section className="
        relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col
        px-4 py-10 sm:px-6 lg:px-10
      ">
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
        ">
          {/* ── Form panel ──────────────────────────────────────────── */}
          <form
            onSubmit={handleSubmit}
            className="
              animate-slide-up-fade rounded-xl border border-white/10
              bg-white/5 p-5 shadow-xl shadow-black/20 card-hover
            "
          >
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <div
                className={`
                  flex size-11 items-center justify-center rounded-lg
                  transition-colors duration-1000
                  ${theme ? `bg-white/8 ${theme.icon}` : 'bg-sky-400/12 text-sky-200'}
                `}
              >
                {category ? (
                  <AnimatedWeatherIcon
                    category={category}
                    size={28}
                    className="size-7"
                  />
                ) : (
                  <CloudSun className="size-6" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-normal text-foreground">
                  Claude Weather Tool
                </h1>
                <p className="text-sm text-muted-foreground">
                  Claude answers after calling the backend weather function.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {/* Location */}
              <label className="grid gap-2" htmlFor={locationId}>
                <span className="text-sm font-medium text-foreground">
                  Location
                </span>
                <Input
                  id={locationId}
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="City or place"
                  required
                />
              </label>

              {/* Question */}
              <label className="grid gap-2" htmlFor={questionId}>
                <span className="text-sm font-medium text-foreground">
                  Question
                </span>
                <Textarea
                  id={questionId}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Ask what you need to know about the weather"
                  className="min-h-28 resize-none"
                />
              </label>

              {/* Unit toggle */}
              <div className="grid gap-2">
                <span className="text-sm font-medium text-foreground">
                  Units
                </span>
                <div className="
                  grid grid-cols-2 rounded-lg border border-white/10
                  bg-black/10 p-1
                ">
                  {(['celsius', 'fahrenheit'] as const).map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setUnit(option)}
                      className={`
                        rounded-md px-3 py-2 text-sm font-medium
                        transition-all duration-200
                        ${unit === option
                          ? 'bg-sky-300/18 text-sky-100 shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'}
                      `}
                    >
                      {option === 'celsius' ? 'Celsius' : 'Fahrenheit'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Example chips */}
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map(item => (
                  <Button
                    key={item}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuestion(item)}
                    className="
                      h-auto px-3 py-2 text-left whitespace-normal
                      transition-all duration-150 hover:scale-[1.02]
                      active:scale-[0.98]
                    "
                  >
                    {item}
                  </Button>
                ))}
              </div>

              {/* Error */}
              {error ? (
                <p className="
                  animate-scale-in rounded-lg border border-red-400/20
                  bg-red-500/10 p-3 text-sm text-red-100
                ">
                  {error}
                </p>
              ) : null}

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="
                  relative overflow-hidden transition-all duration-200
                  active:scale-[0.98]
                "
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {isLoading ? 'Asking Claude…' : 'Ask Claude'}
              </Button>
            </div>
          </form>

          {/* ── Result panel ────────────────────────────────────────── */}
          <section className="
            animate-slide-up-fade grid gap-4 [animation-delay:120ms]
          ">
            {/* Weather card */}
            <div
              className={`
                rounded-xl border p-5 shadow-xl shadow-black/20
                transition-all duration-1000
                ${theme
                  ? `${theme.border} bg-white/6`
                  : 'border-white/10 bg-white/5'}
              `}
            >
              {isLoading ? (
                <WeatherSkeleton />
              ) : weather && result && category && theme ? (
                <div className="grid gap-5">
                  {/* Temperature + icon row */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    {/* Left: location + temp + condition */}
                    <div className="animate-slide-up-fade">
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" />
                        {weather.location}
                        {weather.country ? `, ${weather.country}` : ''}
                      </p>
                      <p
                        className={`
                          mt-2 text-6xl font-semibold tracking-tight
                          animate-slide-up-fade [animation-delay:80ms]
                          ${theme.temp}
                        `}
                      >
                        {Math.round(weather.temperature)}
                        <span className="text-4xl">{weather.temperature_unit}</span>
                      </p>
                      <p
                        className={`
                          mt-1.5 text-sm font-medium
                          animate-slide-up-fade [animation-delay:160ms]
                          ${theme.icon}
                        `}
                      >
                        {weather.condition}
                      </p>
                    </div>

                    {/* Right: animated icon + tool badge */}
                    <div className="flex flex-col items-end gap-3">
                      <div
                        className={`
                          animate-scale-in [animation-delay:100ms] ${theme.icon}
                        `}
                      >
                        <AnimatedWeatherIcon
                          category={category}
                          size={72}
                          className="size-[72px]"
                        />
                      </div>
                      <div
                        className={`
                          animate-fade-in [animation-delay:220ms]
                          rounded-lg border px-3 py-1.5 text-right text-xs
                          ${theme.badge}
                        `}
                      >
                        Tool used
                        <p className="font-mono font-medium">{result.tool_name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Metric cards — staggered */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Metric
                      icon={Thermometer}
                      label="Feels like"
                      value={`${Math.round(weather.apparent_temperature)}${weather.temperature_unit}`}
                      delay="delay-0"
                      accent={theme.icon}
                    />
                    <Metric
                      icon={Droplets}
                      label="Humidity"
                      value={`${weather.humidity}%`}
                      delay="delay-75"
                      accent={theme.icon}
                    />
                    <Metric
                      icon={Wind}
                      label="Wind"
                      value={`${weather.wind_speed} ${weather.wind_speed_unit}`}
                      delay="delay-150"
                      accent={theme.icon}
                    />
                  </div>

                  {/* Precipitation banner (only when non-zero) */}
                  {weather.precipitation > 0 ? (
                    <div className="
                      animate-fade-in [animation-delay:300ms]
                      flex items-center gap-2 rounded-lg border
                      border-blue-400/20 bg-blue-500/8 px-3 py-2
                      text-sm text-blue-200
                    ">
                      <Droplets className="size-4 shrink-0" />
                      <span>{weather.precipitation} mm precipitation</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <WeatherEmptyState />
              )}
            </div>

            {/* Claude answer */}
            {result && !isLoading ? (
              <div className="
                animate-slide-up-fade [animation-delay:200ms]
                rounded-xl border border-white/10 bg-white/5 p-5
                shadow-xl shadow-black/20
              ">
                <p className="mb-3 text-sm font-medium text-muted-foreground">
                  Claude answer
                </p>
                <MarkdownAnswer content={result.answer} />
                <div className="
                  mt-4 flex flex-wrap gap-3 border-t border-white/8 pt-3
                  text-xs text-muted-foreground
                ">
                  <span className="font-mono">{result.model}</span>
                  <span>↑ {result.input_tokens} in</span>
                  <span>↓ {result.output_tokens} out</span>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  )
}
